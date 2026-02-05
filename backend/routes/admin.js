const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const cache = require('../services/cache');
const { authenticateAdminWithRateLimit } = require('../middleware/adminAuth');

/**
 * Rate limiter for successful admin actions to prevent DoS
 * Limits high-impact operations like cache clearing
 */
const adminActionLimiter = rateLimit({
  windowMs: 60000,  // 1 minute
  max: 10,  // Max 10 actions per minute (even with correct key)
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  message: {
    error: 'Too many admin actions. Please wait before trying again.'
  }
});

/**
 * GET /api/admin/cache/snapshot
 * Get full cache snapshot with stats and all entries
 */
router.get('/cache/snapshot', authenticateAdminWithRateLimit, (req, res) => {
  try {
    const snapshot = cache.getSnapshot();
    res.json({
      snapshot
    });
  } catch (error) {
    console.error('Error fetching cache snapshot:', error.message);
    res.status(500).json({
      error: 'Failed to fetch cache snapshot'
    });
  }
});

/**
 * POST /api/admin/cache/clear
 * Clear all cache (use with caution!)
 */
router.post('/cache/clear', authenticateAdminWithRateLimit, adminActionLimiter, (req, res) => {
  try {
    cache.clear();
    res.json({
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error.message);
    res.status(500).json({
      error: 'Failed to clear cache'
    });
  }
});

module.exports = router;
