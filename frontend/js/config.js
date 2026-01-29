/* ============================================
   CONFIGURATION
   ============================================ */

const CONFIG = {
  // Backend API
  API_URL: 'http://localhost:3000/api/planes',
  
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
