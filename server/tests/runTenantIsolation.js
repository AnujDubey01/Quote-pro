const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Product = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const Quotation = require('../src/models/Quotation');
const Role = require('../src/models/Role');
const jwt = require('jsonwebtoken');

async function runTenantIsolationSuite() {
  console.log('--- Starting Multi-Tenant Isolation Test Suite ---');
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('✓ In-memory MongoDB connected successfully');

  process.env.JWT_SECRET = 'test_jwt_secret_12345';

  // Create two distinct tenant companies
  const companyA = await Company.create({ name: 'Company Alpha', slug: 'company-alpha', email: 'alpha@test.com' });
  const companyB = await Company.create({ name: 'Company Beta', slug: 'company-beta', email: 'beta@test.com' });

  // Create roles
  const roleA = await Role.create({ companyId: companyA._id, name: 'Admin', permissions: ['*'] });
  const roleB = await Role.create({ companyId: companyB._id, name: 'Admin', permissions: ['*'] });

  // Create users
  const userA = await User.create({ name: 'Alice Alpha', email: 'alice@alpha.com', password: 'password123', companyId: companyA._id, roleId: roleA._id });
  const userB = await User.create({ name: 'Bob Beta', email: 'bob@beta.com', password: 'password123', companyId: companyB._id, roleId: roleB._id });

  const tokenA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET);
  const tokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET);

  // Create products in Company A and Company B
  const productA = await Product.create({ companyId: companyA._id, name: 'Kohler Purist Faucet', sku: 'K-Purist-A', price: 15000 });
  const productB = await Product.create({ companyId: companyB._id, name: 'Kohler Artifacts Tub', sku: 'K-Artifacts-B', price: 85000 });

  // Test 1: User A should only see Company A products
  const res1 = await request(app)
    .get('/api/v1/products')
    .set('Authorization', `Bearer ${tokenA}`);
  
  if (res1.status === 200 && res1.body.data.length === 1 && res1.body.data[0].sku === 'K-Purist-A') {
    console.log('✓ PASS: User A only sees Company A products');
  } else {
    throw new Error(`Test 1 Failed: User A saw unexpected products: ${JSON.stringify(res1.body)}`);
  }

  // Test 2: User A cannot fetch Company B product by ID
  const res2 = await request(app)
    .get(`/api/v1/products/${productB._id}`)
    .set('Authorization', `Bearer ${tokenA}`);

  if (res2.status === 404) {
    console.log('✓ PASS: User A cannot fetch Company B product (returns 404)');
  } else {
    throw new Error(`Test 2 Failed: User A accessed Company B product with status ${res2.status}`);
  }

  // Test 3: User B only sees Company B products
  const res3 = await request(app)
    .get('/api/v1/products')
    .set('Authorization', `Bearer ${tokenB}`);

  if (res3.status === 200 && res3.body.data.length === 1 && res3.body.data[0].sku === 'K-Artifacts-B') {
    console.log('✓ PASS: User B only sees Company B products');
  } else {
    throw new Error(`Test 3 Failed: User B saw unexpected products: ${JSON.stringify(res3.body)}`);
  }

  // Test 4: User B cannot delete Company A product
  const res4 = await request(app)
    .delete(`/api/v1/products/${productA._id}`)
    .set('Authorization', `Bearer ${tokenB}`);

  if (res4.status === 404) {
    console.log('✓ PASS: User B cannot delete Company A product (returns 404)');
  } else {
    throw new Error(`Test 4 Failed: User B deleted Company A product with status ${res4.status}`);
  }

  // Test 5: Create quotation and test revision endpoint
  const customerA = await Customer.create({
    companyId: companyA._id,
    name: 'Acme Corp',
    email: 'acme@example.com'
  });

  const quoteA = await Quotation.create({
    companyId: companyA._id,
    quotationNumber: 'QTN-5001',
    customerId: customerA._id,
    customerSnapshot: { name: 'Acme Corp' },
    items: [{ name: 'Kohler Purist', sku: 'K-Purist-A', unitPrice: 15000, quantity: 1, total: 15000 }],
    subtotal: 15000,
    tax: 0,
    discount: 0,
    total: 15000,
    createdBy: userA._id,
    status: 'approved'
  });

  const res5 = await request(app)
    .post(`/api/v1/quotations/${quoteA._id}/revise`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ notes: 'Updated pricing revision' });

  if (res5.status === 201 && res5.body.data.revision === 1 && res5.body.data.quotationNumber === 'QTN-5001-R1') {
    console.log('✓ PASS: Revision created successfully with QTN-5001-R1 and revision: 1');
  } else {
    throw new Error(`Test 5 Failed: Revision failed: ${JSON.stringify(res5.body)}`);
  }

  // Test 6: Cross-tenant revision security (User B cannot revise Company A quote)
  const res6 = await request(app)
    .post(`/api/v1/quotations/${quoteA._id}/revise`)
    .set('Authorization', `Bearer ${tokenB}`)
    .send({});

  if (res6.status === 404) {
    console.log('✓ PASS: Cross-tenant revision rejected (returns 404)');
  } else {
    throw new Error(`Test 6 Failed: User B was able to revise Company A quote`);
  }

  // Test 7: Update and retrieve company logo
  const testLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const res7 = await request(app)
    .patch('/api/v1/company')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ logo: testLogo });

  if (res7.status === 200 && res7.body.data.logo === testLogo) {
    console.log('✓ PASS: Company logo updated and saved successfully');
  } else {
    throw new Error(`Test 7 Failed: Failed to update company logo`);
  }

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('--- ALL MULTI-TENANT ISOLATION TESTS PASSED (7/7) ---');
}

runTenantIsolationSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
