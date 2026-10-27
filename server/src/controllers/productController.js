const Product = require('../models/Product');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { uploadProductImage, isS3Configured, deleteFromS3, deleteS3ObjectByUrl } = require('../services/s3Service');
const { ingestPdfCatalog } = require('../services/pdfCatalogService');

// @desc    Create a new product
// @route   POST /api/v1/products
// @access  Private
const createProduct = async (req, res) => {
    try {
        const { name, sku, description, category, unit, price, tax, image } = req.body;
        const companyId = req.tenantId;

        const productExists = await Product.findOne({ companyId, sku });
        if (productExists) {
            return res.status(400).json({ success: false, message: 'Product with this SKU already exists' });
        }

        let finalImage = image;
        if (finalImage && finalImage.startsWith('data:image/') && isS3Configured()) {
            try {
                const matches = finalImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                if (matches) {
                    const mimeType = matches[1];
                    const buffer = Buffer.from(matches[2], 'base64');
                    finalImage = await uploadProductImage(companyId, sku, buffer, mimeType);
                }
            } catch (s3Err) {
                console.warn('S3 product image upload failed:', s3Err.message);
            }
        }

        const product = await Product.create({
            companyId,
            name,
            sku,
            description,
            category,
            unit,
            price,
            tax,
            image: finalImage,
        });

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all products (with pagination)
// @route   GET /api/v1/products
// @access  Private
const getProducts = async (req, res) => {
    try {
        const companyId = req.tenantId;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const startIndex = (page - 1) * limit;

        const { search } = req.query;
        let query = { companyId };
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: regex },
                { sku: regex },
                { category: regex },
                { description: regex }
            ];
        }

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            pagination: { page, limit, total },
            data: products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update a product
// @route   PATCH /api/v1/products/:id
// @access  Private
const updateProduct = async (req, res) => {
    try {
        const companyId = req.tenantId;
        const productId = req.params.id;

        let product = await Product.findOne({ _id: productId, companyId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (req.body.image && req.body.image.startsWith('data:image/') && isS3Configured()) {
            try {
                const matches = req.body.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                if (matches) {
                    const mimeType = matches[1];
                    const buffer = Buffer.from(matches[2], 'base64');
                    req.body.image = await uploadProductImage(companyId, product.sku, buffer, mimeType);
                }
            } catch (s3Err) {
                console.warn('S3 product image update failed:', s3Err.message);
            }
        }

        if (req.body.image === null || req.body.image === '') {
            // If user explicitly removes image, delete from S3
            if (product.image) {
                await deleteS3ObjectByUrl(product.image);
            }
        }

        product = await Product.findOneAndUpdate(
            { _id: productId, companyId },
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a product (and remove its S3 image)
// @route   DELETE /api/v1/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
    try {
        const companyId = req.tenantId;
        const productId = req.params.id;

        const product = await Product.findOneAndDelete({ _id: productId, companyId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Clean up from AWS S3
        if (product.image) {
            await deleteS3ObjectByUrl(product.image);
        }

        res.status(200).json({ success: true, message: 'Product and associated S3 image deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete product image from product and S3
// @route   DELETE /api/v1/products/:id/image
// @access  Private
const deleteProductImage = async (req, res) => {
    try {
        const companyId = req.tenantId;
        const productId = req.params.id;

        const product = await Product.findOne({ _id: productId, companyId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.image) {
            await deleteS3ObjectByUrl(product.image);
            product.image = null;
            await product.save();
        }

        res.status(200).json({
            success: true,
            message: 'Image deleted from catalog and AWS S3',
            data: product
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Helper: normalize header string for fuzzy matching (strips spaces, punctuation, lowercase)
const normalizeHeader = (header) => {
    return String(header || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
};

// Comprehensive alias dictionary for enterprise catalogs & diverse vendor sheets
const ALIAS_MAP = {
    sku: [
        'sku', 'productcode', 'productid', 'itemcode', 'itemno', 'itemnumber',
        'modelno', 'modelnumber', 'catno', 'catalognumber', 'partnumber',
        'partno', 'articleno', 'artno', 'code', 'productref', 'ref'
    ],
    name: [
        'name', 'productname', 'itemname', 'itemdescription', 'productdescription', 'description',
        'title', 'producttitle', 'itemtitle', 'product', 'item'
    ],
    price: [
        'price', 'mrp', 'unitprice', 'rate', 'basicprice', 'listprice',
        'cost', 'sellingprice', 'amount', 'unitrate', 'baseprice'
    ],
    category: [
        'category', 'group', 'productgroup', 'collection', 'family',
        'segment', 'type', 'class', 'department'
    ],
    description: [
        'description', 'longdescription', 'itemdescription', 'details',
        'specifications', 'specs', 'notes'
    ],
    unit: [
        'unit', 'uom', 'unitofmeasure', 'qtyunit', 'measurement'
    ],
    tax: [
        'tax', 'gst', 'gstpercent', 'taxpercent', 'taxrate', 'vat', 'igst'
    ],
    image: [
        'image', 'photo', 'picture', 'img', 'imageurl', 'photourl',
        'imagelink', 'imagename', 'images', 'thumbnail', 'pic'
    ]
};

// Numeric cleaner for formatted spreadsheet numbers (e.g., "₹ 46,700.00", "1,39,100", "18%")
const cleanNumeric = (val, defaultVal = 0) => {
    if (val === undefined || val === null || val === '') return defaultVal;
    if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? defaultVal : num;
};

// Auto-detect best column matches from sheet headers
const detectColumnMappings = (sampleRow, userMapping = {}) => {
    const rowKeys = Object.keys(sampleRow || {});
    const normalizedKeyMap = {};
    for (const key of rowKeys) {
        normalizedKeyMap[normalizeHeader(key)] = key;
    }

    const detected = {};
    for (const [targetField, aliases] of Object.entries(ALIAS_MAP)) {
        if (userMapping[targetField] && sampleRow[userMapping[targetField]] !== undefined) {
            detected[targetField] = userMapping[targetField];
            continue;
        }
        for (const alias of aliases) {
            if (normalizedKeyMap[alias] !== undefined) {
                detected[targetField] = normalizedKeyMap[alias];
                break;
            }
        }
    }
    return detected;
};

// @desc    Bulk import products from Excel/CSV or PDF Brochure with Intelligent Auto-Detection
// @route   POST /api/v1/products/bulk-import
// @access  Private
const bulkImportProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an Excel, CSV, or PDF brochure file' });
        }

        const companyId = req.tenantId;
        const filename = (req.file.originalname || '').toLowerCase();
        const mimetype = (req.file.mimetype || '').toLowerCase();

        // 1. If uploaded file is a PDF brochure / catalog:
        if (filename.endsWith('.pdf') || mimetype === 'application/pdf') {
            const updateExisting = req.body.updateExisting === 'true' || req.body.updateExisting === true || req.body.updateExisting === undefined;
            const pdfResult = await ingestPdfCatalog(req.file.buffer, companyId, updateExisting);

            return res.status(200).json({
                success: true,
                message: `Successfully processed PDF brochure: ${pdfResult.totalExtracted} products detected (${pdfResult.inserted} added, ${pdfResult.updated} updated) with images uploaded to S3.`,
                summary: {
                    totalRows: pdfResult.totalExtracted,
                    inserted: pdfResult.inserted,
                    updated: pdfResult.updated,
                    sample: pdfResult.sample
                }
            });
        }

        // 2. Otherwise process as Excel/CSV spreadsheet:
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (data.length === 0) {
            return res.status(400).json({ success: false, message: 'File is empty' });
        }

        // Parse optional user-supplied explicit column mappings
        let userMapping = {};
        if (req.body.columnMapping) {
            try {
                userMapping = typeof req.body.columnMapping === 'string'
                    ? JSON.parse(req.body.columnMapping)
                    : req.body.columnMapping;
            } catch (e) {
                userMapping = {};
            }
        }

        // Detect column bindings from the first row
        const columnMap = detectColumnMappings(data[0], userMapping);

        const errors = [];
        const validProducts = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // +1 for 0-index, +1 for header

            // Extract fields using intelligent detection
            const rawSku = columnMap.sku ? row[columnMap.sku] : (row.sku || row.SKU || row['Product Code'] || row['Product ID']);
            const rawName = columnMap.name ? row[columnMap.name] : (row.name || row.Name || row['Product Name'] || row['Item Name'] || (columnMap.description ? row[columnMap.description] : row.description));
            const rawPrice = columnMap.price ? row[columnMap.price] : (row.price || row.Price || row.MRP || row.Rate || row['Unit Price']);
            const rawCategory = columnMap.category ? row[columnMap.category] : (row.category || row.Category || row.Group || row.Collection || 'General');
            const rawUnit = columnMap.unit ? row[columnMap.unit] : (row.unit || row.Unit || row.UOM || 'pcs');
            const rawTax = columnMap.tax ? row[columnMap.tax] : (row.tax || row.Tax || row.GST || 0);
            const rawDescription = columnMap.description ? row[columnMap.description] : (row.description || row.Description || '');
            const rawImage = columnMap.image ? row[columnMap.image] : (row.image || row.Image || row.Photo || row.Picture || null);

            if (!rawName || !rawSku || rawPrice === undefined) {
                errors.push(`Row ${rowNumber}: Missing required fields (detected SKU: "${rawSku || ''}", Name: "${rawName || ''}", Price: "${rawPrice !== undefined ? rawPrice : ''}")`);
                continue;
            }

            const cleanPrice = cleanNumeric(rawPrice, -1);
            if (cleanPrice < 0) {
                errors.push(`Row ${rowNumber}: Invalid price value "${rawPrice}"`);
                continue;
            }

            const skuStr = String(rawSku).trim();

            // Check duplicate SKU in current batch
            if (validProducts.find(p => p.sku === skuStr)) {
                errors.push(`Row ${rowNumber}: Duplicate SKU "${skuStr}" in file`);
                continue;
            }

            const cleanTax = cleanNumeric(rawTax, 0);

            let finalImage = rawImage ? String(rawImage).trim() : null;
            if (finalImage && !finalImage.startsWith('http://') && !finalImage.startsWith('https://') && !finalImage.startsWith('data:')) {
                if (isS3Configured()) {
                    const stripped = finalImage.replace(/^\/assets\/(by-sku\/)?/, '');
                    const localPath = path.resolve(__dirname, '../../../assets/by-sku', stripped);
                    if (fs.existsSync(localPath)) {
                        try {
                            const buffer = fs.readFileSync(localPath);
                            // Asynchronously uploaded or fallback
                            finalImage = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/tenants/${companyId}/products/${skuStr}.png`;
                        } catch (e) {
                            finalImage = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/tenants/${companyId}/products/${skuStr}.png`;
                        }
                    } else {
                        finalImage = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/tenants/${companyId}/products/${skuStr}.png`;
                    }
                }
            }

            validProducts.push({
                companyId,
                name: String(rawName).trim(),
                sku: skuStr,
                description: rawDescription ? String(rawDescription).trim() : String(rawName).trim(),
                category: rawCategory ? String(rawCategory).trim() : 'General',
                unit: rawUnit ? String(rawUnit).trim() : 'pcs',
                price: cleanPrice,
                tax: cleanTax,
                image: finalImage,
            });
        }

        if (validProducts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid products could be parsed from file',
                detectedColumns: columnMap,
                errors
            });
        }

        // Insert valid products, ignore duplicate SKUs existing in DB
        const result = await Product.insertMany(validProducts, { ordered: false }).catch(err => {
            if (err.code === 11000) {
                return err.insertedDocs;
            }
            throw err;
        });

        res.status(200).json({
            success: true,
            message: `Successfully imported ${result ? result.length : 0} products using smart column detection`,
            summary: {
                totalRows: data.length,
                inserted: result ? result.length : 0,
                failed: data.length - (result ? result.length : 0),
                detectedColumns: columnMap,
                errors: errors.slice(0, 20) // Cap error report preview
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error during bulk import', error: error.message });
    }
};

module.exports = { createProduct, getProducts, updateProduct, deleteProduct, bulkImportProducts, deleteProductImage };
