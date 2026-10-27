const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;
        
        // Check for token in Authorization header, query parameter, or cookies
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            token = req.query.token;
        } else if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
            token = req.cookies.accessToken || req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // Get user from token
        const user = await User.findById(decoded.id).select('-password').populate('roleId');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
        }
        
        if (user.status !== 'active') {
            return res.status(403).json({ success: false, message: 'User account is not active' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
