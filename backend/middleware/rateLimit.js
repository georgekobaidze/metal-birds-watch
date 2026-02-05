const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('../config');

/**
 * Rate limiter for /api/planes endpoint
 * Limits requests per IP address
 */
const planesRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
  // keyGenerator defaults to req.ip (respects trust proxy and handles IPv6)
});

/**
 * Rate limiter for admin endpoints (failed attemnpts only)
 */
const adminRateLimiter = rateLimit({
  windowMs: 60000,  // 1 minute
  max: 10,  // Max 10 failed attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // Don't count successful requests (status < 400)
  message: {
    error: 'Too many failed authentication attempts. Please wait before trying again.'
  }
});

module.exports = {
  planesRateLimiter,
  adminRateLimiter
};
