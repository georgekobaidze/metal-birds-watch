const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy configuration
// Production (Railway/Render): Trust exactly 1 hop (their load balancer)
// Development: Don't trust any proxy (direct connection)
const isProduction = process.env.NODE_ENV === 'production';
app.set('trust proxy', isProduction ? 1 : false);

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            // Allow non-browser or same-origin requests with no Origin header
            return callback(null, true);
        }
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: false
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
const planesRoute = require('./routes/planes');
app.use('/api', planesRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware (must be last!)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error. Please try again later.'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});