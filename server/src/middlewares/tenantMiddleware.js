const requireTenant = (req, res, next) => {
    // The user must be authenticated first (req.user exists)
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Check if the user is associated with a company
    // Super admins might not have a companyId, but if they are interacting with tenant data, 
    // it could be supplied via a header, but for tenant users, it must be their own companyId.
    if (!req.user.companyId) {
        return res.status(403).json({ success: false, message: 'User does not belong to a tenant company' });
    }

    // Attach tenant ID to the request object for easy access in controllers
    req.tenantId = req.user.companyId;

    next();
};

module.exports = { requireTenant };
