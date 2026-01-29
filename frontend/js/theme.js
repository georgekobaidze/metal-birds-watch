/* ============================================
   THEME MANAGEMENT
   ============================================ */

let currentTheme = 'dark';

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
  
  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
  
  window.tileLayer.setUrl(tileUrl);
}

/**
 * Initialize theme system
 */
function initTheme() {
  // Apply initial theme without transition
  document.documentElement.classList.add('no-transition');
  const theme = getThemeForTime();
  applyTheme(theme);
  
  // Re-enable transitions after a frame
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.documentElement.classList.remove('no-transition');
    }, 50);
  });
  
  // Check for theme changes every minute
  setInterval(() => {
    const newTheme = getThemeForTime();
    if (newTheme !== currentTheme) {
      applyTheme(newTheme);
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
