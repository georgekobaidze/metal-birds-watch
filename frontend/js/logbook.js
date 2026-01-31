/* ============================================
   PLANE LOGBOOK
   ============================================ */

const Logbook = {
  storageKey: 'plane-logbook',
  maxEntries: 1000,
  
  /**
   * Add plane to logbook
   * @param {Object} plane - Plane data
   * @param {Object} userLocation - User's location
   */
  add(plane, userLocation) {
    const entries = this.getAll();
    
    // Check if this plane already logged today
    const today = new Date().toDateString();
    const existing = entries.find(e => 
      e.callsign === plane.callsign && 
      new Date(e.timestamp).toDateString() === today
    );
    
    if (existing) {
      debug('Plane already logged today:', plane.callsign);
      return false; // Already logged today
    }
    
    // Create entry
    const entry = {
      callsign: plane.callsign?.trim() || 'Unknown',
      icao24: plane.icao24,
      timestamp: new Date().toISOString(),
      altitude: plane.altitude,
      velocity: plane.velocity,
      heading: plane.heading,
      origin: plane.country || 'Unknown',
      distance: plane.distance,
      userLat: userLocation.lat,
      userLon: userLocation.lon
    };
    
    debug('Adding plane to logbook:', entry);
    
    // Add to beginning
    entries.unshift(entry);
    
    // Keep only maxEntries
    if (entries.length > this.maxEntries) {
      entries.splice(this.maxEntries);
    }
    
    // Save
    this.save(entries);
    this.updateBadge();
    
    return true;
  },
  
  /**
   * Get all logbook entries
   * @returns {Array} Logbook entries
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      debug('Error reading logbook:', e);
      return [];
    }
  },
  
  /**
   * Get entries from today
   * @returns {Array} Today's entries
   */
  getToday() {
    const today = new Date().toDateString();
    return this.getAll().filter(e => 
      new Date(e.timestamp).toDateString() === today
    );
  },
  
  /**
   * Save entries to storage
   * @param {Array} entries - Entries to save
   */
  save(entries) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch (e) {
      debug('Error saving logbook:', e);
    }
  },
  
  /**
   * Clear all entries
   */
  clear() {
    localStorage.removeItem(this.storageKey);
    this.updateBadge();
  },
  
  /**
   * Export logbook to JSON or CSV
   * @param {string} format - 'json' or 'csv'
   */
  exportLogbook(format) {
    const entries = this.getAll();
    
    if (entries.length === 0) {
      if (window.showToast) {
        showToast('Logbook is empty', 'info');
      } else {
        alert('Logbook is empty');
      }
      return;
    }
    
    let content, filename, mimeType;
    
    if (format === 'csv') {
      const headers = ['Date', 'Time', 'Callsign', 'ICAO24', 'Origin', 'Altitude (m)', 'Speed (m/s)', 'Distance (km)', 'Latitude', 'Longitude'];
      const rows = entries.map(e => {
        const date = new Date(e.timestamp);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          e.callsign,
          e.icao24,
          e.origin || 'Unknown',
          e.altitude?.toFixed(2) || 'N/A',
          e.velocity?.toFixed(2) || 'N/A',
          e.distance?.toFixed(2) || 'N/A',
          e.latitude?.toFixed(6) || 'N/A',
          e.longitude?.toFixed(6) || 'N/A'
        ];
      });
      
      content = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      filename = `metal-birds-logbook-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(entries, null, 2);
      filename = `metal-birds-logbook-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (window.showToast) {
      showToast(`Exported ${entries.length} flights`, 'success');
    }
  },
  
  /**
   * Clear entries older than X days
   * @param {number} days - Days to keep
   */
  clearOlderThan(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const entries = this.getAll().filter(e => 
      new Date(e.timestamp) >= cutoff
    );
    
    this.save(entries);
    this.updateBadge();
  },
  
  /**
   * Update badge count
   */
  updateBadge() {
    const badge = document.getElementById('logbook-badge');
    if (badge) {
      const count = this.getToday().length;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
};

/**
 * Show logbook modal
 */
function showLogbook() {
  const entries = Logbook.getAll();
  
  // Group by date
  const grouped = {};
  entries.forEach(entry => {
    const date = new Date(entry.timestamp).toDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(entry);
  });
  
  // Build HTML
  let html = '<div class="logbook-content">';
  
  if (entries.length === 0) {
    html += '<div class="logbook-empty">No planes spotted yet. Keep watching the skies! ✈️</div>';
  } else {
    // Add header with export and clear buttons
    html += '<div class="logbook-header">';
    html += `<div class="logbook-stats">${entries.length} total flights</div>`;
    html += '<div class="logbook-actions">';
    html += '<button class="logbook-export-btn" onclick="Logbook.exportLogbook(\'json\')">Export JSON</button>';
    html += '<button class="logbook-export-btn" onclick="Logbook.exportLogbook(\'csv\')">Export CSV</button>';
    html += '<button class="logbook-clear-btn" onclick="clearLogbook()">Clear All</button>';
    html += '</div>';
    html += '</div>';
    
    // Add entries by date
    Object.keys(grouped).forEach(date => {
      const dateObj = new Date(date);
      const isToday = dateObj.toDateString() === new Date().toDateString();
      const isYesterday = dateObj.toDateString() === new Date(Date.now() - 86400000).toDateString();
      
      let dateLabel = date;
      if (isToday) dateLabel = '🔴 Today';
      else if (isYesterday) dateLabel = 'Yesterday';
      
      html += `<div class="logbook-date">${dateLabel}</div>`;
      
      grouped[date].forEach(entry => {
        const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        // Use conversion functions if available
        let altitude = 'N/A';
        if (entry.altitude) {
          if (window.convertAltitude) {
            const converted = window.convertAltitude(entry.altitude);
            altitude = `${converted.value.toLocaleString()}${converted.label}`;
          } else {
            const altFt = Math.round(entry.altitude * 3.28084);
            altitude = `${altFt.toLocaleString()}ft`;
          }
        }
        
        let speed = 'N/A';
        if (entry.velocity) {
          const speedKmh = entry.velocity * 3.6;
          if (window.convertSpeed) {
            const converted = window.convertSpeed(speedKmh);
            speed = converted.text;
          } else {
            speed = `${Math.round(speedKmh)}km/h`;
          }
        }
        
        let distance = '?';
        if (entry.distance !== undefined) {
          if (window.convertDistance) {
            const converted = window.convertDistance(entry.distance);
            distance = `${converted.value}${converted.label}`;
          } else {
            distance = `${entry.distance.toFixed(1)}km`;
          }
        }
        
        html += `
          <div class="logbook-entry">
            <div class="logbook-entry-header">
              <span class="logbook-callsign">${entry.callsign}</span>
              <span class="logbook-time">${time}</span>
            </div>
            <div class="logbook-entry-details">
              <span title="Altitude">🔺 ${altitude}</span>
              <span title="Speed">💨 ${speed}</span>
              <span title="Distance">${distance} away</span>
              <span title="Origin">${entry.origin || 'Unknown'}</span>
            </div>
          </div>
        `;
      });
    });
  }
  
  html += '</div>';
  
  // Show in modal
  showModal('Flight Logbook 📖', html, null, 'Close');
}

/**
 * Clear logbook with confirmation
 */
function clearLogbook() {
  showModal(
    'Clear Logbook',
    'Are you sure you want to clear all flight records? This cannot be undone.',
    () => {
      Logbook.clear();
      showLogbook(); // Refresh display
    },
    'Clear',
    true
  );
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Update badge on load
  Logbook.updateBadge();
  
  // Clean old entries (keep last 30 days)
  Logbook.clearOlderThan(30);
  
  // Add click handler to logbook button
  const logbookBtn = document.getElementById('logbook-btn');
  if (logbookBtn) {
    logbookBtn.addEventListener('click', showLogbook);
  }
});

// Expose Logbook globally
window.Logbook = Logbook;
