require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../src/models/Product');
const Company = require('../src/models/Company');
const { uploadProductImage, isS3Configured } = require('../src/services/s3Service');

async function migrateCatalogToS3() {
    console.log('===========================================================');
    console.log('         MIGRATING PRODUCT CATALOG IMAGES TO AWS S3       ');
    console.log('===========================================================\n');

    if (!isS3Configured()) {
        console.error('❌ AWS S3 is not configured in .env. Exiting.');
        process.exit(1);
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ MONGO_URI is not set in .env. Exiting.');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const baseDir = path.resolve(__dirname, '../../');
    const bySkuDir = path.join(baseDir, 'assets', 'by-sku');
    const assetsDir = path.join(baseDir, 'assets');

    const companies = await Company.find();
    console.log(`Found ${companies.length} tenant company(ies) in database.\n`);

    let totalProducts = 0;
    let migratedCount = 0;
    let alreadyS3Count = 0;
    let missingImageCount = 0;

    for (const company of companies) {
        console.log(`--- Processing Company: "${company.name}" (ID: ${company._id}) ---`);
        const products = await Product.find({ companyId: company._id });
        console.log(`Total products: ${products.length}`);
        totalProducts += products.length;

        for (const product of products) {
            // If already on S3, skip
            if (product.image && product.image.includes('.amazonaws.com/')) {
                alreadyS3Count++;
                continue;
            }

            // Find image on disk
            let localImagePath = null;
            const skuPng = path.join(bySkuDir, `${product.sku}.png`);
            const skuJpg = path.join(bySkuDir, `${product.sku}.jpg`);

            if (fs.existsSync(skuPng)) {
                localImagePath = skuPng;
            } else if (fs.existsSync(skuJpg)) {
                localImagePath = skuJpg;
            } else if (product.image && product.image.startsWith('/assets/')) {
                const stripped = product.image.replace(/^\/assets\//, '');
                const directPath = path.join(assetsDir, stripped);
                if (fs.existsSync(directPath)) {
                    localImagePath = directPath;
                }
            }

            if (!localImagePath) {
                missingImageCount++;
                continue;
            }

            try {
                const buffer = fs.readFileSync(localImagePath);
                const s3Url = await uploadProductImage(company._id, product.sku, buffer, 'image/png');
                
                // Update MongoDB
                product.image = s3Url;
                await product.save();

                migratedCount++;
                console.log(`  [S3 UPLOAD] ${product.sku} -> ${s3Url}`);
            } catch (err) {
                console.error(`  ❌ Failed uploading image for SKU ${product.sku}:`, err.message);
            }
        }
    }

    console.log('\n===========================================================');
    console.log('                 MIGRATION SUMMARY                         ');
    console.log('===========================================================');
    console.log(`Total Products in Database:    ${totalProducts}`);
    console.log(`Newly Uploaded to S3:          ${migratedCount}`);
    console.log(`Already in S3:                 ${alreadyS3Count}`);
    console.log(`No Local Image File Found:     ${missingImageCount}`);
    console.log('===========================================================');

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB. Migration completed successfully.');
}

migrateCatalogToS3().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
});
