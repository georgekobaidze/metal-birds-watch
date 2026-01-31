/* ============================================
   THEME MANAGEMENT
   ============================================ */

let currentTheme = 'dark';
let manualOverride = false;

/**
 * Determine theme based on current time
 * @returns {string} 'dark' or 'light'
 */
function getThemeForTime() {
  const hour = new Date().getHours();
  // Dark: 6PM (18:00) to 6AM (6:00)
  // Light: 6AM to 6PM
  if (hour >= CONFIG.THEME_SWITCH_HOUR_NIGHT || hour < CONFIG.THEME_SWITCH_HOUR_DAY) {
    return 'dark';
  }
  return 'light';
}

/**
 * Toggle theme manually
 */
function toggleTheme() {
  manualOverride = true;
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('theme-override', newTheme);
  debug(`Theme manually toggled to: ${newTheme}`);
}

/**
 * Apply theme to document
 * @param {string} theme - 'dark' or 'light'
 */
function applyTheme(theme) {
  if (theme === currentTheme) return;
  
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update theme indicator
  const themeText = document.getElementById('theme-text');
  const themeIcon = document.querySelector('.theme-icon');
  
  if (theme === 'dark') {
    if (themeText) themeText.textContent = 'Dark Mode';
    if (themeIcon) themeIcon.textContent = '🌙';
  } else {
    if (themeText) themeText.textContent = 'Light Mode';
    if (themeIcon) themeIcon.textContent = '☀️';
  }
  
  // Update map tiles if map exists
  if (window.map) {
    updateMapTiles(theme);
  }
  
  debug(`Theme switched to: ${theme}`);
}

/**
 * Update map tile layer based on theme
 * @param {string} theme - 'dark' or 'light'
 */
function updateMapTiles(theme) {
  if (!window.map || !window.tileLayer) return;
  
  // Get tile URL from CSS variable
  const tileUrl = getComputedStyle(document.documentElement)
    .getPropertyValue('--map-tiles')
    .trim()
    .replace(/['"]/g, '');
  
  window.tileLayer.setUrl(tileUrl);
}

/**
 * Initialize theme system
 */
function initTheme() {
  // Apply initial theme without transition
  document.documentElement.classList.add('no-transition');
  
  // Check for manual override in localStorage
  const savedTheme = localStorage.getItem('theme-override');
  let theme;
  if (savedTheme) {
    theme = savedTheme;
    manualOverride = true;
  } else {
    theme = getThemeForTime();
  }
  applyTheme(theme);
  
  // Re-enable transitions after a frame
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.documentElement.classList.remove('no-transition');
    }, 50);
  });
  
  // Add click handler to theme info
  const themeInfo = document.getElementById('theme-info');
  if (themeInfo) {
    themeInfo.style.cursor = 'pointer';
    themeInfo.addEventListener('click', toggleTheme);
  }
  
  // Check for automatic theme changes every minute (only if no manual override)
  setInterval(() => {
    if (!manualOverride) {
      const newTheme = getThemeForTime();
      if (newTheme !== currentTheme) {
        applyTheme(newTheme);
      }
    }
  }, 60000); // Check every minute
  
  debug('Theme system initialized');
}

// Initialize theme on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
