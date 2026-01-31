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
            <div class="custom-select" data-id="set-unit-system" data-value="${settings.unitSystem}">
              <div class="custom-select-trigger">
                <span>${settings.unitSystem === 'metric' ? 'Metric (km, m, km/h)' : 'Imperial (mi, ft, mph)'}</span>
              </div>
              <div class="custom-select-options">
                <div class="custom-select-option ${settings.unitSystem === 'metric' ? 'selected' : ''}" data-value="metric">Metric (km, m, km/h)</div>
                <div class="custom-select-option ${settings.unitSystem === 'imperial' ? 'selected' : ''}" data-value="imperial">Imperial (mi, ft, mph)</div>
              </div>
            </div>
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
            <div class="custom-select" data-id="set-theme-mode" data-value="${settings.themeMode}">
              <div class="custom-select-trigger">
                <span>${settings.themeMode === 'auto' ? 'Auto (Time-based)' : settings.themeMode === 'dark' ? 'Always Dark' : 'Always Light'}</span>
              </div>
              <div class="custom-select-options">
                <div class="custom-select-option ${settings.themeMode === 'auto' ? 'selected' : ''}" data-value="auto">Auto (Time-based)</div>
                <div class="custom-select-option ${settings.themeMode === 'dark' ? 'selected' : ''}" data-value="dark">Always Dark</div>
                <div class="custom-select-option ${settings.themeMode === 'light' ? 'selected' : ''}" data-value="light">Always Light</div>
              </div>
            </div>
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
  
  // Attach button handlers and initialize custom dropdowns immediately after modal is shown
  const btnReset = document.getElementById('btn-reset-stats');
  
  if (btnReset) btnReset.addEventListener('click', handleResetStats);
  
  // Initialize custom dropdowns
  initializeCustomDropdowns();
}

// Save settings from modal form
function saveSettingsFromModal() {
  // Read from custom dropdowns
  const unitSystemSelect = document.querySelector('[data-id="set-unit-system"]');
  const themeModeSelect = document.querySelector('[data-id="set-theme-mode"]');
  
  const newSettings = {
    soundEnabled: document.getElementById('set-sound')?.checked ?? true,
    browserNotificationsEnabled: document.getElementById('set-browser-notif')?.checked ?? true,
    unitSystem: unitSystemSelect?.dataset.value ?? 'metric',
    useKnots: document.getElementById('set-use-knots')?.checked ?? false,
    themeMode: themeModeSelect?.dataset.value ?? 'auto'
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
// Note: Logbook export functionality is handled by Logbook.exportLogbook()
// in the dedicated logbook module. The previous handleExportLogbook
// implementation here was duplicate and unused.

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

// Track if document-level click handler has been initialized
let dropdownClickHandlerInitialized = false;

// Initialize custom dropdowns after modal is shown
function initializeCustomDropdowns() {
  document.querySelectorAll('.custom-select').forEach(select => {
    const trigger = select.querySelector('.custom-select-trigger');
    const options = select.querySelectorAll('.custom-select-option');
    
    // Remove existing listeners by cloning and replacing elements
    const newTrigger = trigger.cloneNode(true);
    trigger.parentNode.replaceChild(newTrigger, trigger);
    
    // Toggle dropdown
    newTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close all other dropdowns
      document.querySelectorAll('.custom-select.open').forEach(other => {
        if (other !== select) other.classList.remove('open');
      });
      select.classList.toggle('open');
    });
    
    // Select option
    options.forEach(option => {
      // Clone and replace to remove old listeners
      const newOption = option.cloneNode(true);
      option.parentNode.replaceChild(newOption, option);
      
      newOption.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = newOption.dataset.value;
        const text = newOption.textContent;
        
        // Update UI
        newTrigger.querySelector('span').textContent = text;
        select.dataset.value = value;
        
        // Update selected state
        select.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
        newOption.classList.add('selected');
        
        // Close dropdown
        select.classList.remove('open');
      });
    });
  });
  
  // Add document-level click handler only once
  if (!dropdownClickHandlerInitialized) {
    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-select.open').forEach(select => {
        select.classList.remove('open');
      });
    });
    dropdownClickHandlerInitialized = true;
  }
}

