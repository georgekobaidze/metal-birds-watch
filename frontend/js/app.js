/* ============================================
   MAIN APPLICATION LOGIC
   ============================================ */

let isPolling = false;
let pollTimeout = null;

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
  
  // TODO: Implement actual polling with fetchPlanes
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
  
  // Hide loading screen after initialization
  setTimeout(hideLoadingScreen, 2000);
});

// Make startPolling available globally
window.startPolling = startPolling;
