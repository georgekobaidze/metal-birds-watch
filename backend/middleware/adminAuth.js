/**
 * Smart admin authentication with rate limiting
 * 
 * Strategy:
 * - Correct API key → Unlimited requests ✅
 * - Wrong API key → Count towards rate limit (max 10/minute) ❌
 * - After 10 failed attempts → Block ALL requests from IP for 1 minute 🚫
 */

const { adminRateLimiter } = require('./rateLimit');

/**
 * Authentication middleware that validates the admin API key.
 */
function authenticateAdmin(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.ADMIN_API_KEY;

  // Check if admin API is configured
  if (!expectedKey) {
    return res.status(503).json({
      error: 'Admin API not configured'
    });
  }

  // Check API key
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized - Invalid or missing API key'
    });
  }

  next();
}

/**
 * Combined authentication + rate limiting middleware.
 * Rate limiting is delegated to the shared adminRateLimiter middleware.
 */
function authenticateAdminWithRateLimit(req, res, next) {
  adminRateLimiter(req, res, function (err) {
    if (err) {
      return next(err);
    }
    authenticateAdmin(req, res, next);
  });
}
module.exports = {
  authenticateAdminWithRateLimit
};
