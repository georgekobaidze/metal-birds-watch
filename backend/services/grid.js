const { GRID_SIZE_DEGREES, FETCH_RADIUS_KM, KM_PER_DEGREE_LAT, EARTH_RADIUS_KM } = require('../config');

/**
 * Calculate grid key by rounding coordinates to nearest grid cell
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} Grid key (e.g., "48.8_2.4")
 */
function getGridKey(lat, lon) {
  const gridLat = Math.round(lat / GRID_SIZE_DEGREES) * GRID_SIZE_DEGREES;
  const gridLon = Math.round(lon / GRID_SIZE_DEGREES) * GRID_SIZE_DEGREES;
  
  // Format to one decimal place to avoid floating point issues
  return `${gridLat.toFixed(1)}_${gridLon.toFixed(1)}`;
}

/**
 * Normalize longitude to the range [-180, 180]
 * @param {number} lon - Longitude value
 * @returns {number} Normalized longitude
 */
function normalizeLongitude(lon) {
  // Normalize longitude to [-180, 180] range
  let normalized = lon % 360;
  if (normalized > 180) {
    normalized -= 360;
  } else if (normalized < -180) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Calculate bounding box for OpenSky API query
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {object} Bounding box { minLat, maxLat, minLon, maxLon }
 */
function getBoundingBox(lat, lon, radiusKm = FETCH_RADIUS_KM) {
  // Clamp latitude to avoid pole issues (cos(90°) = 0 causes division issues)
  const clampedLat = Math.max(-85, Math.min(85, lat));
  
  // Calculate latitude offset (constant everywhere)
  const latOffset = radiusKm / KM_PER_DEGREE_LAT;
  
  // Calculate longitude offset (varies by latitude)
  const lonOffset = radiusKm / (KM_PER_DEGREE_LAT * Math.cos(clampedLat * Math.PI / 180));
  
  return {
    minLat: Math.max(-90, clampedLat - latOffset),
    maxLat: Math.min(90, clampedLat + latOffset),
    minLon: normalizeLongitude(lon - lonOffset),
    maxLon: normalizeLongitude(lon + lonOffset)
  };
}

/**
 * Calculate distance between two points using Haversine formula
 * NOTE: Primarily used by client-side for filtering planes to user's radius.
 * Included here for potential backend distance calculations and code reuse.
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  // Calculate the square of half the chord length between the points
  const chordLengthSquared = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  
  // Calculate the angular distance in radians
  const angularDistance = 2 * Math.atan2(Math.sqrt(chordLengthSquared), Math.sqrt(1 - chordLengthSquared));
  
  return EARTH_RADIUS_KM * angularDistance;
}

module.exports = {
  getGridKey,
  getBoundingBox,
  haversineDistance
};
