const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');

// Helper to generate tokens
const generateTokens = (id) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '7d', // 7 days session lifespan for seamless reloading
    });
    
    const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', {
        expiresIn: '30d',
    });

    return { accessToken, refreshToken };
};

// @desc    Register superadmin or first company admin
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, companyName } = req.body;

        // Ensure user doesn't already exist
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create Company (Simplified for MVP)
        const company = await Company.create({
            name: companyName,
            slug: companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            email: email, // contact email
        });

        // We would assign a proper Role here. For now, assuming a system 'Company Admin' role exists
        // This part needs Role creation logic which we can build later.
        
        const user = await User.create({
            name,
            email,
            password,
            companyId: company._id,
            roleId: company._id, // Placeholder until role is properly fetched
        });

        res.status(201).json({
            success: true,
            message: 'Company and Admin created successfully',
            data: {
                userId: user._id,
                companyId: company._id,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).populate('roleId');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(user._id);

        // Save refresh token to user
        user.refreshToken = refreshToken;
        await user.save();

        // Send refresh token in HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    companyId: user.companyId,
                    roleId: user.roleId?._id || user.roleId,
                    role: user.isSuperAdmin ? 'Super Admin' : (user.roleId?.name || 'Company Admin'),
                    permissions: user.roleId?.permissions || [],
                    isSuperAdmin: !!user.isSuperAdmin,
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        if (req.user) {
            req.user.refreshToken = null;
            await req.user.save();
        }

        res.clearCookie('refreshToken');
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Refresh Token
// @route   POST /api/v1/auth/refresh
// @access  Public
const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Not authorized, no refresh token' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
        
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const tokens = generateTokens(user._id);
        
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            data: {
                accessToken: tokens.accessToken
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};

module.exports = { register, login, logout, refresh };
