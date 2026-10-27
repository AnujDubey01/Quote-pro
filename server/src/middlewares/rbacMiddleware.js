const Role = require('../models/Role');

const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Not authorized' });
            }

            // Populate the user's role to check permissions
            const role = await Role.findById(req.user.roleId);
            
            if (!role) {
                return res.status(403).json({ success: false, message: 'Role not found' });
            }

            // Check if the role has the required permission
            // Assuming "platform.superadmin" or similar can override
            const hasPermission = role.permissions.includes(requiredPermission) || role.permissions.includes('*');

            if (!hasPermission) {
                return res.status(403).json({ success: false, message: `Forbidden: Requires ${requiredPermission} permission` });
            }

            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Authorization error', error: error.message });
        }
    };
};

module.exports = { authorize };
