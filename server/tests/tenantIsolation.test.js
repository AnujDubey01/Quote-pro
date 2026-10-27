const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Product = require('../src/models/Product');
const Role = require('../src/models/Role');
const jwt = require('jsonwebtoken');

// Mock pdfService because puppeteer uses ESM which Jest CommonJS struggles with by default
jest.mock('../src/services/pdfService', () => ({
    generateQuotationPDF: jest.fn().mockResolvedValue(Buffer.from('mock pdf'))
}));

let mongoServer;
let companyA, companyB;
let userA, userB;
let tokenA, tokenB;
let productA, productB;

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '15m' });
};

jest.setTimeout(60000); // 60s timeout for MongoMemoryServer download
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
        driverInfo: { name: 'nodejs', version: '22.0.0' }
    });

    // Create Companies
    companyA = await Company.create({ name: 'Company A', slug: 'company-a', email: 'a@test.com' });
    companyB = await Company.create({ name: 'Company B', slug: 'company-b', email: 'b@test.com' });

    // Create Roles with full access for tests
    const roleA = await Role.create({ companyId: companyA._id, name: 'Admin', permissions: ['*'] });
    const roleB = await Role.create({ companyId: companyB._id, name: 'Admin', permissions: ['*'] });

    // Create Users
    userA = await User.create({ name: 'User A', email: 'a@user.com', password: 'password', companyId: companyA._id, roleId: roleA._id });
    userB = await User.create({ name: 'User B', email: 'b@user.com', password: 'password', companyId: companyB._id, roleId: roleB._id });

    // Generate Tokens
    tokenA = generateToken(userA._id);
    tokenB = generateToken(userB._id);

    // Create Products
    productA = await Product.create({ companyId: companyA._id, name: 'Product A', sku: 'SKU-A', price: 100 });
    productB = await Product.create({ companyId: companyB._id, name: 'Product B', sku: 'SKU-B', price: 200 });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Tenant Isolation Tests', () => {
    
    it('User from Company A should see ONLY products from Company A', async () => {
        const res = await request(app)
            .get('/api/v1/products')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBeTruthy();
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].name).toBe('Product A');
        expect(res.body.data[0].companyId.toString()).toBe(companyA._id.toString());
    });

    it('User from Company A should NOT be able to fetch a specific product from Company B', async () => {
        const res = await request(app)
            .patch(`/api/v1/products/${productB._id}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Hacked Product B' });

        expect(res.statusCode).toEqual(404); // Not found because it's scoped by companyId
        expect(res.body.success).toBeFalsy();
    });

    it('User from Company B should see ONLY products from Company B', async () => {
        const res = await request(app)
            .get('/api/v1/products')
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBeTruthy();
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].name).toBe('Product B');
        expect(res.body.data[0].companyId.toString()).toBe(companyB._id.toString());
    });

    it('User from Company B should NOT be able to delete a product from Company A', async () => {
        const res = await request(app)
            .delete(`/api/v1/products/${productA._id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.statusCode).toEqual(404);
        expect(res.body.success).toBeFalsy();
    });

});
