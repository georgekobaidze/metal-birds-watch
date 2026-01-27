module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,

  // Cache Configuration
  CACHE_TTL_SECONDS: 25,  // Reduced for faster notifications (25-30s with jitter)

  // Grid Configuration
  GRID_SIZE_DEGREES: 0.2,        // ~22km per grid cell
  FETCH_RADIUS_KM: 25,            // How far to fetch from OpenSky API

  // Rate Limiting (per IP)
  RATE_LIMIT_WINDOW_MS: 30000,   // 30 seconds
  RATE_LIMIT_MAX_REQUESTS: 5,    // Max 5 requests per window
  MAX_LOCATIONS_PER_IP: 3,       // Max 3 different grid cells per IP

  // Global API Protection
  MAX_API_CALLS_PER_MINUTE: 20,  // Total OpenSky calls per minute

  // OpenSky API
  OPENSKY_BASE_URL: 'https://opensky-network.org/api',
  OPENSKY_AUTH_URL: 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
  OPENSKY_CLIENT_ID: process.env.OPENSKY_CLIENT_ID,
  OPENSKY_CLIENT_SECRET: process.env.OPENSKY_CLIENT_SECRET,

  // Earth Constants (for calculations)
  EARTH_RADIUS_KM: 6371,
  KM_PER_DEGREE_LAT: 111,        // Constant everywhere

  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS || ''
};
