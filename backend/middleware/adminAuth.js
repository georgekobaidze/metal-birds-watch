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
setInterval(() => {
  const now = Date.now();
  const CLEANUP_AGE = 5 * 60 * 1000; // 5 minutes
  
  for (const [ip, data] of failedAttempts.entries()) {
    if (now - data.firstAttempt > CLEANUP_AGE) {
      failedAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Combined authentication + rate limiting middleware
 * Only counts failed authentication attempts
 */
function authenticateAdminWithRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.ADMIN_API_KEY;
  
  // Check if admin API is configured
  if (!expectedKey) {
    return res.status(503).json({
      error: 'Admin API not configured'
    });
  }
  
  // Get or initialize tracking for this IP
  if (!failedAttempts.has(ip)) {
    failedAttempts.set(ip, {
      count: 0,
      firstAttempt: Date.now()
    });
  }
  
  const ipData = failedAttempts.get(ip);
  const now = Date.now();
  const WINDOW_MS = 60000; // 1 minute
  const MAX_FAILED_ATTEMPTS = 10;
  
  // Reset counter if window expired
  if (now - ipData.firstAttempt > WINDOW_MS) {
    ipData.count = 0;
    ipData.firstAttempt = now;
  }
  
  // Check if IP is rate limited (too many failed attempts)
  if (ipData.count >= MAX_FAILED_ATTEMPTS) {
    return res.status(429).json({
      error: 'Too many authentication attempts. Please try again later.'
    });
  }
  
  // Check API key
  if (!apiKey || apiKey !== expectedKey) {
    // Wrong key - increment failed attempts counter
    ipData.count++;
    
    return res.status(401).json({
      error: 'Unauthorized - Invalid or missing API key'
    });
  }
  
  // Correct key - reset failed attempts and proceed
  ipData.count = 0;
  next();
}

module.exports = {
  authenticateAdminWithRateLimit
};
