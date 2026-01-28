const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const { authenticateAdminWithRateLimit } = require('../middleware/adminAuth');

/**
 * GET /api/admin/cache/snapshot
 * Get full cache snapshot with stats and all entries
 */
router.get('/cache/snapshot', authenticateAdminWithRateLimit, (req, res) => {
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
router.post('/cache/clear', authenticateAdminWithRateLimit, (req, res) => {
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
