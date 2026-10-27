/**
 * Utility script: Clean Orphaned S3 Images
 * 
 * Usage:
 *   node server/src/scripts/cleanOrphanedS3Images.js            (Dry-run: lists unreferenced files without deleting)
 *   node server/src/scripts/cleanOrphanedS3Images.js --delete   (Live: permanently deletes unreferenced images from AWS S3)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { listS3Objects, deleteFromS3, extractS3KeyFromUrl, isS3Configured } = require('../services/s3Service');
const Product = require('../models/Product');

const run = async () => {
    const isDeleteMode = process.argv.includes('--delete');

    console.log('------------------------------------------------------------');
    console.log('   AWS S3 ORPHANED PRODUCT IMAGE CLEANER');
    console.log(`   Mode: ${isDeleteMode ? '⚠️  LIVE PERMANENT PURGE' : '🔍 DRY RUN (Preview only)'}`);
    console.log('------------------------------------------------------------');

    if (!isS3Configured()) {
        console.error('❌ S3 credentials or bucket not configured in .env');
        process.exit(1);
    }

    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // 1. Fetch all product images in MongoDB
        console.log('📦 Fetching active products from database...');
        const products = await Product.find({ image: { $ne: null, $exists: true } }, { image: 1, sku: 1, companyId: 1 }).lean();
        
        const activeS3Keys = new Set();
        for (const p of products) {
            if (p.image) {
                const key = extractS3KeyFromUrl(p.image);
                if (key) activeS3Keys.add(key);
            }
        }
        console.log(`✓ Found ${products.length} products with images referencing ${activeS3Keys.size} unique S3 keys in DB.`);

        // 2. List all S3 objects under 'tenants/'
        console.log('☁️  Scanning AWS S3 bucket for product images...');
        const s3Objects = await listS3Objects('tenants/');
        console.log(`✓ Found ${s3Objects.length} total objects under tenants/ in S3.`);

        // Filter only product images (skip logos/branding)
        const productObjects = s3Objects.filter(obj => obj.key.includes('/products/'));
        console.log(`✓ Found ${productObjects.length} product images in S3.`);

        // 3. Find orphaned objects in S3
        const orphaned = productObjects.filter(obj => !activeS3Keys.has(obj.key));

        console.log('\n================ ANALYSIS REPORT ================');
        console.log(`Total S3 Product Images:  ${productObjects.length}`);
        console.log(`Active DB References:     ${activeS3Keys.size}`);
        console.log(`Orphaned / Unwanted Files: ${orphaned.length}`);
        console.log('=================================================\n');

        if (orphaned.length === 0) {
            console.log('🎉 No orphaned or unwanted images found in S3! Everything is clean.');
            await mongoose.disconnect();
            return;
        }

        console.log('Unreferenced S3 Files:');
        orphaned.forEach((item, index) => {
            const sizeKb = (item.size / 1024).toFixed(1);
            console.log(`  ${index + 1}. ${item.key} (${sizeKb} KB)`);
        });

        if (isDeleteMode) {
            console.log('\n🗑️  Purging unreferenced objects from AWS S3...');
            let deletedCount = 0;
            for (const item of orphaned) {
                await deleteFromS3(item.key);
                deletedCount++;
                process.stdout.write(`   Deleted ${deletedCount}/${orphaned.length}: ${item.key}\r`);
            }
            console.log(`\n✅ Successfully purged ${deletedCount} orphaned images from S3.`);
        } else {
            console.log('\n💡 Tip: Run with `--delete` to permanently purge these files from AWS S3:');
            console.log('   node server/src/scripts/cleanOrphanedS3Images.js --delete');
        }

        await mongoose.disconnect();
        console.log('👋 Finished.');
    } catch (err) {
        console.error('❌ Error during cleanup scan:', err);
        process.exit(1);
    }
};

run();
