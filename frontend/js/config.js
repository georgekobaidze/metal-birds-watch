/* ============================================
   CONFIGURATION
   ============================================ */

/**
 * Determines the appropriate API URL based on the environment.
 * In development (localhost), uses local backend.
 * In production, uses the deployed backend URL (configured via environment or defaults).
 */
function getApiUrl() {
  // Check if we're in development (localhost)
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '';
  
  if (isDevelopment) {
    return 'http://localhost:3000/api/planes';
  }
  
  // Production: Use environment variable or fallback
  // This can be set via build-time replacement or a config file
  return window.ENV_API_URL || 'https://metal-birds-watch-backend.up.railway.app/api/planes';
}

const CONFIG = {
  // Backend API - automatically configured based on environment
  API_URL: getApiUrl(),
  
  // Detection settings
  DETECTION_RADIUS_KM: 12,
  
  // Polling settings
  UPDATE_JITTER_MAX_S: 3,  // Add 0-3 seconds jitter
  
  // Distance thresholds (km)
  DISTANCE_CLOSE: 3,
  DISTANCE_MEDIUM: 7,
  DISTANCE_FAR: 12,
  
  // Theme settings
  THEME_SWITCH_HOUR_NIGHT: 18,  // 6 PM
  THEME_SWITCH_HOUR_DAY: 6,     // 6 AM
  
  // Features
  ENABLE_SOUNDS: true,
  ENABLE_VIBRATION: true,
  ENABLE_BROWSER_NOTIFICATIONS: true,
  
  // Map settings
  MAP_ZOOM_DEFAULT: 11,
  MAP_ZOOM_MIN: 8,
  MAP_ZOOM_MAX: 16
};
