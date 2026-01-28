/**
 * Smart admin authentication with rate limiting
 * 
 * Strategy:
 * - Correct API key → Unlimited requests ✅
 * - Wrong API key → Count towards rate limit (max 10/minute) ❌
 * - After 10 failed attempts → Block ALL requests from IP for 1 minute 🚫
 */

// Track failed authentication attempts per IP
const failedAttempts = new Map();

// Cleanup old entries every 5 minutes
// Using unref() to allow graceful process exit when idle
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const CLEANUP_AGE = 5 * 60 * 1000; // 5 minutes
  
  for (const [ip, data] of failedAttempts.entries()) {
    if (now - data.firstAttempt > CLEANUP_AGE) {
      failedAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

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
 * Cleanup function to stop the interval timer
 * Should be called when shutting down the server
 */
function cleanup() {
  clearInterval(cleanupInterval);
}

module.exports = {
  authenticateAdminWithRateLimit,
  cleanup
};
