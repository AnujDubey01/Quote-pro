const Company = require('../models/Company');
const User = require('../models/User');
const Product = require('../models/Product');
const Quotation = require('../models/Quotation');
const Role = require('../models/Role');

// @desc    Get global platform stats for Super Admin
// @route   GET /api/v1/platform/stats
// @access  Super Admin only
const getPlatformStats = async (req, res) => {
    try {
        const [totalCompanies, totalUsers, totalProducts, totalQuotations, quotes] = await Promise.all([
            Company.countDocuments(),
            User.countDocuments({ isSuperAdmin: { $ne: true } }),
            Product.countDocuments(),
            Quotation.countDocuments(),
            Quotation.find({}, 'total status')
        ]);

        const platformVolume = quotes.reduce((acc, q) => acc + (q.total || 0), 0);
        const approvedCount = quotes.filter(q => q.status === 'approved').length;
        const pendingCount = quotes.filter(q => q.status === 'pending').length;

        res.status(200).json({
            success: true,
            data: {
                totalCompanies,
                totalUsers,
                totalProducts,
                totalQuotations,
                platformVolume,
                approvedCount,
                pendingCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all tenant companies with detailed metrics
// @route   GET /api/v1/platform/companies
// @access  Super Admin only
const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find().sort({ createdAt: -1 });

        // Aggregate statistics per company
        const enrichedCompanies = await Promise.all(
            companies.map(async (comp) => {
                const [userCount, productCount, quoteCount, quotes, owner] = await Promise.all([
                    User.countDocuments({ companyId: comp._id }),
                    Product.countDocuments({ companyId: comp._id }),
                    Quotation.countDocuments({ companyId: comp._id }),
                    Quotation.find({ companyId: comp._id }, 'total status'),
                    User.findOne({ companyId: comp._id }).sort({ createdAt: 1 })
                ]);

                const totalRevenue = quotes.reduce((acc, q) => acc + (q.total || 0), 0);

                return {
                    _id: comp._id,
                    name: comp.name,
                    slug: comp.slug,
                    email: comp.email,
                    phone: comp.phone,
                    address: comp.address,
                    status: comp.status || 'active',
                    settings: comp.settings || {},
                    createdAt: comp.createdAt,
                    stats: {
                        userCount,
                        productCount,
                        quoteCount,
                        totalRevenue
                    },
                    owner: owner ? { name: owner.name, email: owner.email } : null
                };
            })
        );

        res.status(200).json({
            success: true,
            count: enrichedCompanies.length,
            data: enrichedCompanies
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Onboard a brand new tenant company + initial Company Admin
// @route   POST /api/v1/platform/companies
// @access  Super Admin only
const createCompanyWithAdmin = async (req, res) => {
    try {
        const {
            companyName,
            slug,
            email,
            phone,
            address,
            ownerName,
            ownerEmail,
            ownerPassword,
            maxDiscountThreshold
        } = req.body;

        if (!companyName || !ownerEmail || !ownerPassword) {
            return res.status(400).json({ success: false, message: 'Company Name, Owner Email, and Password are required' });
        }

        const generatedSlug = (slug || companyName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check if slug or email exists
        const [existingCompany, existingUser] = await Promise.all([
            Company.findOne({ slug: generatedSlug }),
            User.findOne({ email: ownerEmail.toLowerCase() })
        ]);

        if (existingCompany) {
            return res.status(400).json({ success: false, message: `Company slug "${generatedSlug}" is already in use` });
        }
        if (existingUser) {
            return res.status(400).json({ success: false, message: `User email "${ownerEmail}" already exists` });
        }

        // 1. Create Tenant Company
        const company = await Company.create({
            name: companyName,
            slug: generatedSlug,
            email: email || ownerEmail,
            phone: phone || '',
            address: address || '',
            settings: {
                maxDiscountThreshold: Number(maxDiscountThreshold) || 10,
                currency: 'INR',
                pdfTerms: '1. Quotation valid for 30 days.\n2. 50% advance upon order.\n3. Taxes as applicable.'
            }
        });

        // 2. Create Company Admin Role for the tenant
        const adminRole = await Role.create({
            companyId: company._id,
            name: 'Company Admin',
            description: 'Full administrative access to company tenant space',
            permissions: ['*']
        });

        // 3. Create Manager Role
        await Role.create({
            companyId: company._id,
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
                'quotation.read',
                'quotation.approve',
                'quotation.reject',
                'quotation.generate_pdf',
                'team.read'
            ]
        });

        // 4. Create Salesperson Role
        await Role.create({
            companyId: company._id,
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

        // 5. Create the Initial Company Owner User
        const ownerUser = await User.create({
            companyId: company._id,
            name: ownerName || `${companyName} Owner`,
            email: ownerEmail.toLowerCase(),
            password: ownerPassword,
            roleId: adminRole._id
        });

        res.status(201).json({
            success: true,
            message: `Company "${companyName}" onboarded successfully with owner ${ownerEmail}`,
            data: {
                company,
                owner: {
                    id: ownerUser._id,
                    name: ownerUser.name,
                    email: ownerUser.email,
                    role: 'Company Admin'
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Toggle company active / suspended status
// @route   PATCH /api/v1/platform/companies/:id/status
// @access  Super Admin only
const toggleCompanyStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'suspended', 'inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        company.status = status;
        await company.save();

        res.status(200).json({
            success: true,
            message: `Company status updated to ${status}`,
            data: company
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getPlatformStats,
    getCompanies,
    createCompanyWithAdmin,
    toggleCompanyStatus
};
