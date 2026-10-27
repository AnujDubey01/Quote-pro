const User = require('../models/User');
const Role = require('../models/Role');

// @desc    Get all team members in the tenant company
// @route   GET /api/v1/team
// @access  Private (Admin, Manager)
const getTeam = async (req, res) => {
    try {
        const users = await User.find({ companyId: req.tenantId })
            .select('-password -refreshToken')
            .populate('roleId', 'name description permissions')
            .sort({ createdAt: -1 });

        const roles = await Role.find({ companyId: req.tenantId });

        res.status(200).json({
            success: true,
            data: {
                members: users,
                availableRoles: roles
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Add a new team member (Salesman, Manager, etc.)
// @route   POST /api/v1/team
// @access  Private (Admin only)
const addTeamMember = async (req, res) => {
    try {
        const { name, email, password, roleId } = req.body;

        if (!name || !email || !password || !roleId) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and role are required'
            });
        }

        // Check if email already registered
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email address already exists'
            });
        }

        // Verify role belongs to company
        const role = await Role.findOne({ _id: roleId, companyId: req.tenantId });
        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role selected for your organization'
            });
        }

        const newUser = await User.create({
            companyId: req.tenantId,
            name,
            email,
            password,
            roleId: role._id,
            status: 'active'
        });

        const userResponse = await User.findById(newUser._id)
            .select('-password -refreshToken')
            .populate('roleId', 'name description');

        res.status(201).json({
            success: true,
            message: 'Team member created successfully',
            data: userResponse
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update team member status (active / suspended)
// @route   PATCH /api/v1/team/:id/status
// @access  Private (Admin only)
const updateMemberStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'suspended', 'inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const user = await User.findOne({ _id: req.params.id, companyId: req.tenantId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Team member not found' });
        }

        // Prevent self-suspension
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot suspend your own account' });
        }

        user.status = status;
        await user.save();

        res.status(200).json({ success: true, message: `Member status updated to ${status}`, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update team member role
// @route   PATCH /api/v1/team/:id/role
// @access  Private (Admin only)
const updateMemberRole = async (req, res) => {
    try {
        const { roleId } = req.body;
        const role = await Role.findOne({ _id: roleId, companyId: req.tenantId });
        if (!role) {
            return res.status(400).json({ success: false, message: 'Invalid role for your company' });
        }

        const user = await User.findOne({ _id: req.params.id, companyId: req.tenantId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Team member not found' });
        }

        user.roleId = role._id;
        await user.save();

        const updated = await User.findById(user._id)
            .select('-password -refreshToken')
            .populate('roleId', 'name description');

        res.status(200).json({ success: true, message: 'Role updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getTeam,
    addTeamMember,
    updateMemberStatus,
    updateMemberRole
};
