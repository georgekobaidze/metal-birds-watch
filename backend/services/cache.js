const { CACHE_TTL_SECONDS } = require('../config');

// In-memory cache: Map of grid keys to cached data
const cache = new Map();

/**
 * Get cached data for a grid key
 * @param {string} gridKey - Grid cell key (e.g., "48.8_2.4")
 * @returns {object|null} Cached data with metadata or null if not found/expired
 */
function get(gridKey) {
  const cached = cache.get(gridKey);
  
  if (!cached) {
    return null;
  }
  
  const cacheAge = Math.floor((Date.now() - cached.timestamp) / 1000);
  
  // Check if cache is expired
  if (cacheAge >= CACHE_TTL_SECONDS) {
    // Cache expired, remove it
    cache.delete(gridKey);
    return null;
  }
  
  // Cache is fresh
  return {
    planes: cached.planes,
    cacheAge,
    nextUpdateIn: CACHE_TTL_SECONDS - cacheAge
  };
}

/**
 * Set cached data for a grid key
 * @param {string} gridKey - Grid cell key
 * @param {array} planes - Array of plane objects
 */
function set(gridKey, planes) {
  cache.set(gridKey, {
    planes,
    timestamp: Date.now()
  });
}

/**
 * Clear all cached data
 */
function clear() {
  cache.clear();
}

/**
 * Get cache statistics (for debugging/monitoring)
 * @returns {object} Cache stats
 */
function getStats() {
  const now = Date.now();
  let freshCount = 0;
  let staleCount = 0;
  
  for (const [key, value] of cache.entries()) {
    const age = Math.floor((now - value.timestamp) / 1000);
    if (age < CACHE_TTL_SECONDS) {
      freshCount++;
    } else {
      staleCount++;
    }
  }
  
  return {
    totalEntries: cache.size,
    freshEntries: freshCount,
    staleEntries: staleCount,
    ttlSeconds: CACHE_TTL_SECONDS
  };
}

/**
 * Get full cache snapshot with stats and all entries
 * @returns {object} Complete cache state
 */
function getSnapshot() {
  const now = Date.now();
  const entries = [];
  
  for (const [key, value] of cache.entries()) {
    const age = Math.floor((now - value.timestamp) / 1000);
    const isExpired = age >= CACHE_TTL_SECONDS;
    
    entries.push({
      gridKey: key,
      planeCount: value.planes.length,
      ageSeconds: age,
      remainingSeconds: isExpired ? 0 : CACHE_TTL_SECONDS - age,
      isExpired,
      timestamp: new Date(value.timestamp).toISOString()
    });
  }
  
  return {
    stats: getStats(),
    entries: entries.sort((a, b) => a.ageSeconds - b.ageSeconds) // Sort by age
  };
}

module.exports = {
  get,
  set,
  clear,
  getStats,
  getSnapshot
};
