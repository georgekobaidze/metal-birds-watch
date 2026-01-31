/* ============================================
   MAIN APPLICATION LOGIC
   ============================================ */

let isPolling = false;
let pollTimeout = null;
let planesData = [];
let totalDetectedPlanes = new Set(); // Track all planes ever detected (by ICAO24)
let fastestSpeed = 0; // Track fastest speed detected (persistent, km/h)

/**
 * Load persistent stats from localStorage
 */
function loadPersistentStats() {
  try {
    const savedSpeed = localStorage.getItem('fastestSpeed');
    if (savedSpeed) {
      fastestSpeed = parseInt(savedSpeed, 10);
      debug(`Loaded fastest speed from storage: ${fastestSpeed} km/h`);
    }
  } catch (e) {
    debug('Error loading persistent stats:', e);
  }
}

/**
 * Save fastest speed to localStorage
 */
function saveFastestSpeed() {
  try {
    localStorage.setItem('fastestSpeed', fastestSpeed.toString());
  } catch (e) {
    debug('Error saving fastest speed:', e);
  }
}

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
    
    // Track total planes detected (cumulative) - ONLY within 12km circle
    if (plane.distance <= CONFIG.DETECTION_RADIUS_KM) {
      totalDetectedPlanes.add(plane.icao24);
      
      // Track fastest speed ONLY within 12km circle (convert m/s to km/h)
      if (plane.velocity && plane.velocity > 0) {
        const speedKmh = Math.round(plane.velocity * 3.6);
        if (speedKmh > fastestSpeed) {
          fastestSpeed = speedKmh;
          saveFastestSpeed(); // Persist the new record
          debug(`🏆 New speed record: ${fastestSpeed} km/h`);
        }
      }
    }
  });
  
  // Sort by distance (closest first)
  planesData.sort((a, b) => a.distance - b.distance);
  
  // Check for new planes and send notifications
  if (window.checkAndNotifyPlanes) {
    checkAndNotifyPlanes(planesData);
  }
  
  // Update UI
  updateStats(data);
  
  // Update plane markers on map
  if (window.updatePlaneMarkers) {
    updatePlaneMarkers(planesData);
  }
  
  debug(`Processed ${planesData.length} planes. Closest: ${planesData[0]?.distance.toFixed(2)}km`);
}

/**
 * Get sky activity indicator based on plane count
 * @param {number} count - Number of planes nearby
 * @returns {Object} Activity data with level, label, bars
 */
function getSkyActivityData(count) {
  let level, label, bars;
  
  if (count === 0) {
    level = 'idle';
    label = 'Idle';
    bars = '▁▁▁▁▁';
  } else if (count <= 2) {
    level = 'quiet';
    label = 'Quiet';
    bars = '▂▁▁▁▁';
  } else if (count <= 5) {
    level = 'light';
    label = 'Light';
    bars = '▃▂▁▁▁';
  } else if (count <= 10) {
    level = 'moderate';
    label = 'Moderate';
    bars = '▅▃▂▁▁';
  } else if (count <= 15) {
    level = 'busy';
    label = 'Busy';
    bars = '▆▅▃▂▁';
  } else {
    level = 'very-busy';
    label = 'Very Busy';
    bars = '▇▆▅▃▂';
  }
  
  return { level, label, bars };
}

/**
 * Update stats panel with current data
 * @param {Object} data - Response from backend
 */
function updateStats(data) {
  // Update total detected (all time, session-based)
  updateText('total-detected', totalDetectedPlanes.size);
  
  // Get nearby count for activity indicator
  const nearbyCount = data.planes.length;
  
  // Update sky activity indicator with count in brackets
  const activity = getSkyActivityData(nearbyCount);
  const activityElement = document.getElementById('sky-activity');
  if (activityElement) {
    activityElement.textContent = `${activity.bars} ${activity.label} [${nearbyCount}]`;
    activityElement.className = 'stat-value';
    activityElement.classList.add(`activity-${activity.level}`);
  }
  
  // Update closest distance - ONLY planes within 12km radius
  const planesWithinRadius = planesData.filter(p => p.distance <= CONFIG.DETECTION_RADIUS_KM);
  if (planesWithinRadius.length > 0) {
    updateText('closest-distance', formatDistance(planesWithinRadius[0].distance));
  } else {
    updateText('closest-distance', '--');
  }
  
  // Update fastest speed
  if (fastestSpeed > 0) {
    updateText('fastest-speed', `${fastestSpeed} km/h`);
  } else {
    updateText('fastest-speed', '--');
  }
  
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
    
    // Schedule next poll based on server's recommendation (already includes jitter)
    const nextPollMs = data.nextUpdateIn * 1000;
    
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
  
  // Load persistent stats
  loadPersistentStats();
  
  // Initialize notification system
  if (window.initNotifications) {
    initNotifications();
  }
  
  // Unlock audio on any user interaction (click, tap, key press)
  const unlockAudioOnInteraction = () => {
    if (window.unlockAudio) {
      unlockAudio();
    }
  };
  
  document.addEventListener('click', unlockAudioOnInteraction, { once: true });
  document.addEventListener('keydown', unlockAudioOnInteraction, { once: true });
  document.addEventListener('touchstart', unlockAudioOnInteraction, { once: true });
  
  // Setup notification dropdown toggle
  const notificationsBtn = document.getElementById('notifications-btn');
  if (notificationsBtn) {
    notificationsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotificationDropdown();
    });
  }
  
  // Setup clear notifications button
  const clearBtn = document.getElementById('clear-notifications-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmed = await showConfirmModal(
        'Clear Notifications',
        'Are you sure you want to clear all notifications? This action cannot be undone.'
      );
      if (confirmed) {
        clearAllNotifications();
      }
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notification-dropdown');
    const notificationsBtn = document.getElementById('notifications-btn');
    
    if (dropdown && !dropdown.contains(e.target) && !notificationsBtn.contains(e.target)) {
      toggleNotificationDropdown(false);
    }
  });
  
  // Hide loading screen after initialization
  setTimeout(hideLoadingScreen, 2000);
});

// Make startPolling available globally
window.startPolling = startPolling;
