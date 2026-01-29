/* ============================================
   API COMMUNICATION
   ============================================ */

let lastFetchTime = 0;
let nextUpdateTimer = null;

/**
 * Fetch planes from backend API
 * @returns {Promise<Object>} Response data with planes, cacheAge, nextUpdateIn
 */
async function fetchPlanes() {
  if (!userLocation.lat || !userLocation.lon) {
    debug('Cannot fetch - user location not available');
    return null;
  }
  
  try {
    debug(`Fetching planes for location: ${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}`);
    
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: userLocation.lat,
        longitude: userLocation.lon
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    debug('Planes data received:', {
      planeCount: data.planes.length,
      cacheAge: data.cacheAge,
      nextUpdateIn: data.nextUpdateIn
    });
    
    lastFetchTime = Date.now();
    
    return data;
    
  } catch (error) {
    console.error('Error fetching planes:', error);
    showError(`Failed to fetch plane data: ${error.message}`);
    
    // Update connection status to offline
    updateConnectionStatus(false);
    
    return null;
  }
}

/**
 * Update connection status indicator
 * @param {boolean} isOnline - Connection status
 */
function updateConnectionStatus(isOnline) {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  
  if (statusDot && statusText) {
    if (isOnline) {
      statusDot.classList.remove('offline');
      statusDot.classList.add('online');
      statusText.textContent = 'ONLINE';
    } else {
      statusDot.classList.remove('online');
      statusDot.classList.add('offline');
      statusText.textContent = 'OFFLINE';
    }
  }
}
