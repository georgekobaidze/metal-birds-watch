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

module.exports = {
  planesRateLimiter
};
