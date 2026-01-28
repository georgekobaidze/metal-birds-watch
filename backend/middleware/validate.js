const { LRUCache } = require('lru-cache');
const { MAX_LOCATIONS_PER_IP } = require('../config');
const { getGridKey } = require('../services/grid');

// Track unique grid cells per IP with automatic expiration
// Each IP entry expires 24 hours after creation
const ipLocations = new LRUCache({
  max: 10000,  // Maximum 10,000 IPs in memory
  ttl: 24 * 60 * 60 * 1000,  // 24 hours TTL per entry
  updateAgeOnGet: false  // Don't reset TTL when accessed
});

/**
 * Validate coordinates and enforce location limits per IP
 */
function validateCoordinates(req, res, next) {
  // Validate request body exists
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Request body required' });
  }
  
  const { latitude, longitude } = req.body;
  
  // Validate latitude
  if (typeof latitude !== 'number' || isNaN(latitude) || !Number.isFinite(latitude)) {
    return res.status(400).json({ error: 'Invalid latitude: must be a finite number' });
  }
  
  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({ error: 'Invalid latitude: must be between -90 and 90' });
  }
  
  // Validate longitude
  if (typeof longitude !== 'number' || isNaN(longitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ error: 'Invalid longitude: must be a finite number' });
  }
  
  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid longitude: must be between -180 and 180' });
  }
  
  // Get client IP
  const ip = req.ip;
  
  // Calculate grid key for this location
  const gridKey = getGridKey(latitude, longitude);
  
  // Get or create Set for this IP
  let locations = ipLocations.get(ip);
  if (!locations) {
    locations = new Set();
    ipLocations.set(ip, locations);
  }
  
  // Check if this is a new location for this IP
  if (!locations.has(gridKey)) {
    // Check if IP has reached location limit
    if (locations.size >= MAX_LOCATIONS_PER_IP) {
      return res.status(429).json({ 
        error: `Too many different locations requested. Maximum ${MAX_LOCATIONS_PER_IP} locations per IP address.` 
      });
    }
    
    // Add new location
    locations.add(gridKey);
    // Update the cache entry with the modified Set
    ipLocations.set(ip, locations);
  }
  
  // Attach validated data and grid key to request
  req.validatedLocation = { latitude, longitude, gridKey };
  
  next();
}

module.exports = {
  validateCoordinates
};
