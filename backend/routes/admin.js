const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const { adminRateLimiter } = require('../middleware/rateLimit');

/**
 * Middleware to authenticate admin requests
 */
function authenticateAdmin(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.ADMIN_API_KEY;
  
  if (!expectedKey) {
    return res.status(503).json({
      error: 'Admin API not configured'
    });
  }
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized - Invalid or missing API key'
    });
  }
  
  next();
}

/**
 * GET /api/admin/cache/stats
 * Get cache statistics (lightweight)
 */
router.get('/cache/stats', adminRateLimiter, authenticateAdmin, (req, res) => {
  try {
    const stats = cache.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      error: 'Failed to fetch cache statistics'
    });
  }
});

/**
 * GET /api/admin/cache/snapshot
 * Get full cache snapshot with all entries (heavier)
 */
router.get('/cache/snapshot', adminRateLimiter, authenticateAdmin, (req, res) => {
  try {
    const snapshot = cache.getSnapshot();
    res.json({
      success: true,
      snapshot
    });
  } catch (error) {
    console.error('Error fetching cache snapshot:', error);
    res.status(500).json({
      error: 'Failed to fetch cache snapshot'
    });
  }
});

/**
 * POST /api/admin/cache/clear
 * Clear all cache (use with caution!)
 */
router.post('/cache/clear', adminRateLimiter, authenticateAdmin, (req, res) => {
  try {
    cache.clear();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache'
    });
  }
});

module.exports = router;
