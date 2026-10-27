const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const Product = require('../models/Product');
const { uploadProductImage, isS3Configured } = require('./s3Service');

/**
 * Executes the Python PyMuPDF extractor on a PDF brochure buffer,
 * uploads extracted images directly to AWS S3, and upserts into MongoDB.
 *
 * @param {Buffer} pdfBuffer - Uploaded PDF buffer
 * @param {string} companyId - Tenant company ID
 * @param {boolean} updateExisting - Whether to update existing products or skip them
 * @returns {Promise<Object>} Ingestion summary
 */
const ingestPdfCatalog = async (pdfBuffer, companyId, updateExisting = true) => {
    const timestamp = Date.now();
    const tempDir = path.join(os.tmpdir(), `pdf_catalog_${timestamp}`);
    const tempPdfPath = path.join(os.tmpdir(), `brochure_${timestamp}.pdf`);
    const scriptPath = path.join(__dirname, 'pdfExtractor.py');

    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    try {
        // Run Python extraction script
        await new Promise((resolve, reject) => {
            execFile('python', [scriptPath, '--input', tempPdfPath, '--outdir', tempDir], (error, stdout, stderr) => {
                if (error) {
                    return reject(new Error(stderr || error.message));
                }
                resolve(stdout);
            });
        });

        const resultsJsonPath = path.join(tempDir, 'results.json');
        if (!fs.existsSync(resultsJsonPath)) {
            throw new Error('PDF extraction completed but no results.json was generated.');
        }

        const rawResults = JSON.parse(fs.readFileSync(resultsJsonPath, 'utf8'));
        if (!Array.isArray(rawResults) || rawResults.length === 0) {
            return {
                totalExtracted: 0,
                inserted: 0,
                updated: 0,
                message: 'No product codes or catalog items detected in the uploaded PDF.'
            };
        }

        let insertedCount = 0;
        let updatedCount = 0;
        const processedProducts = [];

        for (const item of rawResults) {
            let s3ImageUrl = null;

            // Upload cropped image to S3 if available
            if (item.image_file && isS3Configured()) {
                const imgPath = path.join(tempDir, item.image_file);
                if (fs.existsSync(imgPath)) {
                    try {
                        const imgBuffer = fs.readFileSync(imgPath);
                        s3ImageUrl = await uploadProductImage(companyId, item.sku, imgBuffer, 'image/png');
                    } catch (s3Err) {
                        console.warn(`S3 upload failed for ${item.sku}:`, s3Err.message);
                    }
                }
            }

            const existing = await Product.findOne({ companyId, sku: item.sku });

            if (existing) {
                if (updateExisting) {
                    existing.name = item.name || existing.name;
                    if (item.price && item.price > 0) existing.price = item.price;
                    if (item.description) existing.description = item.description;
                    if (s3ImageUrl) existing.image = s3ImageUrl;
                    await existing.save();
                    updatedCount++;
                }
            } else {
                await Product.create({
                    companyId,
                    sku: item.sku,
                    name: item.name,
                    price: item.price || 0,
                    description: item.description,
                    category: item.category || 'Brochure Catalog',
                    unit: item.unit || 'pcs',
                    tax: 0,
                    image: s3ImageUrl
                });
                insertedCount++;
            }

            processedProducts.push({
                sku: item.sku,
                name: item.name,
                price: item.price,
                image: s3ImageUrl
            });
        }

        return {
            totalExtracted: rawResults.length,
            inserted: insertedCount,
            updated: updatedCount,
            sample: processedProducts.slice(0, 5)
        };

    } finally {
        // Clean up temporary files
        try {
            if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
            if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupErr) {
            console.warn('Temporary file cleanup warning:', cleanupErr.message);
        }
    }
};

module.exports = { ingestPdfCatalog };
