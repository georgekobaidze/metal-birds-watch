const { OPENSKY_BASE_URL, OPENSKY_AUTH_URL, OPENSKY_CLIENT_ID, OPENSKY_CLIENT_SECRET } = require('../config');
const { getBoundingBox } = require('./grid');

// Token management
let accessToken = null;
let tokenExpiry = null;
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry

/**
 * Get access token from OpenSky OAuth2 server
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
  if (!OPENSKY_CLIENT_ID || !OPENSKY_CLIENT_SECRET) {
    throw new Error('OpenSky credentials not configured. Set OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET in .env');
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: OPENSKY_CLIENT_ID,
    client_secret: OPENSKY_CLIENT_SECRET
  });

  try {
    const response = await fetch(OPENSKY_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
  const response = await fetch(OPENSKY_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    throw new Error(`OAuth token request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Store token and calculate expiry time
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);
  
  return accessToken;
}

/**
 * Get valid access token (fetch new one if expired or about to expire)
 * @returns {Promise<string>} Valid access token
 */
async function getValidToken() {
  const now = Date.now();
  
  // If no token, or token expires soon, fetch new one
  if (!accessToken || !tokenExpiry || now >= (tokenExpiry - TOKEN_REFRESH_BUFFER)) {
    try {
      return await getAccessToken();
    } catch (error) {
      console.error('Failed to get OAuth token:', error.message);
      throw new Error('Authentication failed - check OpenSky credentials');
    }
  }
  
  return accessToken;
}

/**
 * Fetch flight data from OpenSky Network API
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @param {number} radiusKm - Fetch radius in kilometers
 * @returns {Promise<Array>} Array of plane objects
 */
async function fetchPlanes(lat, lon, radiusKm) {
  const bbox = getBoundingBox(lat, lon, radiusKm);
  
  // Build query parameters
  const params = new URLSearchParams({
    lamin: bbox.minLat.toFixed(4),
    lamax: bbox.maxLat.toFixed(4),
    lomin: bbox.minLon.toFixed(4),
    lomax: bbox.maxLon.toFixed(4)
  });
  
  const url = `${OPENSKY_BASE_URL}/states/all?${params}`;
  
  // Get valid access token
  const token = await getValidToken();
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`OpenSky API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Parse OpenSky response format
    return parseStates(data.states || []);
    
  } catch (error) {
    console.error('Error fetching from OpenSky API:', error.message);
    throw error;
  }
}

/**
 * Parse OpenSky states array into clean plane objects
 * @param {Array} states - Raw states array from OpenSky API
 * @returns {Array} Array of plane objects
 */
function parseStates(states) {
  return states
    .filter(state => {
      // Filter out planes with missing position data
      return state[5] !== null && state[6] !== null;
    })
    .map(state => {
      return {
        icao24: state[0],                           // Unique aircraft identifier
        callsign: (state[1] || '').trim() || null,  // Flight callsign
        country: state[2] || null,                  // Origin country
        longitude: state[5],                         // Longitude in degrees
        latitude: state[6],                          // Latitude in degrees
        altitude: state[7],                          // Barometric altitude in meters (can be null)
        onGround: state[8] || false,                // Is aircraft on ground
        velocity: state[9],                          // Ground speed in m/s (can be null)
        heading: state[10],                          // True track in degrees (can be null)
        verticalRate: state[11],                     // Vertical rate in m/s (can be null)
        timestamp: Date.now()                        // When this data was fetched
      };
    });
}

module.exports = {
  fetchPlanes
};
