require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const pino = require('pino');
const logger = pino();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(() => {
    // Start Server
    app.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
}).catch((error) => {
    logger.error('Failed to connect to database', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error(`Error: ${err.message}`);
    // Close server & exit process
    process.exit(1);
});
