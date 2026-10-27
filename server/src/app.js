const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');

const path = require('path');

const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const teamRoutes = require('./routes/teamRoutes');
const companyRoutes = require('./routes/companyRoutes');
const platformRoutes = require('./routes/platformRoutes');

const app = express();

// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

// Static Assets
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 150 : 5000, // High limit for local dev
});
app.use('/api', limiter);

// Built-in Middlewares (10mb limit for company logo uploads & asset payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging Middleware
app.use(pinoHttp({
    logger: require('pino')({ level: process.env.LOG_LEVEL || 'info' }),
    autoLogging: false,
}));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/platform', platformRoutes);

// Health Check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (req.log && typeof req.log.error === 'function') {
        req.log.error(err);
    } else {
        console.error(err);
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;
