const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const opensky = require('../services/opensky');
const { validateCoordinates } = require('../middleware/validate');
const { planesRateLimiter } = require('../middleware/rateLimit');
const { FETCH_RADIUS_KM, CACHE_TTL_SECONDS } = require('../config');

// Track in-progress fetches to prevent duplicate API calls (thundering herd)
const fetchesInProgress = new Map();

/**
 * POST /api/planes
 * Get planes near a location with smart polling metadata
 */
router.post('/planes', planesRateLimiter, validateCoordinates, async (req, res) => {
  try {
    const { latitude, longitude, gridKey } = req.validatedLocation;
    
    // Check cache first
    let cachedData = cache.get(gridKey);
    
    if (cachedData) {
      // Cache hit - add jitter to spread out next requests
      const jitter = Math.floor(Math.random() * 6); // 0-5 seconds
      cachedData.nextUpdateIn += jitter;
      
      return res.json(cachedData);
    }
    
    // Cache miss - need to fetch from OpenSky
    // Check if someone else is already fetching for this grid
    if (fetchesInProgress.has(gridKey)) {
      // Wait for the existing fetch to complete
      try {
        await fetchesInProgress.get(gridKey);
        
        // Now it should be in cache
        cachedData = cache.get(gridKey);
        if (cachedData) {
          const jitter = Math.floor(Math.random() * 6);
          cachedData.nextUpdateIn += jitter;
          return res.json(cachedData);
        }
      } catch (error) {
        // If the other fetch failed, return an error instead of retrying
        console.error('Waiting for fetch failed:', error.message);
        return res.status(503).json({
          error: 'Unable to fetch flight data. Please try again later.'
        });
      }
    }
    
    // Start a new fetch
    const fetchPromise = opensky.fetchPlanes(latitude, longitude, FETCH_RADIUS_KM);
    fetchesInProgress.set(gridKey, fetchPromise);
    
    try {
      const planes = await fetchPromise;
      
      // Store in cache
      cache.set(gridKey, planes);
      
      // Get fresh cache data with metadata
      cachedData = cache.get(gridKey);
      
      if (cachedData) {
        const jitter = Math.floor(Math.random() * 6);
        cachedData.nextUpdateIn += jitter;
        return res.json(cachedData);
      }
      
      // Fallback if cache.get somehow fails
      return res.json({
        planes,
        cacheAge: 0,
        nextUpdateIn: CACHE_TTL_SECONDS
      });
      
    } finally {
      // Clean up fetch tracking
      fetchesInProgress.delete(gridKey);
    }
    
  } catch (error) {
    console.error('Error in /api/planes:', error.message);
    
    // Return generic error to user
    return res.status(503).json({
      error: 'Unable to fetch flight data. Please try again later.'
    });
  }
});

module.exports = router;
