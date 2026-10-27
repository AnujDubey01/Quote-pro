const Role = require('../models/Role');

// @desc    Create a new role
// @route   POST /api/v1/roles
// @access  Private/Company Admin
const createRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const companyId = req.tenantId;

        const roleExists = await Role.findOne({ companyId, name });
        if (roleExists) {
            return res.status(400).json({ success: false, message: 'Role with this name already exists' });
        }

        const role = await Role.create({
            companyId,
            name,
            description,
            permissions,
        });

        res.status(201).json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all roles for the company
// @route   GET /api/v1/roles
// @access  Private
const getRoles = async (req, res) => {
    try {
        const companyId = req.tenantId;
        const roles = await Role.find({ companyId });

        res.status(200).json({ success: true, data: roles });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update a role
// @route   PATCH /api/v1/roles/:id
// @access  Private/Company Admin
const updateRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const companyId = req.tenantId;
        const roleId = req.params.id;

        const role = await Role.findOne({ _id: roleId, companyId });
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        if (role.isSystemRole) {
            return res.status(403).json({ success: false, message: 'Cannot update a system role directly' });
        }

        if (name) role.name = name;
        if (description) role.description = description;
        if (permissions) role.permissions = permissions;

        await role.save();

        res.status(200).json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = { createRole, getRoles, updateRole };
