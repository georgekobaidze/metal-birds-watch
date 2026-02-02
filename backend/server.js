const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
app.use(helmet());  // Security headers
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));  // Limit body size

// Request timeout (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });
  next();
});

// Routes
const planesRoute = require('./routes/planes');
const adminRoute = require('./routes/admin');

app.use('/api', planesRoute);
app.use('/api/admin', adminRoute);

// Health check rate limiter
const healthRateLimiter = rateLimit({
  windowMs: 60000,  // 1 minute
  max: 10,          // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many health check requests' }
});

// Health check endpoint
app.get('/api/health', healthRateLimiter, (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware (must be last!)
app.use((err, req, res, next) => {
    // Log error details (stack only in development)
    const isDev = process.env.NODE_ENV !== 'production';
    console.error('Unhandled error:', {
        message: err.message,
        path: req.path,
        method: req.method,
        ...(isDev && { stack: err.stack })
    });
    
    // Return sanitized error to client (don't expose internal details)
    res.status(500).json({
        error: 'Internal server error. Please try again later.'
    });
});

// Start server with error handling
const env = process.env.NODE_ENV || 'development';
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT} [${env}]`);
})
.on('error', (error) => {
    // Handle server startup errors
    if (error.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use`);
    } else if (error.code === 'EACCES') {
        console.error(`Error: Permission denied to bind to port ${PORT}`);
    } else {
        console.error('Server error:', error.message);
    }
    process.exit(1);
});