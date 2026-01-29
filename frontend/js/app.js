/* ============================================
   MAIN APPLICATION LOGIC
   ============================================ */

let isPolling = false;
let pollTimeout = null;
let planesData = [];

/**
 * Process planes data from API
 * @param {Object} data - Response from backend
 */
function processPlanes(data) {
  if (!data || !data.planes) {
    debug('No plane data to process');
    return;
  }
  
  planesData = data.planes;
  
  // Calculate distances for each plane
  planesData.forEach(plane => {
    plane.distance = haversineDistance(
      userLocation.lat,
      userLocation.lon,
      plane.latitude,
      plane.longitude
    );
  });
  
  // Sort by distance (closest first)
  planesData.sort((a, b) => a.distance - b.distance);
  
  // Update UI
  updateStats(data);
  
  debug(`Processed ${planesData.length} planes. Closest: ${planesData[0]?.distance.toFixed(2)}km`);
}

/**
 * Update stats panel with current data
 * @param {Object} data - Response from backend
 */
function updateStats(data) {
  // Update plane count
  updateText('planes-count', data.planes.length);
  
  // Update closest distance
  if (planesData.length > 0) {
    updateText('closest-distance', formatDistance(planesData[0].distance));
  } else {
    updateText('closest-distance', '--');
  }
  
  // Update next update timer
  updateText('next-update', formatTime(data.nextUpdateIn));
  
  // Update cache age
  updateText('cache-age', formatTime(data.cacheAge));
  
  // Update connection status
  updateConnectionStatus(true);
}

/**
 * Start smart polling
 */
function startPolling() {
  if (!userLocation.lat || !userLocation.lon) {
    debug('Cannot start polling - user location not available');
    return;
  }
  
  if (isPolling) {
    debug('Polling already started');
    return;
  }
  
  isPolling = true;
  debug('Polling started');
  
  // Start first fetch immediately
  pollPlanes();
}

/**
 * Poll backend for plane data
 */
async function pollPlanes() {
  debug('Polling backend...');
  
  const data = await fetchPlanes();
  
  if (data) {
    // Process the data
    processPlanes(data);
    
    // Schedule next poll based on server's recommendation
    const jitter = getJitter();
    const nextPollMs = (data.nextUpdateIn + jitter) * 1000;
    
    debug(`Next poll in ${(nextPollMs / 1000).toFixed(1)}s`);
    
    pollTimeout = setTimeout(pollPlanes, nextPollMs);
  } else {
    // Error occurred, retry after 10 seconds
    debug('Error fetching data, retrying in 10s...');
    pollTimeout = setTimeout(pollPlanes, 10000);
  }
}

/**
 * Stop polling
 */
function stopPolling() {
  if (pollTimeout) {
    clearTimeout(pollTimeout);
    pollTimeout = null;
  }
  isPolling = false;
  debug('Polling stopped');
}

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 1500); // Show for at least 1.5 seconds
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  debug('Metal Birds Watch initialized');
  debug('Backend API:', CONFIG.API_URL);
  
  // Hide loading screen after initialization
  setTimeout(hideLoadingScreen, 2000);
});

// Make startPolling available globally
window.startPolling = startPolling;
