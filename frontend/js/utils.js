/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => deg * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Get random jitter value
 * @returns {number} Random jitter in seconds (0 to CONFIG.UPDATE_JITTER_MAX_S)
 */
function getJitter() {
  return Math.random() * CONFIG.UPDATE_JITTER_MAX_S;
}

/**
 * Format distance for display
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance
 */
function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Format time for display
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
function formatTime(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
}

/**
 * Get distance category
 * @param {number} distance - Distance in km
 * @returns {string} Category: 'close', 'medium', 'far', or 'outside'
 */
function getDistanceCategory(distance) {
  if (distance < CONFIG.DISTANCE_CLOSE) return 'close';
  if (distance < CONFIG.DISTANCE_MEDIUM) return 'medium';
  if (distance < CONFIG.DISTANCE_FAR) return 'far';
  return 'outside'; // Beyond 12km
}

/**
 * Get color for distance
 * @param {number} distance - Distance in km
 * @returns {string} CSS color value
 */
function getDistanceColor(distance) {
  const category = getDistanceCategory(distance);
  switch (category) {
    case 'close': return '#ff006e';
    case 'medium': return '#ffd60a';
    case 'far': return '#7cfc00';
    case 'outside': return '#718096';
    default: return '#718096';
  }
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format timestamp to local time
 * @param {number} timestamp - Unix timestamp in ms
 * @returns {string} Formatted time string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Update element text with animation
 * @param {string} elementId - Element ID
 * @param {string} text - New text
 */
function updateText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element && element.textContent !== text) {
    element.style.animation = 'none';
    setTimeout(() => {
      element.textContent = text;
      element.style.animation = 'count-up 0.3s ease';
    }, 10);
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  console.error(message);
  // Could enhance with toast notification
}

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {*} data - Optional data to log
 */
function debug(message, data = null) {
  if (data) {
    console.log(`[DEBUG] ${message}`, data);
  } else {
    console.log(`[DEBUG] ${message}`);
  }
}
