const Company = require('../models/Company');
const { uploadCompanyLogo, isS3Configured } = require('../services/s3Service');

// @desc    Get tenant company details and settings
// @route   GET /api/v1/company
// @access  Private
const getCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.tenantId);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.status(200).json({ success: true, data: company });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update company branding, contact details, and PDF configuration
// @route   PATCH /api/v1/company
// @access  Private (Admin only)
const updateCompany = async (req, res) => {
    try {
        const { name, email, phone, address, logo, settings } = req.body;

        const company = await Company.findById(req.tenantId);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        if (name) company.name = name;
        if (email) company.email = email;
        if (phone) company.phone = phone;
        if (address) company.address = address;
        if (logo !== undefined) {
            if (logo && logo.startsWith('data:image/') && isS3Configured()) {
                try {
                    const matches = logo.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                    if (matches) {
                        const mimeType = matches[1];
                        const buffer = Buffer.from(matches[2], 'base64');
                        const s3Url = await uploadCompanyLogo(req.tenantId, buffer, mimeType);
                        company.logo = s3Url;
                    } else {
                        company.logo = logo;
                    }
                } catch (s3Err) {
                    console.warn('S3 logo upload failed, saving fallback:', s3Err.message);
                    company.logo = logo;
                }
            } else {
                company.logo = logo;
            }
        }

        if (settings) {
            company.settings = {
                ...company.settings,
                ...settings
            };
            if (settings.bankDetails === null || settings.bankDetails === undefined) {
                delete company.settings.bankDetails;
            }
            company.markModified('settings');
        }

        await company.save();

        res.status(200).json({
            success: true,
            message: 'Company settings updated successfully',
            data: company
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getCompany,
    updateCompany
};
