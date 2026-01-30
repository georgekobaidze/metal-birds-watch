/* ============================================
   MAP INITIALIZATION & MANAGEMENT
   ============================================ */

let map = null;
let tileLayer = null;
let userMarker = null;
let userLocation = { lat: null, lon: null };
let radiusCircle = null;
let planeMarkers = new Map(); // ICAO24 -> marker

/**
 * Initialize the Leaflet map
 */
function initMap() {
  // Create map centered on default location (will update with user location)
  map = L.map('map', {
    center: [36.0179, -75.6684], // Kitty Hawk, NC - Birthplace of Aviation
    zoom: CONFIG.MAP_ZOOM_DEFAULT,
    zoomControl: true,
    minZoom: CONFIG.MAP_ZOOM_MIN,
    maxZoom: CONFIG.MAP_ZOOM_MAX
  });
  
  // Add tile layer based on current theme
  const tileUrl = currentTheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
  
  tileLayer = L.tileLayer(tileUrl, {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 19
  }).addTo(map);
  
  // Store globally for theme switching
  window.map = map;
  window.tileLayer = tileLayer;
  
  debug('Map initialized');
}

/**
 * Get user's geolocation
 */
function getUserLocation() {
  // ============================================
  // 🧪 TESTING MODE: Hardcoded location
  // TODO: REMOVE THIS BEFORE PRODUCTION!
  // ============================================
  
  // Hardcoded to Thousand Oaks, CA
  // Near LA but not at airport - moderate flight traffic (overflights)
  userLocation.lat = 34.1705;
  userLocation.lon = -118.8376;
  
  debug('🧪 TESTING MODE: Using hardcoded Thousand Oaks, CA location', userLocation);
  
  // Update map
  map.setView([userLocation.lat, userLocation.lon], CONFIG.MAP_ZOOM_DEFAULT);
  
  // Add user marker
  addUserMarker();
  
  // Add detection radius circle
  addRadiusCircle();
  
  // Update location text
  updateLocationText();
  
  // Start fetching plane data
  if (window.startPolling) {
    startPolling();
  }
  
  return; // Skip real geolocation for testing
  
  // ============================================
  // 🌍 PRODUCTION CODE (commented out for testing)
  // ============================================
  /*
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation.lat = position.coords.latitude;
      userLocation.lon = position.coords.longitude;
      
      debug('User location obtained', userLocation);
      
      // Update map
      map.setView([userLocation.lat, userLocation.lon], CONFIG.MAP_ZOOM_DEFAULT);
      
      // Add user marker
      addUserMarker();
      
      // Add detection radius circle
      addRadiusCircle();
      
      // Update location text
      updateLocationText();
      
      // Start fetching plane data
      if (window.startPolling) {
        startPolling();
      }
    },
    (error) => {
      showError(`Geolocation error: ${error.message}`);
      console.error('Geolocation error:', error);
    }
  );
  */
}

/**
 * Add user marker to map
 */
function addUserMarker() {
  if (userMarker) {
    map.removeLayer(userMarker);
  }
  
  // Custom user marker with pulsing effect
  const userIcon = L.divIcon({
    className: 'user-marker-icon',
    html: '<div class="user-marker"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
  
  userMarker = L.marker([userLocation.lat, userLocation.lon], {
    icon: userIcon,
    zIndexOffset: 1000
  }).addTo(map);
  
  userMarker.bindPopup('<strong>You are here</strong>');
}

/**
 * Add detection radius circle
 */
function addRadiusCircle() {
  if (radiusCircle) {
    map.removeLayer(radiusCircle);
  }
  
  radiusCircle = L.circle([userLocation.lat, userLocation.lon], {
    radius: CONFIG.DETECTION_RADIUS_KM * 1000, // Convert km to meters
    color: '#00d4ff',
    fillColor: '#00d4ff',
    fillOpacity: 0.05,
    weight: 2,
    opacity: 0.3
  }).addTo(map);
}

/**
 * Create plane icon HTML
 * @param {number} heading - Plane heading in degrees
 * @param {string} color - Color based on distance
 * @returns {string} HTML for plane icon
 */
function createPlaneIconHTML(heading, color) {
  return `
    <div class="plane-marker-container" style="transform: rotate(${heading}deg);">
      <svg width="40" height="40" viewBox="0 0 40 40" style="filter: drop-shadow(0 0 8px ${color});">
        <!-- Top-down view of airplane -->
        
        <!-- Main fuselage (body) -->
        <rect x="17" y="8" width="6" height="24" rx="2" fill="${color}"/>
        
        <!-- Nose (front) -->
        <path d="M 17 8 L 20 3 L 23 8 Z" fill="${color}"/>
        
        <!-- Main wings (large) -->
        <rect x="4" y="16" width="32" height="5" rx="2" fill="${color}"/>
        
        <!-- Tail wings (horizontal stabilizer) -->
        <rect x="10" y="28" width="20" height="3" rx="1" fill="${color}"/>
        
        <!-- Vertical stabilizer (tail fin) -->
        <path d="M 18 32 L 20 37 L 22 32 Z" fill="${color}"/>
      </svg>
    </div>
  `;
}

/**
 * Update plane markers on map
 * @param {Array} planes - Array of plane objects with distance calculated
 */
function updatePlaneMarkers(planes) {
  const currentPlaneIds = new Set();
  
  planes.forEach(plane => {
    currentPlaneIds.add(plane.icao24);
    
    const color = getDistanceColor(plane.distance);
    const category = getDistanceCategory(plane.distance);
    
    if (planeMarkers.has(plane.icao24)) {
      // Update existing marker (smooth position change, no animation)
      const marker = planeMarkers.get(plane.icao24);
      marker.setLatLng([plane.latitude, plane.longitude]);
      
      // Update icon (in case heading or distance changed)
      const icon = L.divIcon({
        className: `plane-marker-icon plane-${category}`,
        html: createPlaneIconHTML(plane.heading || 0, color),
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      marker.setIcon(icon);
      
      // Update popup content
      marker.setPopupContent(createPlanePopupContent(plane));
      
    } else {
      // Create new marker (with entrance animation)
      const iconHTML = createPlaneIconHTML(plane.heading || 0, color);
      // Add first-appearance class for entrance animation
      const animatedHTML = iconHTML.replace(
        'class="plane-marker-container"',
        'class="plane-marker-container first-appearance"'
      );
      
      const icon = L.divIcon({
        className: `plane-marker-icon plane-${category}`,
        html: animatedHTML,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      
      const marker = L.marker([plane.latitude, plane.longitude], {
        icon: icon,
        zIndexOffset: 500
      }).addTo(map);
      
      marker.bindPopup(createPlanePopupContent(plane));
      
      planeMarkers.set(plane.icao24, marker);
      
      debug(`Added plane marker: ${plane.callsign || plane.icao24}`);
    }
  });
  
  // Remove markers for planes no longer in data
  planeMarkers.forEach((marker, icao24) => {
    if (!currentPlaneIds.has(icao24)) {
      map.removeLayer(marker);
      planeMarkers.delete(icao24);
      debug(`Removed plane marker: ${icao24}`);
    }
  });
}

/**
 * Create popup content for plane
 * @param {Object} plane - Plane object
 * @returns {string} HTML for popup
 */
function createPlanePopupContent(plane) {
  const callsign = plane.callsign || 'Unknown';
  const country = plane.country || 'Unknown';
  const altitude = plane.altitude ? `${Math.round(plane.altitude)}m` : 'N/A';
  const speed = plane.velocity ? `${Math.round(plane.velocity * 3.6)} km/h` : 'N/A';
  const heading = plane.heading ? `${Math.round(plane.heading)}°` : 'N/A';
  const distance = formatDistance(plane.distance);
  
  return `
    <div class="plane-popup">
      <div class="plane-popup-header">
        <strong>✈️ ${callsign}</strong>
      </div>
      <div class="plane-popup-body">
        <div class="popup-row">
          <span class="popup-label">🌍 Country:</span>
          <span class="popup-value">${country}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">📏 Altitude:</span>
          <span class="popup-value">${altitude}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">💨 Speed:</span>
          <span class="popup-value">${speed}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">🧭 Heading:</span>
          <span class="popup-value">${heading}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">📍 Distance:</span>
          <span class="popup-value"><strong>${distance}</strong></span>
        </div>
        <div class="popup-row">
          <span class="popup-label">🔖 ICAO24:</span>
          <span class="popup-value">${plane.icao24}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Update location text in UI
 */
function updateLocationText() {
  const locationText = document.getElementById('location-text');
  if (locationText) {
    // For now just show coordinates
    // TODO: Add reverse geocoding for city name
    locationText.textContent = `${userLocation.lat.toFixed(4)}°, ${userLocation.lon.toFixed(4)}°`;
  }
}

// Make updatePlaneMarkers available globally
window.updatePlaneMarkers = updatePlaneMarkers;

// Map ready state management
window.mapReady = false;
const mapReadyCallbacks = [];

/**
 * Register a callback to be called when map is ready
 * If map is already ready, callback is called immediately
 * @param {Function} callback - Function to call when map is ready
 */
window.onMapReady = function(callback) {
  if (window.mapReady) {
    callback();
  } else {
    mapReadyCallbacks.push(callback);
  }
};

/**
 * Notify all callbacks that map is ready
 */
function notifyMapReady() {
  window.mapReady = true;
  mapReadyCallbacks.forEach(callback => callback());
  mapReadyCallbacks.length = 0; // Clear array
}

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  getUserLocation();
  // Notify that map is ready after initialization
  notifyMapReady();
});
