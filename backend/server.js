require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const winston = require('winston');

// Create Express app
const app = express();

// ========== LOGGER CONFIGURATION ==========
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'elderly-care-api' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// ========== DATABASE CONNECTION ==========
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elderlycare';
        
        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        mongoose.connection.on('error', (err) => {
            logger.error(`❌ MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('✅ MongoDB reconnected');
        });

    } catch (error) {
        logger.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

// ========== SECURITY MIDDLEWARE ==========

// Helmet for security headers
// Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdn.jsdelivr.net", 
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com"  // ADD THIS for Font Awesome
            ],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdn.jsdelivr.net", 
                "https://cdn.tailwindcss.com"
            ],
            fontSrc: [
                "'self'", 
                "https://fonts.gstatic.com", 
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"  // ADD THIS for Font Awesome fonts
            ],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: [
                "'self'",
                "http://localhost:5000",  // ADD THIS for local API
                "http://127.0.0.1:5000"   // ADD THIS for local API
            ]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'https://elderlycare-backend-f853.onrender.com'];

// CORS configuration - Development (allow all)
if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️  DEVELOPMENT MODE: Allowing all CORS origins');
    app.use(cors({
        origin: true, // Allow all origins in development
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
} else {
    // Production CORS configuration
    const allowedOrigins = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',') 
        : ['https://elderlycare-backend-f853.onrender.com'];
    
    app.use(cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true,
        optionsSuccessStatus: 200
    }));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// ========== BODY PARSING MIDDLEWARE ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ========== REQUEST LOGGING ==========
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
    next();
});

// ========== STATIC FILES ==========
// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend/public');
app.use(express.static(frontendPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0'
}));

// Serve JavaScript files from src folder
app.use('/src/js', express.static(path.join(__dirname, '../frontend/src/js'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0'
}));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        service: 'ElderlyCare Assistant API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// ========== IMPORT ROUTES ==========
// Auth Routes
const authRoutes = require('./routes/authRoutes');

// Other Routes (to be created)
const userRoutes = require('./routes/userRoutes');
const caregiverRoutes = require('./routes/caregiverRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');

// ========== MOUNT ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/caregivers', caregiverRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/hospitals', hospitalRoutes);

// ========== FRONTEND ROUTES ==========
// Serve frontend for all other routes (for SPA)
app.get('*', (req, res) => {
    // Don't serve HTML for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found'
        });
    }
    
    // Serve frontend HTML
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ========== ERROR HANDLING MIDDLEWARE ==========

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error(err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // Don't expose error details in production
    const errorResponse = process.env.NODE_ENV === 'production' && !err.isOperational 
        ? 'Something went wrong!' 
        : message;
    
    res.status(statusCode).json({
        success: false,
        error: errorResponse,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ========== SERVER STARTUP ==========
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();
        
        // Start server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            logger.info(`🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`);
            logger.info(`📁 Frontend served from: ${frontendPath}`);
        });

        // Graceful shutdown
        const gracefulShutdown = () => {
            logger.info('👋 Received shutdown signal. Closing server gracefully...');
            
            server.close(() => {
                logger.info('🔒 HTTP server closed');
                mongoose.connection.close(false, () => {
                    logger.info('🔒 MongoDB connection closed');
                    process.exit(0);
                });
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('⏰ Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            logger.error(`💥 Unhandled Rejection: ${err.message}`);
            throw err;
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            logger.error(`💥 Uncaught Exception: ${err.message}`);
            process.exit(1);
        });

    } catch (error) {
        logger.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app; // For testing