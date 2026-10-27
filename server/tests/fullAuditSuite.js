const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Product = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const Quotation = require('../src/models/Quotation');
const Role = require('../src/models/Role');

async function runFullAuditSuite() {
  console.log('===========================================================');
  console.log('   FULL ENDPOINT, MULTI-TENANT & SECURITY AUDIT SUITE      ');
  console.log('===========================================================');

  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('✓ Connected to isolated in-memory test database\n');

  process.env.JWT_SECRET = 'audit_suite_jwt_secret_998877';

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(condition, testName, extraDetails = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS ${totalTests}] ${testName}`);
    } else {
      console.error(`  [FAIL ${totalTests}] ${testName} - ${extraDetails}`);
      throw new Error(`Audit Failure on test ${totalTests}: ${testName}`);
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 1: PUBLIC & UNAUTHENTICATED ENDPOINTS
  // --------------------------------------------------------------------------
  console.log('--- SECTION 1: Public & Unauthenticated Endpoints ---');

  // Health Check
  const healthRes = await request(app).get('/health');
  assertTest(healthRes.status === 200 && healthRes.body.status === 'OK', 'GET /health returns 200 OK');

  // Unauthenticated requests should be rejected with 401
  const noAuthProducts = await request(app).get('/api/v1/products');
  assertTest(noAuthProducts.status === 401, 'Unauthenticated GET /api/v1/products returns 401 Unauthorized');

  const noAuthCustomers = await request(app).get('/api/v1/customers');
  assertTest(noAuthCustomers.status === 401, 'Unauthenticated GET /api/v1/customers returns 401 Unauthorized');

  const noAuthQuotations = await request(app).get('/api/v1/quotations');
  assertTest(noAuthQuotations.status === 401, 'Unauthenticated GET /api/v1/quotations returns 401 Unauthorized');

  const noAuthTeam = await request(app).get('/api/v1/team');
  assertTest(noAuthTeam.status === 401, 'Unauthenticated GET /api/v1/team returns 401 Unauthorized');

  const noAuthCompany = await request(app).get('/api/v1/company');
  assertTest(noAuthCompany.status === 401, 'Unauthenticated GET /api/v1/company returns 401 Unauthorized');

  const noAuthPlatform = await request(app).get('/api/v1/platform/stats');
  assertTest(noAuthPlatform.status === 401, 'Unauthenticated GET /api/v1/platform/stats returns 401 Unauthorized');

  const badTokenRes = await request(app)
    .get('/api/v1/products')
    .set('Authorization', 'Bearer forged_invalid_jwt_token_12345');
  assertTest(badTokenRes.status === 401, 'Forged/tampered JWT returns 401 Unauthorized');

  // --------------------------------------------------------------------------
  // SETUP TEST DATA: 2 TENANTS + 4 ROLES (SuperAdmin, Owner, Manager, Sales)
  // --------------------------------------------------------------------------
  console.log('\n--- Provisioning Multi-Tenant Entities & Users ---');

  const companyA = await Company.create({
    name: 'Acme Bathware Alpha',
    slug: 'acme-alpha',
    email: 'contact@alpha.com',
    settings: {
      approvalPriceThreshold: 100000,
      maxDiscountThreshold: 10
    }
  });

  const companyB = await Company.create({
    name: 'Zenith Ceramics Beta',
    slug: 'zenith-beta',
    email: 'contact@beta.com',
    settings: {
      approvalPriceThreshold: 200000,
      maxDiscountThreshold: 15
    }
  });

  // Roles for Company A
  const ownerRoleA = await Role.create({
    companyId: companyA._id,
    name: 'Owner',
    permissions: ['*']
  });

  const managerRoleA = await Role.create({
    companyId: companyA._id,
    name: 'Manager',
    permissions: [
      'product.create', 'product.read', 'product.update', 'product.delete',
      'customer.create', 'customer.read', 'customer.update',
      'quotation.create', 'quotation.read', 'quotation.approve', 'quotation.reject', 'quotation.generate_pdf'
    ]
  });

  const salesRoleA = await Role.create({
    companyId: companyA._id,
    name: 'Sales',
    permissions: [
      'product.read',
      'customer.create', 'customer.read', 'customer.update',
      'quotation.create', 'quotation.read', 'quotation.generate_pdf'
    ]
  });

  // Role for Company B
  const ownerRoleB = await Role.create({
    companyId: companyB._id,
    name: 'Owner',
    permissions: ['*']
  });

  // Role for SuperAdmin
  const superAdminRole = await Role.create({
    companyId: companyA._id,
    name: 'SuperAdmin',
    permissions: ['*']
  });

  // Users
  const superAdminUser = await User.create({
    name: 'Platform SuperAdmin',
    email: 'superadmin@platform.com',
    password: 'password123',
    isSuperAdmin: true,
    roleId: superAdminRole._id,
    role: 'superadmin'
  });

  const ownerA = await User.create({
    name: 'Alice Owner',
    email: 'alice@alpha.com',
    password: 'password123',
    companyId: companyA._id,
    roleId: ownerRoleA._id,
    role: 'owner'
  });

  const managerA = await User.create({
    name: 'Mike Manager',
    email: 'mike@alpha.com',
    password: 'password123',
    companyId: companyA._id,
    roleId: managerRoleA._id,
    role: 'manager'
  });

  const salesA = await User.create({
    name: 'Sam Sales',
    email: 'sam@alpha.com',
    password: 'password123',
    companyId: companyA._id,
    roleId: salesRoleA._id,
    role: 'sales'
  });

  const ownerB = await User.create({
    name: 'Bob Owner B',
    email: 'bob@beta.com',
    password: 'password123',
    companyId: companyB._id,
    roleId: ownerRoleB._id,
    role: 'owner'
  });

  const tokenSuperAdmin = jwt.sign({ id: superAdminUser._id }, process.env.JWT_SECRET);
  const tokenOwnerA = jwt.sign({ id: ownerA._id }, process.env.JWT_SECRET);
  const tokenManagerA = jwt.sign({ id: managerA._id }, process.env.JWT_SECRET);
  const tokenSalesA = jwt.sign({ id: salesA._id }, process.env.JWT_SECRET);
  const tokenOwnerB = jwt.sign({ id: ownerB._id }, process.env.JWT_SECRET);

  console.log('✓ Provisioned SuperAdmin, Owner A, Manager A, Sales A, and Owner B\n');

  // --------------------------------------------------------------------------
  // SECTION 2: PLATFORM SUPERADMIN AUDIT
  // --------------------------------------------------------------------------
  console.log('--- SECTION 2: Platform SuperAdmin Security & Capabilities ---');

  const platformStatsRes = await request(app)
    .get('/api/v1/platform/stats')
    .set('Authorization', `Bearer ${tokenSuperAdmin}`);
  assertTest(platformStatsRes.status === 200 && platformStatsRes.body.success, 'SuperAdmin can access platform stats');

  const ownerBlockedFromPlatform = await request(app)
    .get('/api/v1/platform/stats')
    .set('Authorization', `Bearer ${tokenOwnerA}`);
  assertTest(ownerBlockedFromPlatform.status === 403, 'Company Owner blocked from SuperAdmin platform stats (403)');

  const salesBlockedFromPlatform = await request(app)
    .get('/api/v1/platform/stats')
    .set('Authorization', `Bearer ${tokenSalesA}`);
  assertTest(salesBlockedFromPlatform.status === 403, 'Sales Rep blocked from SuperAdmin platform stats (403)');

  // --------------------------------------------------------------------------
  // SECTION 3: MULTI-TENANT ISOLATION TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 3: Multi-Tenant Data Isolation ---');

  // Create products in Company A and Company B
  const prodA = await Product.create({
    companyId: companyA._id,
    name: 'Alpha Luxury Mixer',
    sku: 'ALPHA-MIX-01',
    price: 25000,
    category: 'Faucets'
  });

  const prodB = await Product.create({
    companyId: companyB._id,
    name: 'Beta Freestanding Tub',
    sku: 'BETA-TUB-01',
    price: 95000,
    category: 'Bathtubs'
  });

  // 1. Product isolation
  const getProdsOwnerA = await request(app)
    .get('/api/v1/products')
    .set('Authorization', `Bearer ${tokenOwnerA}`);
  const allProdASkus = (getProdsOwnerA.body.data || []).map(p => p.sku);
  assertTest(allProdASkus.includes('ALPHA-MIX-01') && !allProdASkus.includes('BETA-TUB-01'), 'Owner A only sees Company A products');

  const getProdsOwnerB = await request(app)
    .get('/api/v1/products')
    .set('Authorization', `Bearer ${tokenOwnerB}`);
  const allProdBSkus = (getProdsOwnerB.body.data || []).map(p => p.sku);
  assertTest(allProdBSkus.includes('BETA-TUB-01') && !allProdBSkus.includes('ALPHA-MIX-01'), 'Owner B only sees Company B products');

  // 2. Cross-tenant product fetch by ID
  const crossProdFetch = await request(app)
    .get(`/api/v1/products/${prodB._id}`)
    .set('Authorization', `Bearer ${tokenOwnerA}`);
  assertTest(crossProdFetch.status === 404, 'User A cannot fetch Company B product by ID (404)');

  // 3. Customer isolation
  const custA = await Customer.create({ companyId: companyA._id, name: 'Client Alpha Ltd', email: 'alpha@client.com' });
  const custB = await Customer.create({ companyId: companyB._id, name: 'Client Beta Ltd', email: 'beta@client.com' });

  const getCustA = await request(app).get('/api/v1/customers').set('Authorization', `Bearer ${tokenOwnerA}`);
  const custANames = (getCustA.body.data || []).map(c => c.name);
  assertTest(custANames.includes('Client Alpha Ltd') && !custANames.includes('Client Beta Ltd'), 'User A only sees Company A customers');

  // 4. Quotation isolation
  const quoteA = await Quotation.create({
    companyId: companyA._id,
    quotationNumber: 'QTN-A-101',
    customerId: custA._id,
    customerSnapshot: { name: 'Client Alpha Ltd' },
    items: [{ name: 'Alpha Mixer', sku: 'ALPHA-MIX-01', unitPrice: 25000, quantity: 2, tax: 0, discount: 0, total: 50000 }],
    subtotal: 50000,
    tax: 0,
    discount: 0,
    total: 50000,
    status: 'approved',
    createdBy: ownerA._id
  });

  const quoteB = await Quotation.create({
    companyId: companyB._id,
    quotationNumber: 'QTN-B-201',
    customerId: custB._id,
    customerSnapshot: { name: 'Client Beta Ltd' },
    items: [{ name: 'Beta Tub', sku: 'BETA-TUB-01', unitPrice: 95000, quantity: 1, tax: 0, discount: 0, total: 95000 }],
    subtotal: 95000,
    tax: 0,
    discount: 0,
    total: 95000,
    status: 'pending',
    createdBy: ownerB._id
  });

  const crossQuoteFetch = await request(app)
    .get(`/api/v1/quotations/${quoteB._id}`)
    .set('Authorization', `Bearer ${tokenOwnerA}`);
  assertTest(crossQuoteFetch.status === 404, 'User A cannot view Company B quotation by ID (404)');

  const crossQuotePDF = await request(app)
    .get(`/api/v1/quotations/${quoteB._id}/pdf`)
    .set('Authorization', `Bearer ${tokenOwnerA}`);
  assertTest(crossQuotePDF.status === 404, 'User A cannot generate PDF for Company B quotation (404)');

  // --------------------------------------------------------------------------
  // SECTION 4: ROLE-BASED ACCESS CONTROL (RBAC) WITHIN COMPANY
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 4: Intra-Tenant Role-Based Access Control ---');

  // 1. Salesperson CANNOT delete products
  const salesDeleteProd = await request(app)
    .delete(`/api/v1/products/${prodA._id}`)
    .set('Authorization', `Bearer ${tokenSalesA}`);
  assertTest(salesDeleteProd.status === 403, 'Sales Rep blocked from deleting product (403)');

  // 2. Salesperson CANNOT approve quotations
  const salesApproveQuote = await request(app)
    .post(`/api/v1/quotations/${quoteB._id}/approve`)
    .set('Authorization', `Bearer ${tokenSalesA}`);
  assertTest(salesApproveQuote.status === 403, 'Sales Rep blocked from approving quotation (403)');

  // 3. Salesperson CANNOT reject quotations
  const salesRejectQuote = await request(app)
    .post(`/api/v1/quotations/${quoteB._id}/reject`)
    .set('Authorization', `Bearer ${tokenSalesA}`);
  assertTest(salesRejectQuote.status === 403, 'Sales Rep blocked from rejecting quotation (403)');

  // 4. Salesperson CANNOT view company team governance
  const salesGetTeam = await request(app)
    .get('/api/v1/team')
    .set('Authorization', `Bearer ${tokenSalesA}`);
  assertTest(salesGetTeam.status === 403, 'Sales Rep blocked from team management (403)');

  // 5. Manager CAN create products
  const mgrCreateProd = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${tokenManagerA}`)
    .send({
      name: 'Manager Created Shower',
      sku: 'MGR-SHW-01',
      price: 18000,
      category: 'Showers'
    });
  assertTest(mgrCreateProd.status === 201 && mgrCreateProd.body.success, 'Catalog Manager can create new products');

  // 5b. Manager CAN update existing product via PATCH /api/v1/products/:id
  const mgrUpdateProd = await request(app)
    .patch(`/api/v1/products/${mgrCreateProd.body.data._id}`)
    .set('Authorization', `Bearer ${tokenManagerA}`)
    .send({
      name: 'Manager Updated Shower Gold',
      price: 22500,
      tax: 18
    });
  assertTest(
    mgrUpdateProd.status === 200 &&
    mgrUpdateProd.body.success &&
    mgrUpdateProd.body.data.price === 22500 &&
    mgrUpdateProd.body.data.name === 'Manager Updated Shower Gold',
    'Catalog Manager can edit product details via PATCH /api/v1/products/:id'
  );

  // 5c. Cross-tenant product update blocked
  const crossProdUpdate = await request(app)
    .patch(`/api/v1/products/${mgrCreateProd.body.data._id}`)
    .set('Authorization', `Bearer ${tokenOwnerB}`)
    .send({ price: 100 });
  assertTest(crossProdUpdate.status === 404, 'User B cannot update Company A product (404)');

  // 6. Manager CAN approve pending quotation in their company
  const pendingQuoteA = await Quotation.create({
    companyId: companyA._id,
    quotationNumber: 'QTN-A-999',
    customerId: custA._id,
    customerSnapshot: { name: 'Client Alpha Ltd' },
    items: [{ name: 'High Value Order', sku: 'ALPHA-MIX-01', unitPrice: 25000, quantity: 10, tax: 0, discount: 0, total: 250000 }],
    subtotal: 250000,
    tax: 0,
    discount: 0,
    total: 250000,
    status: 'pending',
    createdBy: salesA._id
  });

  const mgrApproveQuote = await request(app)
    .post(`/api/v1/quotations/${pendingQuoteA._id}/approve`)
    .set('Authorization', `Bearer ${tokenManagerA}`);
  assertTest(mgrApproveQuote.status === 200 && mgrApproveQuote.body.success, 'Catalog Manager can approve high-value quotes');

  // 7. Verify quote status changed to approved
  const updatedQuoteA = await Quotation.findById(pendingQuoteA._id);
  assertTest(updatedQuoteA.status === 'approved', 'Quotation status successfully updated to approved');

  // --------------------------------------------------------------------------
  // SECTION 5: COMMERCIAL CPQ CEILING & REVISION WORKFLOWS
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 5: Commercial CPQ Ceilings & Revision Workflows ---');

  // 1. Revision creation
  const revisionRes = await request(app)
    .post(`/api/v1/quotations/${quoteA._id}/revise`)
    .set('Authorization', `Bearer ${tokenOwnerA}`);
  if (revisionRes.status !== 201) {
    console.error('DEBUG revisionRes failed:', revisionRes.status, revisionRes.body);
  }
  assertTest(revisionRes.status === 201 && revisionRes.body.data?.quotationNumber === 'QTN-A-101-R1', 'Revision creates QTN-A-101-R1 with revision: 1');

  // 2. High-discount proposal submitted by Sales triggers 'pending' approval
  const highDiscountRes = await request(app)
    .post('/api/v1/quotations')
    .set('Authorization', `Bearer ${tokenSalesA}`)
    .send({
      customerId: custA._id,
      items: [{
        productId: prodA._id,
        name: 'Alpha Luxury Mixer',
        sku: 'ALPHA-MIX-01',
        unitPrice: 25000,
        quantity: 1,
        discountPercent: 20, // Breaches 10% ceiling!
        discount: 5000,
        total: 20000
      }],
      subtotal: 25000,
      total: 20000,
      discount: 5000
    });
  assertTest(highDiscountRes.status === 201 && highDiscountRes.body.data.status === 'pending', 'Proposal with 20% discount (exceeds 10% max threshold) auto-marked "pending"');

  // 3. Normal proposal within limits auto-approved
  const normalRes = await request(app)
    .post('/api/v1/quotations')
    .set('Authorization', `Bearer ${tokenSalesA}`)
    .send({
      customerId: custA._id,
      items: [{
        productId: prodA._id,
        name: 'Alpha Luxury Mixer',
        sku: 'ALPHA-MIX-01',
        unitPrice: 25000,
        quantity: 1,
        discountPercent: 5, // Under 10% ceiling!
        discount: 1250,
        total: 23750
      }],
      subtotal: 25000,
      total: 23750,
      discount: 1250
    });
  assertTest(normalRes.status === 201 && normalRes.body.data.status === 'approved', 'Proposal within threshold limits auto-marked "approved"');

  // 4. PDF Generation
  const pdfRes = await request(app)
    .get(`/api/v1/quotations/${quoteA._id}/pdf`)
    .set('Authorization', `Bearer ${tokenOwnerA}`);
  assertTest(pdfRes.status === 200 && pdfRes.header['content-type'] === 'application/pdf', 'Quotation PDF generation returns 200 with application/pdf');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n===========================================================');
  console.log(`AUDIT RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('STATUS: ALL BACKEND ENDPOINTS & ISOLATION CHECKS VERIFIED ✓');
  console.log('===========================================================');

  await mongoose.disconnect();
  await mongoServer.stop();
}

runFullAuditSuite().catch((err) => {
  console.error('Audit Suite Failed:', err);
  process.exit(1);
});
