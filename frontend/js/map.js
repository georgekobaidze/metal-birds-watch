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

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  getUserLocation();
});
