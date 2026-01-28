const { LRUCache } = require('lru-cache');
const { CACHE_TTL_SECONDS } = require('../config');

// LRU cache with automatic expiration and memory bounds
// Max 500 grid cells = ~25MB max memory (50KB per grid cell estimate)
const cache = new LRUCache({
  max: 500,  // Maximum 500 grid cells
  ttl: CACHE_TTL_SECONDS * 1000,  // TTL in milliseconds
  ttlAutopurge: true,  // Automatically remove expired entries
  updateAgeOnGet: false,  // Don't reset TTL when accessed (read-through)
  updateAgeOnHas: false  // Don't reset TTL on has() check
});

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
  
  // Calculate cache age from stored timestamp
  const cacheAge = Math.floor((Date.now() - cached.timestamp) / 1000);
  
  // Cache is fresh (LRU already filtered expired entries)
  return {
    // Return a deep copy to prevent callers from mutating cached data
    planes: Array.isArray(cached.planes) ? Object.freeze(cached.planes.slice()) : [],
    cacheAge,
    nextUpdateIn: Math.max(0, CACHE_TTL_SECONDS - cacheAge)
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
  let expiringSoonCount = 0;  // < 5 seconds remaining
  
  for (const [, value] of cache.entries()) {
    const age = Math.floor((now - value.timestamp) / 1000);
    const remaining = CACHE_TTL_SECONDS - age;
    
    if (remaining > 0) {
      freshCount++;
      if (remaining < 5) {
        expiringSoonCount++;
      }
    }
  }
  
  return {
    totalEntries: cache.size,
    maxEntries: cache.max,
    freshEntries: freshCount,
    expiringSoonEntries: expiringSoonCount,
    ttlSeconds: CACHE_TTL_SECONDS,
    calculatedSize: cache.calculatedSize || 0
  };
}

/**
 * Get full cache snapshot with stats and all entries
 * @returns {object} Complete cache state
 */
function getSnapshot() {
  const now = Date.now();
  const entries = [];
  
  try {
    for (const [key, value] of cache.entries()) {
      const age = Math.floor((now - value.timestamp) / 1000);
      const remaining = Math.max(0, CACHE_TTL_SECONDS - age);
      
      entries.push({
        gridKey: key,
        planeCount: value.planes.length,
        ageSeconds: age,
        remainingSeconds: remaining,
        timestamp: new Date(value.timestamp).toISOString()
      });
    }
  } catch (error) {
    console.error('Error iterating cache entries:', error);
    // Return partial results with error flag
    return {
      stats: getStats(),
      entries: entries.sort((a, b) => a.ageSeconds - b.ageSeconds),
      error: 'Partial results - error during iteration'
    };
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
