const mongoose = require('mongoose');
const Company = require('./src/models/Company');
const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Product = require('./src/models/Product');
const Customer = require('./src/models/Customer');
const Quotation = require('./src/models/Quotation');
require('dotenv').config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/saas_quotation');
        console.log('Connected to MongoDB for seeding...');

        // -------------------------------------------------------------
        // TIER 1: PLATFORM SUPER ADMIN (Owner of the entire CRM SaaS)
        // -------------------------------------------------------------
        let superAdminRole = await Role.findOne({ name: 'Super Admin', isSystemRole: true });
        if (!superAdminRole) {
            superAdminRole = await Role.create({
                name: 'Super Admin',
                description: 'Global CRM platform owner with multi-tenant oversight',
                permissions: ['*'],
                isSystemRole: true,
                companyId: null
            });
        }

        const saEmail = (process.env.SUPERADMIN_EMAIL || 'superadmin@platform.com').toLowerCase().trim();
        const saPassword = process.env.SUPERADMIN_PASSWORD || 'password123';
        const saName = process.env.SUPERADMIN_NAME || 'Platform Super Admin';

        let superAdminUser = await User.findOne({ email: saEmail });
        if (!superAdminUser) {
            superAdminUser = await User.create({
                name: saName,
                email: saEmail,
                password: saPassword,
                roleId: superAdminRole._id,
                isSuperAdmin: true,
                companyId: null
            });
            console.log(`Created Super Admin: ${saEmail}`);
        } else {
            superAdminUser.roleId = superAdminRole._id;
            superAdminUser.isSuperAdmin = true;
            await superAdminUser.save();
        }

        // -------------------------------------------------------------
        // TIER 2: TENANT COMPANY 1 - "Demo Corp" (Kohler Distributor)
        // -------------------------------------------------------------
        let demoCorp = await Company.findOne({ slug: 'demo-corp' });
        if (!demoCorp) {
            demoCorp = await Company.create({
                name: 'Demo Corp',
                slug: 'demo-corp',
                email: 'info@democorp.com',
                phone: '+91 98765 43210',
                address: 'Plot 42, Tech Park, Bangalore, KA 560100',
                settings: {
                    gstNumber: '29ABCDE1234F1Z5',
                    currency: 'INR',
                    maxDiscountThreshold: 10,
                    bankDetails: {
                        bankName: 'HDFC Bank',
                        accountNumber: '50200012345678',
                        ifsc: 'HDFC0001234',
                        branch: 'Koramangala'
                    },
                    pdfTerms: '1. Quotation valid for 30 days from date of issue.\n2. 50% advance payment required upon order confirmation.\n3. Taxes as applicable at 18% GST.'
                }
            });
            console.log('Company created:', demoCorp.name);
        }

        // Roles for Demo Corp
        let adminRole = await Role.findOne({ companyId: demoCorp._id, name: 'Company Admin' });
        if (!adminRole) {
            adminRole = await Role.create({
                companyId: demoCorp._id,
                name: 'Company Admin',
                description: 'Full organizational authority, team management, and settings control',
                permissions: ['*']
            });
        }

        let managerRole = await Role.findOne({ companyId: demoCorp._id, name: 'Manager' });
        if (!managerRole) {
            managerRole = await Role.create({
                companyId: demoCorp._id,
                name: 'Manager',
                description: 'Catalog management, pricing control, and quotation approvals',
                permissions: [
                    'product.create',
                    'product.read',
                    'product.update',
                    'product.delete',
                    'customer.create',
                    'customer.read',
                    'customer.update',
                    'quotation.create',
                    'quotation.read',
                    'quotation.update',
                    'quotation.approve',
                    'quotation.reject',
                    'quotation.generate_pdf',
                    'team.read'
                ]
            });
        }

        let salesRole = await Role.findOne({ companyId: demoCorp._id, name: 'Salesperson' });
        if (!salesRole) {
            salesRole = await Role.create({
                companyId: demoCorp._id,
                name: 'Salesperson',
                description: 'Customer contact management and quotation creation',
                permissions: [
                    'product.read',
                    'customer.create',
                    'customer.read',
                    'customer.update',
                    'quotation.create',
                    'quotation.read',
                    'quotation.generate_pdf'
                ]
            });
        }

        // Users for Demo Corp
        let adminUser = await User.findOne({ email: 'admin@test.com' });
        if (!adminUser) {
            adminUser = await User.create({
                companyId: demoCorp._id,
                name: 'Alex Vance (Company Owner)',
                email: 'admin@test.com',
                password: 'password123',
                roleId: adminRole._id
            });
        }

        let managerUser = await User.findOne({ email: 'manager@test.com' });
        if (!managerUser) {
            managerUser = await User.create({
                companyId: demoCorp._id,
                name: 'Sarah Connor (Catalog Manager)',
                email: 'manager@test.com',
                password: 'password123',
                roleId: managerRole._id
            });
        }

        let salesUser = await User.findOne({ email: 'sales@test.com' });
        if (!salesUser) {
            salesUser = await User.create({
                companyId: demoCorp._id,
                name: 'Raj Patel (Sales Representative)',
                email: 'sales@test.com',
                password: 'password123',
                roleId: salesRole._id
            });
        }

        // Demo Corp Customer
        let demoCustomer = await Customer.findOne({ companyId: demoCorp._id, email: 'procurement@tajhotels.com' });
        if (!demoCustomer) {
            demoCustomer = await Customer.create({
                companyId: demoCorp._id,
                name: 'Vikramaditya Singhania',
                companyName: 'Taj Luxury Resorts & Spas',
                email: 'procurement@tajhotels.com',
                phone: '+91 98200 11223',
                address: 'Apollo Bunder, Colaba, Mumbai, MH 400001',
                gstNumber: '27AABCT1234F1Z8'
            });
        }

        // -------------------------------------------------------------
        // TIER 2: TENANT COMPANY 2 - "Apex Luxury Bathware" (Different Tenant)
        // -------------------------------------------------------------
        let apexCorp = await Company.findOne({ slug: 'apex-luxury' });
        if (!apexCorp) {
            apexCorp = await Company.create({
                name: 'Apex Luxury Bathware',
                slug: 'apex-luxury',
                email: 'contact@apexluxury.in',
                phone: '+91 91234 56789',
                address: 'Tower B, Worldmark, Aerocity, New Delhi 110037',
                settings: {
                    gstNumber: '07AAACA9999F1Z1',
                    currency: 'INR',
                    maxDiscountThreshold: 15,
                    bankDetails: {
                        bankName: 'ICICI Bank',
                        accountNumber: '000405012345',
                        ifsc: 'ICIC0000004',
                        branch: 'Connaught Place'
                    },
                    pdfTerms: '1. Apex Luxury offers 10 years manufacturer warranty.\n2. Payment terms 100% against delivery.\n3. Freight extra at actuals.'
                }
            });
            console.log('Company created:', apexCorp.name);
        }

        // Roles for Apex
        let apexAdminRole = await Role.findOne({ companyId: apexCorp._id, name: 'Company Admin' });
        if (!apexAdminRole) {
            apexAdminRole = await Role.create({
                companyId: apexCorp._id,
                name: 'Company Admin',
                description: 'Full organizational authority for Apex Bathware',
                permissions: ['*']
            });
        }

        let apexManagerRole = await Role.findOne({ companyId: apexCorp._id, name: 'Manager' });
        if (!apexManagerRole) {
            apexManagerRole = await Role.create({
                companyId: apexCorp._id,
                name: 'Manager',
                description: 'Catalog & approvals for Apex',
                permissions: [
                    'product.create', 'product.read', 'product.update', 'product.delete',
                    'customer.create', 'customer.read', 'customer.update',
                    'quotation.read', 'quotation.approve', 'quotation.reject', 'quotation.generate_pdf', 'team.read'
                ]
            });
        }

        let apexSalesRole = await Role.findOne({ companyId: apexCorp._id, name: 'Salesperson' });
        if (!apexSalesRole) {
            apexSalesRole = await Role.create({
                companyId: apexCorp._id,
                name: 'Salesperson',
                description: 'Sales quotes for Apex',
                permissions: [
                    'product.read', 'customer.create', 'customer.read', 'customer.update',
                    'quotation.create', 'quotation.read', 'quotation.generate_pdf'
                ]
            });
        }

        // Apex Users
        let apexOwnerUser = await User.findOne({ email: 'apex@test.com' });
        if (!apexOwnerUser) {
            apexOwnerUser = await User.create({
                companyId: apexCorp._id,
                name: 'Priya Sharma (Apex Owner)',
                email: 'apex@test.com',
                password: 'password123',
                roleId: apexAdminRole._id
            });
            console.log('Created Apex Owner: apex@test.com');
        }

        // Apex Specific Products (Strict Multi-Tenant Isolation proof)
        const apexProductCount = await Product.countDocuments({ companyId: apexCorp._id });
        if (apexProductCount === 0) {
            await Product.create([
                {
                    companyId: apexCorp._id,
                    name: 'Apex Royal Gold Freestanding Bathtub',
                    sku: 'APEX-BATHTUB-01',
                    category: 'Bathtubs',
                    unit: 'pcs',
                    price: 185000,
                    tax: 33300,
                    description: 'Luxury composite stone freestanding bathtub with brushed gold waste fitting.'
                },
                {
                    companyId: apexCorp._id,
                    name: 'Apex Velvet Black Thermostatic Rain Shower System',
                    sku: 'APEX-SHOWER-02',
                    category: 'Showers',
                    unit: 'pcs',
                    price: 64500,
                    tax: 11610,
                    description: 'Ceiling mount 400mm rain shower head with 3-way concealed thermostatic diverter.'
                },
                {
                    companyId: apexCorp._id,
                    name: 'Apex Smart Rimless Japanese Bidet Toilet',
                    sku: 'APEX-BIDET-03',
                    category: 'Toilets',
                    unit: 'pcs',
                    price: 125000,
                    tax: 22500,
                    description: 'Automated sensor seat, instant warm water wash, heated dryer and LED nightlight.'
                }
            ]);
            console.log('Created Apex exclusive products');
        }

        // Apex Customer
        let apexCustomer = await Customer.findOne({ companyId: apexCorp._id, email: 'purchase@dlf.in' });
        if (!apexCustomer) {
            apexCustomer = await Customer.create({
                companyId: apexCorp._id,
                name: 'Rohan Mehra',
                companyName: 'DLF Luxury Residences',
                email: 'purchase@dlf.in',
                phone: '+91 99100 88776',
                address: 'DLF Cyber City, Sector 24, Gurugram, HR 122002',
                gstNumber: '06AAACD5555F1Z2'
            });
        }

        console.log('\n======================================================');
        console.log('👑 PLATFORM SUPER ADMIN (CRM SaaS Owner):');
        console.log('   superadmin@platform.com / password123');
        console.log('------------------------------------------------------');
        console.log('🏢 TENANT COMPANY 1: Demo Corp');
        console.log('   👑 Owner:   admin@test.com   / password123');
        console.log('   👔 Manager: manager@test.com / password123');
        console.log('   💼 Sales:   sales@test.com   / password123');
        console.log('------------------------------------------------------');
        console.log('🏢 TENANT COMPANY 2: Apex Luxury Bathware');
        console.log('   👑 Owner:   apex@test.com    / password123');
        console.log('======================================================\n');

        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seed();
