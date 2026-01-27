const { MAX_LOCATIONS_PER_IP } = require('../config');
const { getGridKey } = require('../services/grid');

// Track unique grid cells per IP
const ipLocations = new Map();

// Clean up old IP data every 24 hours
setInterval(() => {
  ipLocations.clear();
  console.log('Cleared IP location tracking');
}, 24 * 60 * 60 * 1000);

/**
 * Validate coordinates and enforce location limits per IP
 */
function validateCoordinates(req, res, next) {
  const { lat, lon } = req.body;
  
  // Validate latitude
  if (typeof lat !== 'number' || isNaN(lat)) {
    return res.status(400).json({ error: 'Invalid latitude: must be a number' });
  }
  
  if (lat < -90 || lat > 90) {
    return res.status(400).json({ error: 'Invalid latitude: must be between -90 and 90' });
  }
  
  // Validate longitude
  if (typeof lon !== 'number' || isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid longitude: must be a number' });
  }
  
  if (lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'Invalid longitude: must be between -180 and 180' });
  }
  
  // Get client IP
  const ip = req.ip || req.connection.remoteAddress;
  
  // Calculate grid key for this location
  const gridKey = getGridKey(lat, lon);
  
  // Initialize IP tracking if needed
  if (!ipLocations.has(ip)) {
    ipLocations.set(ip, new Set());
  }
  
  const locations = ipLocations.get(ip);
  
  // Check if this is a new location for this IP
  if (!locations.has(gridKey)) {
    // Check if IP has reached location limit
    if (locations.size >= MAX_LOCATIONS_PER_IP) {
      return res.status(429).json({ 
        error: 'Too many different locations requested. Maximum 3 locations per IP address.' 
      });
    }
    
    // Add new location
    locations.add(gridKey);
  }
  
  // Attach validated data and grid key to request
  req.validatedLocation = { lat, lon, gridKey };
  
  next();
}

module.exports = {
  validateCoordinates
};
