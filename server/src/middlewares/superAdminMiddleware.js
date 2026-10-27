const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!req.user.isSuperAdmin) {
        return res.status(403).json({ success: false, message: 'Forbidden: Platform Super Admin access required' });
    }

    next();
};

module.exports = { requireSuperAdmin };
