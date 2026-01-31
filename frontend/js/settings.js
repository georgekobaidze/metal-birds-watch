/* ============================================
   SETTINGS MANAGEMENT - Clean Implementation
   ============================================ */

// Settings object - handles all preferences
const Settings = {
  storageKey: 'metal-birds-settings',
  
  defaults: {
    soundEnabled: true,
    browserNotificationsEnabled: true,
    unitSystem: 'metric',   // 'metric' or 'imperial'
    useKnots: false,        // If true, speed shown in knots regardless of unitSystem
    themeMode: 'auto'       // 'auto', 'dark', 'light'
  },
  
  get(key) {
    const all = this.getAll();
    return all[key];
  },
  
  getAll() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return { ...this.defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    return { ...this.defaults };
  },
  
  set(key, value) {
    const all = this.getAll();
    all[key] = value;
    this.save(all);
  },
  
  save(settings) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
      debug('✅ Settings saved');
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }
};

// Unit converters
const UnitConverter = {
  speed: {
    fromKmh: (kmh, useKnots, unitSystem) => {
      if (useKnots) {
        return Math.round(kmh * 0.539957);
      }
      if (unitSystem === 'imperial') {
        return Math.round(kmh * 0.621371);
      }
      return Math.round(kmh);
    },
    label: (useKnots, unitSystem) => {
      if (useKnots) return 'knots';
      return unitSystem === 'imperial' ? 'mph' : 'km/h';
    }
  },
  
  altitude: {
    fromMeters: (meters, unitSystem) => {
      if (unitSystem === 'imperial') {
        return Math.round(meters * 3.28084);
      }
      return Math.round(meters);
    },
    label: (unitSystem) => unitSystem === 'imperial' ? 'ft' : 'm'
  },
  
  distance: {
    fromKm: (km, unitSystem) => {
      if (unitSystem === 'imperial') {
        return (km * 0.621371).toFixed(1);
      }
      return km.toFixed(1);
    },
    label: (unitSystem) => unitSystem === 'imperial' ? 'mi' : 'km'
  }
};

// Convert and format speed
function convertSpeed(speedKmh) {
  const useKnots = Settings.get('useKnots');
  const unitSystem = Settings.get('unitSystem');
  const value = UnitConverter.speed.fromKmh(speedKmh, useKnots, unitSystem);
  const label = UnitConverter.speed.label(useKnots, unitSystem);
  return { value, label, text: `${value} ${label}` };
}

// Convert and format altitude
function convertAltitude(altitudeMeters) {
  const unitSystem = Settings.get('unitSystem');
  const value = UnitConverter.altitude.fromMeters(altitudeMeters, unitSystem);
  const label = UnitConverter.altitude.label(unitSystem);
  return { value, label, text: `${value}${label}` };
}

// Convert and format distance
function convertDistance(distanceKm) {
  const unitSystem = Settings.get('unitSystem');
  const value = UnitConverter.distance.fromKm(distanceKm, unitSystem);
  const label = UnitConverter.distance.label(unitSystem);
  return { value, label, text: `${value}${label}` };
}

// Show settings modal
function showSettings() {
  const settings = Settings.getAll();
  
  const html = `
    <div class="settings-content">
      
      <div class="settings-section">
        <h3 class="settings-section-title">Notifications</h3>
        <div class="settings-item">
          <label class="settings-label">
            <input type="checkbox" id="set-sound" ${settings.soundEnabled ? 'checked' : ''}>
            <span>Notification sound</span>
          </label>
        </div>
        <div class="settings-item">
          <label class="settings-label">
            <input type="checkbox" id="set-browser-notif" ${settings.browserNotificationsEnabled ? 'checked' : ''}>
            <span>Browser notifications</span>
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h3 class="settings-section-title">Units</h3>
        <div class="settings-item">
          <label class="settings-label-block">
            <span>Unit system</span>
            <select id="set-unit-system" class="settings-select">
              <option value="metric" ${settings.unitSystem === 'metric' ? 'selected' : ''}>Metric (km, m, km/h)</option>
              <option value="imperial" ${settings.unitSystem === 'imperial' ? 'selected' : ''}>Imperial (mi, ft, mph)</option>
            </select>
          </label>
        </div>
        <div class="settings-item">
          <label class="settings-label">
            <input type="checkbox" id="set-use-knots" ${settings.useKnots ? 'checked' : ''}>
            <span>Use knots for speed</span>
          </label>
          <p class="settings-help">When enabled, speed is shown in knots regardless of unit system.</p>
        </div>
      </div>
      
      <div class="settings-section">
        <h3 class="settings-section-title">Theme</h3>
        <div class="settings-item">
          <label class="settings-label-block">
            <span>Default theme</span>
            <select id="set-theme-mode" class="settings-select">
              <option value="auto" ${settings.themeMode === 'auto' ? 'selected' : ''}>Auto (Time-based)</option>
              <option value="dark" ${settings.themeMode === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="light" ${settings.themeMode === 'light' ? 'selected' : ''}>Light</option>
            </select>
          </label>
          <p class="settings-help">Auto switches between light and dark at 6AM/6PM.</p>
        </div>
      </div>
      
      <div class="settings-section">
        <h3 class="settings-section-title">Data</h3>
        <div class="settings-item">
          <button class="settings-btn settings-btn-danger" id="btn-reset-stats">
            Reset Statistics
          </button>
          <p class="settings-help">Clears Aircraft Spotted, Fastest Spotted, and Closest Plane</p>
        </div>
      </div>
      
    </div>
  `;
  
  showModal('Settings ⚙️', html, () => {
    saveSettingsFromModal();
  }, 'Save', true, true); // Last parameter: successButton = true (green button)
  
  // Add button handlers after modal is shown
  setTimeout(() => {
    const btnReset = document.getElementById('btn-reset-stats');
    
    if (btnReset) btnReset.addEventListener('click', handleResetStats);
  }, 100);
}

// Save settings from modal form
function saveSettingsFromModal() {
  const newSettings = {
    soundEnabled: document.getElementById('set-sound')?.checked ?? true,
    browserNotificationsEnabled: document.getElementById('set-browser-notif')?.checked ?? true,
    unitSystem: document.getElementById('set-unit-system')?.value ?? 'metric',
    useKnots: document.getElementById('set-use-knots')?.checked ?? false,
    themeMode: document.getElementById('set-theme-mode')?.value ?? 'auto'
  };
  
  Settings.save(newSettings);
  applyThemeMode(newSettings.themeMode);
  
  // Refresh UI with new units - only update the unit-dependent stats without resetting data
  // The next polling cycle will naturally refresh everything
  if (window.updateStatsDisplay) {
    window.updateStatsDisplay();
  }
  
  showToast('Settings saved successfully', 'success');
}

// Handle reset statistics button
function handleResetStats(e) {
  e.preventDefault();
  e.stopPropagation();
  
  // Close settings modal by clicking cancel button (proper cleanup)
  const cancelBtn = document.getElementById('modal-cancel');
  if (cancelBtn) {
    cancelBtn.click();
  }
  
  // Show confirmation after short delay
  setTimeout(() => {
    showConfirmModal(
      'Reset Statistics',
      'Reset Aircraft Spotted, Fastest Spotted, and Closest Plane stats?'
    ).then(confirmed => {
      if (confirmed && window.resetStatistics) {
        window.resetStatistics();
        showToast('Statistics reset successfully', 'success');
      }
    });
  }, 350);
}

// Handle export logbook
function handleExportLogbook(format) {
  const entries = window.Logbook ? window.Logbook.getAll() : [];
  
  if (entries.length === 0) {
    showToast('Logbook is empty', 'info');
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
  
  showToast(`Exported ${entries.length} flights`, 'success');
}

// Apply theme mode
function applyThemeMode(mode) {
  if (mode === 'dark') {
    localStorage.setItem('theme-override', 'dark');
    if (window.applyTheme) window.applyTheme('dark');
  } else if (mode === 'light') {
    localStorage.setItem('theme-override', 'light');
    if (window.applyTheme) window.applyTheme('light');
  } else if (mode === 'auto') {
    localStorage.removeItem('theme-override');
    if (window.getThemeForTime && window.applyTheme) {
      window.applyTheme(window.getThemeForTime());
    }
  }
  // manual: do nothing, let user toggle freely
}

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', showSettings);
  }
  
  // Apply theme mode on load
  const themeMode = Settings.get('themeMode');
  if (themeMode && themeMode !== 'manual') {
    applyThemeMode(themeMode);
  }
});

// Expose globally
window.Settings = Settings;
window.convertSpeed = convertSpeed;
window.convertAltitude = convertAltitude;
window.convertDistance = convertDistance;
window.showSettings = showSettings;
