const Customer = require('../models/Customer');

// @desc    Create a new customer
// @route   POST /api/v1/customers
// @access  Private
const createCustomer = async (req, res) => {
    try {
        const { name, companyName, email, phone, address, gstNumber } = req.body;
        const companyId = req.tenantId;

        const customer = await Customer.create({
            companyId,
            name,
            companyName,
            email,
            phone,
            address,
            gstNumber,
        });

        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all customers
// @route   GET /api/v1/customers
// @access  Private
const getCustomers = async (req, res) => {
    try {
        const companyId = req.tenantId;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const total = await Customer.countDocuments({ companyId });
        const customers = await Customer.find({ companyId })
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: customers.length,
            pagination: { page, limit, total },
            data: customers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update a customer
// @route   PATCH /api/v1/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
    try {
        const companyId = req.tenantId;
        const customerId = req.params.id;

        let customer = await Customer.findOne({ _id: customerId, companyId });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        customer = await Customer.findOneAndUpdate(
            { _id: customerId, companyId },
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a customer
// @route   DELETE /api/v1/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
    try {
        const companyId = req.tenantId;
        const customerId = req.params.id;

        const customer = await Customer.findOneAndDelete({ _id: customerId, companyId });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.status(200).json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = { createCustomer, getCustomers, updateCustomer, deleteCustomer };
