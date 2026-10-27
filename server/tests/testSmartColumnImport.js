const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const xlsx = require('xlsx');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'smart_import_test_secret_12345';

const app = require('../src/app');
const Company = require('../src/models/Company');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const Product = require('../src/models/Product');

async function testSmartImport() {
  console.log('===========================================================');
  console.log('  TESTING INTELLIGENT COLUMN MATCHING & DIVERSE HEADERS   ');
  console.log('===========================================================\n');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('✓ Connected to isolated in-memory test database');

  const company = await Company.create({
    name: 'Smart Import Test Co',
    slug: 'smart-test',
    email: 'test@smartimport.com'
  });

  const role = await Role.create({
    companyId: company._id,
    name: 'Catalog Manager',
    permissions: ['*']
  });

  const user = await User.create({
    name: 'Import Admin',
    email: 'admin@smartimport.com',
    password: 'password123',
    companyId: company._id,
    roleId: role._id,
    role: 'owner'
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  let passed = 0;
  let total = 0;

  function assertTest(condition, name) {
    total++;
    if (condition) {
      console.log(`  [PASS ${total}] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL ${total}] ${name}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  // TEST 1: Sheet with "Product Code", "Item Description", "MRP", "Photo" (NO "sku", NO "name", NO "price")
  console.log('\n--- Scenario 1: Vendor Sheet with "Product Code", "Item Description", "MRP", "Photo" ---');
  const vendor1Data = [
    {
      'Product Code': 'VEND-001',
      'Item Description': 'Luxury Rose Gold Basin',
      'MRP': '₹ 85,000.00', // Formatted currency with symbols & comma
      'Collection': 'Royal Suites',
      'GST': '18%',
      'Photo': 'https://s3.amazonaws.com/catalog/vend-001.png'
    },
    {
      'Product Code': 'VEND-002',
      'Item Description': 'Thermostatic Matte Black Shower',
      'MRP': '1,20,500',
      'Collection': 'Modern Baths',
      'GST': '18%',
      'Photo': 'https://s3.amazonaws.com/catalog/vend-002.png'
    }
  ];

  const ws1 = xlsx.utils.json_to_sheet(vendor1Data);
  const wb1 = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb1, ws1, 'Products');
  const buffer1 = xlsx.write(wb1, { type: 'buffer', bookType: 'xlsx' });

  const res1 = await request(app)
    .post('/api/v1/products/bulk-import')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', buffer1, 'vendor1_catalog.xlsx');

  assertTest(res1.status === 200 && res1.body.success, 'Bulk import succeeds with "Product Code", "Item Description", "MRP"');
  assertTest(res1.body.summary?.detectedColumns?.sku === 'Product Code', 'Auto-detected SKU column as "Product Code"');
  assertTest(res1.body.summary?.detectedColumns?.name === 'Item Description', 'Auto-detected Name column as "Item Description"');
  assertTest(res1.body.summary?.detectedColumns?.price === 'MRP', 'Auto-detected Price column as "MRP"');

  const p1 = await Product.findOne({ sku: 'VEND-001' });
  assertTest(p1 && p1.price === 85000, 'Currency symbol and commas parsed cleanly to numeric 85000');
  assertTest(p1 && p1.tax === 18, 'Percentage string "18%" parsed cleanly to numeric 18');
  assertTest(p1 && p1.image === 'https://s3.amazonaws.com/catalog/vend-001.png', 'Photo column preserved as image URL');

  // TEST 2: Sheet with "Item No", "Title", "Rate", "Department"
  console.log('\n--- Scenario 2: Contractor Sheet with "Item No", "Title", "Rate", "Department" ---');
  const vendor2Data = [
    {
      'Item No': 'CAT-777',
      'Title': 'Wall-hung Ceramic Toilet',
      'Rate': 45000,
      'Department': 'Sanitaryware',
      'UOM': 'set'
    }
  ];

  const ws2 = xlsx.utils.json_to_sheet(vendor2Data);
  const wb2 = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb2, ws2, 'Products');
  const buffer2 = xlsx.write(wb2, { type: 'buffer', bookType: 'xlsx' });

  const res2 = await request(app)
    .post('/api/v1/products/bulk-import')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', buffer2, 'contractor_catalog.xlsx');

  assertTest(res2.status === 200 && res2.body.success, 'Bulk import succeeds with "Item No", "Title", "Rate"');
  assertTest(res2.body.summary?.detectedColumns?.sku === 'Item No', 'Auto-detected SKU column as "Item No"');
  assertTest(res2.body.summary?.detectedColumns?.price === 'Rate', 'Auto-detected Price column as "Rate"');

  const p2 = await Product.findOne({ sku: 'CAT-777' });
  assertTest(p2 && p2.price === 45000 && p2.unit === 'set', 'Product CAT-777 created with rate 45000 and unit "set"');

  // TEST 3: Sheet with "Model Number", "Product Name", "Basic Price"
  console.log('\n--- Scenario 3: OEM Sheet with "Model Number", "Product Name", "Basic Price" ---');
  const vendor3Data = [
    {
      'Model Number': 'OEM-999',
      'Product Name': 'Freestanding Stone Tub',
      'Basic Price': '275000.50'
    }
  ];

  const ws3 = xlsx.utils.json_to_sheet(vendor3Data);
  const wb3 = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb3, ws3, 'Products');
  const buffer3 = xlsx.write(wb3, { type: 'buffer', bookType: 'xlsx' });

  const res3 = await request(app)
    .post('/api/v1/products/bulk-import')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', buffer3, 'oem_catalog.xlsx');

  assertTest(res3.status === 200 && res3.body.success, 'Bulk import succeeds with "Model Number", "Basic Price"');
  const p3 = await Product.findOne({ sku: 'OEM-999' });
  assertTest(p3 && p3.price === 275000.5, 'Product OEM-999 created with basic price 275000.50');

  console.log('\n===========================================================');
  console.log(`SMART COLUMN IMPORT AUDIT: ${passed} / ${total} TESTS PASSED`);
  console.log('STATUS: ZERO MANUAL COLUMN RENAMING REQUIRED FOR USERS ✓');
  console.log('===========================================================');

  await mongoose.disconnect();
  await mongoServer.stop();
}

testSmartImport().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
