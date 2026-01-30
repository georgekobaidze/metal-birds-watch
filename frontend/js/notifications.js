/* ============================================
   NOTIFICATION SYSTEM
   ============================================ */

let notifiedPlanes = new Set(); // Track ICAO24 codes that have been notified
let notificationHistory = []; // Persistent notification history
let notificationPermission = 'default'; // 'default', 'granted', or 'denied'
let notificationSound = null; // Audio object for notification sound
let soundUnlocked = false; // Track if audio context is unlocked

/**
 * Initialize notification sound
 */
function initNotificationSound() {
  // Create audio element for airplane announcement chime
  notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1570/1570-preview.mp3');
  notificationSound.volume = 0.6; // 60% volume
  
  // Preload the sound
  notificationSound.load();
  
  debug('Notification sound initialized');
}

/**
 * Unlock audio on first user interaction
 * Required due to browser autoplay policies
 */
function unlockAudio() {
  if (soundUnlocked || !notificationSound) return;
  
  // Play and immediately pause to unlock audio context
  notificationSound.play().then(() => {
    notificationSound.pause();
    notificationSound.currentTime = 0;
    soundUnlocked = true;
    debug('✅ Audio unlocked - sounds will now play');
  }).catch(() => {
    // Still locked, will try again on next interaction
  });
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  if (!CONFIG.ENABLE_SOUNDS || !notificationSound) {
    return;
  }
  
  if (!soundUnlocked) {
    debug('⚠️ Audio not yet unlocked - sound blocked by browser');
    return;
  }
  
  try {
    // Reset and play
    notificationSound.currentTime = 0;
    notificationSound.play().catch(err => {
      debug('Sound playback error:', err.message);
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

/**
 * Initialize notification system
 * Load from localStorage and request permissions
 */
function initNotifications() {
  // Initialize sound
  initNotificationSound();
  
  // Load notification history from localStorage
  const saved = localStorage.getItem('notificationHistory');
  if (saved) {
    try {
      notificationHistory = JSON.parse(saved);
      debug(`Loaded ${notificationHistory.length} notifications from storage`);
    } catch (e) {
      console.error('Error loading notification history:', e);
      notificationHistory = [];
    }
  }
  
  // Load notified planes set
  const savedNotified = localStorage.getItem('notifiedPlanes');
  if (savedNotified) {
    try {
      notifiedPlanes = new Set(JSON.parse(savedNotified));
      debug(`Loaded ${notifiedPlanes.size} notified planes from storage`);
    } catch (e) {
      console.error('Error loading notified planes:', e);
      notifiedPlanes = new Set();
    }
  }
  
  // Request browser notification permission
  requestNotificationPermission();
  
  // Update UI
  updateNotificationUI();
}

/**
 * Request browser notification permissions
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    debug('Browser does not support notifications');
    return false;
  }
  
  if (!CONFIG.ENABLE_BROWSER_NOTIFICATIONS) {
    debug('Browser notifications disabled in config');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    
    if (permission === 'granted') {
      debug('Notification permission granted');
      return true;
    } else if (permission === 'denied') {
      debug('Notification permission denied');
      return false;
    } else {
      debug('Notification permission dismissed');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Send browser notification (OS notification)
 * @param {Object} plane - Plane data
 * @param {number} distance - Distance in km
 */
function sendBrowserNotification(plane, distance) {
  if (!CONFIG.ENABLE_BROWSER_NOTIFICATIONS || notificationPermission !== 'granted') {
    return;
  }
  
  // Determine notification urgency based on distance
  let title, urgency;
  
  if (distance < CONFIG.DISTANCE_CLOSE) {
    title = '✈️ Aircraft Overhead!';
    urgency = 'urgent';
  } else if (distance < CONFIG.DISTANCE_MEDIUM) {
    title = '✈️ Aircraft Approaching';
    urgency = 'warning';
  } else {
    title = '✈️ Aircraft Detected';
    urgency = 'info';
  }
  
  const callsign = plane.callsign?.trim() || plane.icao24;
  const country = plane.country || 'Unknown';
  const altitude = plane.geo_altitude || plane.baro_altitude || plane.altitude;
  const altitudeText = altitude ? `${Math.round(altitude)}m` : 'Unknown';
  
  const body = `${callsign} • ${country}\n${distance.toFixed(1)}km away • ${altitudeText} altitude`;
  
  try {
    const notification = new Notification(title, {
      body: body,
      icon: 'assets/icons/logo.png',
      badge: 'assets/icons/logo.png',
      tag: plane.icao24,
      requireInteraction: urgency === 'urgent',
      silent: false
    });
    
    if (urgency !== 'urgent') {
      setTimeout(() => notification.close(), 5000);
    }
    
    debug(`Browser notification sent: ${title} - ${callsign}`);
  } catch (error) {
    console.error('Error sending browser notification:', error);
  }
}

/**
 * Add notification to in-app center
 * @param {Object} plane - Plane data
 * @param {number} distance - Distance in km
 */
function addInAppNotification(plane, distance) {
  const notification = {
    id: plane.icao24 + '_' + Date.now(),
    icao24: plane.icao24,
    callsign: plane.callsign?.trim() || plane.icao24,
    country: plane.country || 'Unknown',
    distance: distance,
    altitude: plane.geo_altitude || plane.baro_altitude || plane.altitude,
    velocity: plane.velocity,
    heading: plane.true_track || plane.heading,
    timestamp: Date.now(),
    read: false
  };
  
  // Add to beginning of array (newest first)
  notificationHistory.unshift(notification);
  
  // Keep only last 50 notifications
  if (notificationHistory.length > 50) {
    notificationHistory = notificationHistory.slice(0, 50);
  }
  
  // Save to localStorage
  saveNotifications();
  
  // Update UI
  updateNotificationUI();
  
  debug(`Added in-app notification: ${notification.callsign}`);
}

/**
 * Process planes and send notifications for new detections
 * ONLY notify when planes are WITHIN 12km detection circle
 * @param {Array} planes - Array of plane objects with distance calculated
 */
function checkAndNotifyPlanes(planes) {
  const currentICAOs = new Set();
  
  planes.forEach(plane => {
    currentICAOs.add(plane.icao24);
    
    // NEW plane detected AND within 12km detection radius - notify!
    if (!notifiedPlanes.has(plane.icao24) && plane.distance <= CONFIG.DETECTION_RADIUS_KM) {
      // Play notification sound
      playNotificationSound();
      
      // Send browser notification
      sendBrowserNotification(plane, plane.distance);
      
      // Add to in-app notification center
      addInAppNotification(plane, plane.distance);
      
      // Mark as notified
      notifiedPlanes.add(plane.icao24);
      
      debug(`🔔 Notification sent: ${plane.callsign || plane.icao24} entered 12km radius at ${plane.distance.toFixed(1)}km`);
    }
  });
  
  // Cleanup: Remove planes that left the area
  notifiedPlanes.forEach(icao => {
    if (!currentICAOs.has(icao)) {
      notifiedPlanes.delete(icao);
      debug(`Removed ${icao} from notification tracking (left area)`);
    }
  });
  
  // Save notified planes
  localStorage.setItem('notifiedPlanes', JSON.stringify([...notifiedPlanes]));
}

/**
 * Save notifications to localStorage
 */
function saveNotifications() {
  try {
    localStorage.setItem('notificationHistory', JSON.stringify(notificationHistory));
  } catch (e) {
    console.error('Error saving notifications:', e);
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
function markNotificationAsRead(notificationId) {
  const notification = notificationHistory.find(n => n.id === notificationId);
  if (notification && !notification.read) {
    notification.read = true;
    saveNotifications();
    updateNotificationUI();
  }
}

/**
 * Get unread notification count
 * @returns {number}
 */
function getUnreadCount() {
  return notificationHistory.filter(n => !n.read).length;
}

/**
 * Update notification UI (badge count and dropdown)
 */
function updateNotificationUI() {
  // Update badge count
  const badge = document.getElementById('notification-badge');
  const unreadCount = getUnreadCount();
  
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
  
  // Update dropdown list
  updateNotificationDropdown();
}

/**
 * Update notification dropdown content
 */
function updateNotificationDropdown() {
  const container = document.getElementById('notification-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (notificationHistory.length === 0) {
    container.innerHTML = '<div class="notification-empty">No aircraft detected yet</div>';
    return;
  }
  
  notificationHistory.forEach(notification => {
    const item = document.createElement('div');
    item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
    item.dataset.id = notification.id;
    item.dataset.icao24 = notification.icao24;
    
    const timeAgo = formatTimeAgo(notification.timestamp);
    
    item.innerHTML = `
      <div class="notification-dot ${notification.read ? '' : 'active'}"></div>
      <div class="notification-content">
        <div class="notification-title">${notification.callsign} • ${notification.country}</div>
        <div class="notification-meta">${notification.distance.toFixed(1)}km away • ${timeAgo}</div>
      </div>
    `;
    
    item.addEventListener('click', () => handleNotificationClick(notification));
    
    container.appendChild(item);
  });
}

/**
 * Handle notification item click
 * @param {Object} notification - Notification object
 */
function handleNotificationClick(notification) {
  // Mark as read
  markNotificationAsRead(notification.id);
  
  // Close dropdown
  toggleNotificationDropdown(false);
  
  // Find plane in current data and highlight on map
  const plane = planesData.find(p => p.icao24 === notification.icao24);
  
  if (plane) {
    // Plane is still in range - highlight and show popup
    if (window.highlightPlaneOnMap) {
      highlightPlaneOnMap(plane);
    }
  } else {
    // Plane left the area - show info toast
    showToast(`${notification.callsign} has left the area`, 'info');
  }
}

/**
 * Toggle notification dropdown
 * @param {boolean} show - Optional: force show/hide
 */
function toggleNotificationDropdown(show) {
  const dropdown = document.getElementById('notification-dropdown');
  if (!dropdown) return;
  
  const isVisible = dropdown.classList.contains('active');
  
  if (show === undefined) {
    // Toggle
    dropdown.classList.toggle('active');
  } else {
    // Force show/hide
    if (show) {
      dropdown.classList.add('active');
    } else {
      dropdown.classList.remove('active');
    }
  }
  
  // Update list when opening
  if (dropdown.classList.contains('active')) {
    updateNotificationDropdown();
  }
}

/**
 * Format timestamp to relative time
 * @param {number} timestamp - Unix timestamp
 * @returns {string}
 */
function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Clear all notifications
 */
function clearAllNotifications() {
  notificationHistory = [];
  saveNotifications();
  updateNotificationUI();
  debug('All notifications cleared');
}
