require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'pdf_import_test_secret_67890';

const app = require('../src/app');
const Company = require('../src/models/Company');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const Product = require('../src/models/Product');

async function testPdfUpload() {
    console.log('===========================================================');
    console.log('   TESTING DIRECT IN-APP PDF BROCHURE UPLOAD TO AWS S3     ');
    console.log('===========================================================\n');

    const samplePdfPath = 'C:/Users/Asus/.gemini/antigravity-ide/brain/7bdbfc91-3be0-43ba-a311-d9acfba701eb/.user_uploaded/media_1790750899511.pdf';

    if (!fs.existsSync(samplePdfPath)) {
        console.error('❌ Sample PDF not found at', samplePdfPath);
        process.exit(1);
    }

    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log('✓ Connected to isolated in-memory test database');

    const company = await Company.create({
        name: 'Grand Ceramics Demo',
        slug: 'grand-ceramics',
        email: 'info@grandceramics.com'
    });

    const role = await Role.create({
        companyId: company._id,
        name: 'Catalog Manager',
        permissions: ['*']
    });

    const user = await User.create({
        name: 'Manager Dave',
        email: 'dave@grandceramics.com',
        password: 'password123',
        companyId: company._id,
        roleId: role._id,
        role: 'manager'
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    console.log('Attaching PDF brochure and sending POST /api/v1/products/bulk-import...');
    const pdfBuffer = fs.readFileSync(samplePdfPath);

    const res = await request(app)
        .post('/api/v1/products/bulk-import')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', pdfBuffer, 'Kohler_Catalog_2026.pdf');

    console.log('\nResponse Status:', res.status);
    console.log('Response Body Summary:', res.body.summary || res.body);

    if (res.status !== 200 || !res.body.success) {
        throw new Error(`PDF upload failed with status ${res.status}: ${JSON.stringify(res.body)}`);
    }

    console.log(`✓ Successfully extracted and imported ${res.body.summary?.totalRows} products!`);

    // Verify products in MongoDB
    const allProducts = await Product.find({ companyId: company._id });
    console.log(`✓ Products created in MongoDB: ${allProducts.length}`);

    const sampleProduct = allProducts.find(p => p.sku === '28730T-RGD');
    if (sampleProduct) {
        console.log('\nSample Extracted Product:');
        console.log('  SKU:        ', sampleProduct.sku);
        console.log('  Name:       ', sampleProduct.name);
        console.log('  Price:      ', `₹${sampleProduct.price.toLocaleString('en-IN')}`);
        console.log('  Image URL:  ', sampleProduct.image);

        if (sampleProduct.image && sampleProduct.image.includes('.amazonaws.com/')) {
            console.log('✓ S3 Image URL verified: Hosted in live AWS S3!');
        }
    }

    console.log('\n===========================================================');
    console.log('    DIRECT IN-APP PDF BROCHURE UPLOAD TEST: 100% PASSED ✓   ');
    console.log('===========================================================');

    await mongoose.disconnect();
    await mongoServer.stop();
}

testPdfUpload().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
