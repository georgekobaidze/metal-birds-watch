const { LRUCache } = require('lru-cache');

/**
 * Smart admin authentication with rate limiting
 * 
 * Strategy:
 * - Correct API key → Unlimited requests ✅
 * - Wrong API key → Count towards rate limit (max 10/minute) ❌
 * - After 10 failed attempts → Block ALL requests from IP for 1 minute 🚫
 */

// Track failed authentication attempts per IP using LRU cache
// LRU cache prevents memory exhaustion from distributed attacks across many IPs
// Max 1000 IPs tracked, with 5-minute TTL for automatic cleanup
const failedAttempts = new LRUCache({
  max: 1000,  // Maximum 1000 IP addresses tracked
  ttl: 5 * 60 * 1000,  // 5 minutes TTL
  ttlAutopurge: true,  // Automatically remove expired entries
  updateAgeOnGet: false,  // Don't reset TTL when accessed (ensures cleanup after 5 minutes)
  updateAgeOnHas: false  // Don't reset TTL on has() check
});

/**
 * Authentication middleware that validates the admin API key.
 */
function authenticateAdminWithRateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
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
    failedAttempts.set(ip, ipData);  // Persist the reset
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
    failedAttempts.set(ip, ipData);  // Persist the increment
    
    return res.status(401).json({
      error: 'Unauthorized - Invalid or missing API key'
    });
  }
  
  // Correct key - reset failed attempts and proceed
  ipData.count = 0;
  failedAttempts.set(ip, ipData);  // Persist the reset
  next();
}

module.exports = {
  authenticateAdminWithRateLimit
};
