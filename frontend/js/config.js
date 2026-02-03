/* ============================================
   CONFIGURATION
   ============================================ */

// Detect environment based on hostname
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const CONFIG = {
  // Backend API - auto-detects environment
  // TODO: Replace with your actual Railway URL before production
  API_URL: isLocalhost 
    ? 'http://localhost:3000/api/planes'
    : 'https://metal-birds-watch-production.up.railway.app/api/planes',
  
  // Detection settings
  DETECTION_RADIUS_KM: 12,
  
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
