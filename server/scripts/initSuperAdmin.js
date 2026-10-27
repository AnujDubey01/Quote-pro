/**
 * Super Admin Provisioning & Security Script
 * 
 * Usage:
 *   node scripts/initSuperAdmin.js <email> <password> [name]
 * 
 * Or configure via server/.env:
 *   SUPERADMIN_EMAIL=your-email@domain.com
 *   SUPERADMIN_PASSWORD=yourSecurePassword123!
 *   SUPERADMIN_NAME="Your Name"
 *   node scripts/initSuperAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Role = require('../src/models/Role');

async function initSuperAdmin() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ Error: MONGO_URI is missing from server/.env');
        process.exit(1);
    }

    const email = process.argv[2] || process.env.SUPERADMIN_EMAIL;
    const password = process.argv[3] || process.env.SUPERADMIN_PASSWORD;
    const name = process.argv[4] || process.env.SUPERADMIN_NAME || 'Platform Super Admin';

    if (!email || !password) {
        console.log('\n======================================================');
        console.log('   QUOTEPRO ENTERPRISE - SUPER ADMIN SETUP TOOL');
        console.log('======================================================');
        console.log('Please provide your Super Admin credentials via CLI or .env:');
        console.log('  Option 1 (CLI):');
        console.log('    node scripts/initSuperAdmin.js admin@mycompany.com MySecretPass123! "My Name"\n');
        console.log('  Option 2 (.env):');
        console.log('    SUPERADMIN_EMAIL=admin@mycompany.com');
        console.log('    SUPERADMIN_PASSWORD=MySecretPass123!');
        console.log('    SUPERADMIN_NAME="My Name"');
        console.log('    node scripts/initSuperAdmin.js');
        console.log('======================================================\n');
        process.exit(1);
    }

    if (password.length < 8) {
        console.error('❌ Error: Password must be at least 8 characters long for production security.');
        process.exit(1);
    }

    try {
        console.log('Connecting to database...');
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        // 1. Ensure Super Admin system role exists
        let superAdminRole = await Role.findOne({ name: 'Super Admin', isSystemRole: true });
        if (!superAdminRole) {
            superAdminRole = await Role.create({
                name: 'Super Admin',
                description: 'Global CRM platform owner with full multi-tenant oversight',
                permissions: ['*'],
                isSystemRole: true,
                companyId: null
            });
            console.log('✓ Created Super Admin system role');
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 2. Check if user already exists
        let adminUser = await User.findOne({ email: normalizedEmail });
        if (adminUser) {
            console.log(`Updating existing user (${normalizedEmail}) to Super Admin...`);
            adminUser.name = name;
            adminUser.password = password; // pre-save hook will hash with bcrypt
            adminUser.roleId = superAdminRole._id;
            adminUser.isSuperAdmin = true;
            adminUser.companyId = null;
            adminUser.status = 'active';
            await adminUser.save();
        } else {
            console.log(`Creating new Super Admin user (${normalizedEmail})...`);
            adminUser = await User.create({
                name,
                email: normalizedEmail,
                password, // pre-save hook will hash with bcrypt
                roleId: superAdminRole._id,
                isSuperAdmin: true,
                companyId: null,
                status: 'active'
            });
        }

        // 3. Clean up demo superadmin if different from the new one
        if (normalizedEmail !== 'superadmin@platform.com') {
            const demoDeleted = await User.deleteMany({ email: 'superadmin@platform.com' });
            if (demoDeleted.deletedCount > 0) {
                console.log('🔒 Security Notice: Demo superadmin account found (superadmin@platform.com).');
                console.log('   Permanently deleted demo account so only YOUR account has Super Admin access.');
            }
        }

        console.log('\n======================================================');
        console.log('✅ SUPER ADMIN PROVISIONED SUCCESSFULLY');
        console.log('======================================================');
        console.log(`Name:        ${adminUser.name}`);
        console.log(`Email:       ${adminUser.email}`);
        console.log(`SuperAdmin:  ${adminUser.isSuperAdmin}`);
        console.log(`Role:        Super Admin (All permissions: ['*'])`);
        console.log('======================================================\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to provision Super Admin:', err.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
}

initSuperAdmin();
