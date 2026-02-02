/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

// Debug mode - only enabled in development
const DEBUG_MODE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML insertion
 */
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => deg * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Format distance for display
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance
 */
function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Format time for display
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
function formatTime(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
}

/**
 * Get distance category
 * @param {number} distance - Distance in km
 * @returns {string} Category: 'close', 'medium', 'far', or 'outside'
 */
function getDistanceCategory(distance) {
  if (distance < CONFIG.DISTANCE_CLOSE) return 'close';
  if (distance < CONFIG.DISTANCE_MEDIUM) return 'medium';
  if (distance < CONFIG.DISTANCE_FAR) return 'far';
  return 'outside'; // Beyond 12km
}

/**
 * Get color for distance
 * @param {number} distance - Distance in km
 * @returns {string} CSS color value
 */
function getDistanceColor(distance) {
  const category = getDistanceCategory(distance);
  switch (category) {
    case 'close': return '#ff006e';
    case 'medium': return '#ffd60a';
    case 'far': return '#7cfc00';
    case 'outside': return '#718096';
    default: return '#718096';
  }
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format timestamp to local time
 * @param {number} timestamp - Unix timestamp in ms
 * @returns {string} Formatted time string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Update element text with animation
 * @param {string} elementId - Element ID
 * @param {string} text - New text
 */
function updateText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element && element.textContent !== text) {
    element.style.animation = 'none';
    setTimeout(() => {
      element.textContent = text;
      element.style.animation = 'count-up 0.3s ease';
    }, 10);
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  // Could enhance with toast notification
}

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {*} data - Optional data to log
 */
function debug(message, data = null) {
  // Only log in development / debug mode
  if (!DEBUG_MODE) {
    return;
  }

  const logger = console.debug ? console.debug.bind(console) : console.log.bind(console);

  if (data !== null && data !== undefined) {
    logger('[DEBUG]', message, data);
  } else {
    logger('[DEBUG]', message);
  }
}

/**
 * Show custom confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const dialog = overlay?.querySelector('.modal-dialog');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.querySelector('.modal-body');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');
    
    if (!overlay || !modalBody) {
      resolve(false);
      return;
    }
    
    // Restore modal body structure if it was changed by showModal
    let modalMessage = document.getElementById('modal-message');
    if (!modalMessage) {
      modalBody.innerHTML = '<p class="modal-message" id="modal-message"></p>';
      modalMessage = document.getElementById('modal-message');
    }
    
    // Remove logbook-modal class if present
    dialog?.classList.remove('logbook-modal');
    
    // Set content
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Show both buttons for confirmation
    confirmBtn.style.display = 'block';
    cancelBtn.style.display = 'block';
    confirmBtn.textContent = 'Confirm';
    
    // Show modal
    overlay.classList.add('active');
    
    // Handle confirm
    const handleConfirm = () => {
      overlay.classList.remove('active');
      cleanup();
      resolve(true);
    };
    
    // Handle cancel
    const handleCancel = () => {
      overlay.classList.remove('active');
      cleanup();
      resolve(false);
    };
    
    // Cleanup listeners
    const cleanup = () => {
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      overlay.removeEventListener('click', handleOverlayClick);
    };
    
    // Close on overlay click
    const handleOverlayClick = (e) => {
      if (e.target === overlay) {
        handleCancel();
      }
    };
    
    // Add listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlayClick);
  });
}

// Store current modal cleanup function to prevent memory leaks
let currentModalCleanup = null;

/**
 * Show flexible modal (for logbook, settings, etc.)
 * @param {string} title - Modal title
 * @param {string} htmlContent - HTML content for modal body
 * @param {Function|null} onConfirm - Callback for confirm button (null = no confirm button)
 * @param {string} confirmText - Text for confirm button (default: 'OK')
 * @param {boolean} showCancel - Show cancel button (default: false)
 * @param {boolean} successButton - Make confirm button green (default: false)
 */
function showModal(title, htmlContent, onConfirm = null, confirmText = 'OK', showCancel = false, successButton = false) {
  const overlay = document.getElementById('modal-overlay');
  const dialog = overlay?.querySelector('.modal-dialog');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.querySelector('.modal-body');
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn = document.getElementById('modal-cancel');
  
  if (!overlay) {
    return;
  }
  
  // Clean up previous modal listeners before setting up new ones
  if (currentModalCleanup) {
    currentModalCleanup();
    currentModalCleanup = null;
  }
  
  // Set title
  modalTitle.textContent = title;
  
  // Set HTML content
  modalBody.innerHTML = htmlContent;
  
  // Configure buttons
  confirmBtn.textContent = confirmText;
  confirmBtn.style.display = 'block';
  cancelBtn.style.display = showCancel ? 'block' : 'none';
  
  // Apply success styling if needed
  if (successButton) {
    confirmBtn.classList.add('btn-success');
  } else {
    confirmBtn.classList.remove('btn-success');
  }
  
  // Add logbook-modal class for wider modal if title contains "Logbook"
  if (title.includes('Logbook')) {
    dialog?.classList.add('logbook-modal');
  } else {
    dialog?.classList.remove('logbook-modal');
  }
  
  // Show modal
  overlay.classList.add('active');
  
  // Handle confirm
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    overlay.classList.remove('active');
    cleanup();
  };
  
  // Handle cancel
  const handleCancel = () => {
    overlay.classList.remove('active');
    cleanup();
  };
  
  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlay) {
      handleCancel();
    }
  };
  
  // Cleanup listeners
  const cleanup = () => {
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
    overlay.removeEventListener('click', handleOverlayClick);
    dialog?.classList.remove('logbook-modal');
    currentModalCleanup = null;
  };
  
  // Store cleanup function for next modal call
  currentModalCleanup = cleanup;
  
  // Add listeners
  confirmBtn.addEventListener('click', handleConfirm);
  if (showCancel) {
    cancelBtn.addEventListener('click', handleCancel);
  }
  overlay.addEventListener('click', handleOverlayClick);
}
