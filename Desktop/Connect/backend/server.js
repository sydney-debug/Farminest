#!/usr/bin/env node

/**
 * FarmTrak 360 Backend Server
 * Main server file for the farm management REST API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');

// Import routes
const authRoutes = require('./routes/auth');
const farmRoutes = require('./routes/farms');
const livestockRoutes = require('./routes/livestock');
const cropRoutes = require('./routes/crops');
const vetRoutes = require('./routes/vets');
const agrovetRoutes = require('./routes/agrovets');
const sharingRoutes = require('./routes/sharing');
const contactRoutes = require('./routes/contact');
const locationRoutes = require('./routes/location');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration in .env file');
    console.error('Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Make supabase client available to routes
app.set('supabase', supabase);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://*.supabase.co"]
        }
    }
}));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://farmtrak-360.vercel.app',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
        next();
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API status endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'FarmTrak 360 API is running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            farms: '/api/farms',
            livestock: '/api/livestock',
            crops: '/api/crops',
            vets: '/api/vets',
            agrovets: '/api/agrovets',
            sharing: '/api/sharing',
            contacts: '/api/contacts',
            locations: '/api/location'
        },
        documentation: '/api/docs'
    });
});

// API Routes (public routes first)
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/farms', authenticateToken, farmRoutes);
app.use('/api/livestock', authenticateToken, livestockRoutes);
app.use('/api/crops', authenticateToken, cropRoutes);
app.use('/api/vets', authenticateToken, vetRoutes);
app.use('/api/agrovets', authenticateToken, agrovetRoutes);
app.use('/api/sharing', authenticateToken, sharingRoutes);
app.use('/api/contact', authenticateToken, contactRoutes);
app.use('/api/location', authenticateToken, locationRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: {
            public: ['GET /health', 'GET /api'],
            auth: ['POST /api/auth/register', 'POST /api/auth/login'],
            protected: [
                'GET /api/farms',
                'POST /api/farms',
                'GET /api/livestock',
                'POST /api/livestock',
                'GET /api/crops',
                'POST /api/crops'
            ]
        }
    });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 FarmTrak 360 server running on port ${PORT}`);
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API info: http://localhost:${PORT}/api`);
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err.message);
    server.close(() => {
        process.exit(1);
    });
});

module.exports = app;
