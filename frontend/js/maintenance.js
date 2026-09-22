/**
 * Maintenance page - replaces the map during the upstream aircraft data outage
 * Shown unconditionally while CONFIG.MAINTENANCE.ACTIVE is true, so users see
 * it immediately instead of after a failed request
 */

/**
 * Parse a YYYY-MM-DD string as a local date (midnight)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} Local date
 */
function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get outage day number (the start date is day 1)
 * @param {Date} since - Outage start date
 * @returns {number} Day number
 */
function getOutageDay(since) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  // Round to absorb DST shifts between the two dates
  return Math.max(1, Math.round((today - since) / MS_PER_DAY) + 1);
}

/**
 * Format a date as "20 Sep 2026"
 * Formatted by hand - toLocaleDateString gives "Sep" or "Sept" depending on the browser
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatOutageDate(date) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Create an element with a class and optional text
 * @param {string} tag - Tag name
 * @param {string} className - CSS class
 * @param {string} text - Text content
 * @returns {HTMLElement} Element
 */
function createMaintenanceElement(tag, className, text = '') {
  const element = document.createElement(tag);
  element.className = className;
  if (text) {
    element.textContent = text;
  }
  return element;
}

/**
 * Render maintenance page (hangar photo + notice in the top-left corner)
 */
function initMaintenancePage() {
  const { SINCE, ISSUE_URL } = CONFIG.MAINTENANCE;
  const since = parseLocalDate(SINCE);

  // Hides the map, stats panel and bottom bar (see components.css)
  document.body.classList.add('maintenance-mode');

  const page = createMaintenanceElement('main', 'maintenance-page');
  page.id = 'maintenance-page';
  page.setAttribute('aria-labelledby', 'maintenance-title');

  // Header: NOTAM + maintenance tags, title
  const tags = createMaintenanceElement('div', 'maintenance-tags');
  tags.append(
    createMaintenanceElement('span', 'maintenance-tag', 'NOTAM'),
    createMaintenanceElement('span', 'maintenance-tag maintenance-tag-outline', 'Unscheduled maintenance')
  );
  const header = createMaintenanceElement('div', 'maintenance-header');
  const title = createMaintenanceElement('h2', 'maintenance-title', 'Grounded for maintenance');
  title.id = 'maintenance-title';
  header.append(tags, title);

  // Radio-call style notice
  const callout = createMaintenanceElement(
    'p',
    'maintenance-callout',
    'All stations, all stations: Metal Birds Watch is out of service for unscheduled ' +
    'maintenance until further notice. Live traffic is unavailable. Hold position.'
  );

  // Explanation
  const text = createMaintenanceElement(
    'p',
    'maintenance-text',
    'Our flight data provider has changed its access policy, and our servers can no ' +
    'longer reach it. We\'re switching to a new provider and will be back in the air ' +
    'as soon as it\'s ready. Nothing is wrong on your end.'
  );

  const promise = createMaintenanceElement(
    'p',
    'maintenance-promise',
    'We promise we\'ll be flying again together soon.'
  );

  // Meta: outage counter + issue link
  const meta = createMaintenanceElement('div', 'maintenance-meta');
  const counter = createMaintenanceElement(
    'span',
    'maintenance-counter',
    `Grounded since ${formatOutageDate(since)} · day ${getOutageDay(since)}`
  );
  const issueNumber = ISSUE_URL.split('/').pop();
  const link = createMaintenanceElement('a', 'maintenance-link', `Follow progress → #${issueNumber}`);
  link.href = ISSUE_URL;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  meta.append(counter, link);

  // Opens the Tower Q&A (wired up in the next step)
  const towerBtn = createMaintenanceElement('button', 'maintenance-tower-btn', '🗼 Ask the Tower');
  towerBtn.type = 'button';
  towerBtn.id = 'maintenance-tower-btn';

  const content = createMaintenanceElement('div', 'maintenance-content');
  content.append(header, callout, text, promise, meta, towerBtn);

  page.appendChild(content);
  document.body.appendChild(page);

  debug('Maintenance page shown');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (CONFIG.MAINTENANCE.ACTIVE) {
    initMaintenancePage();
  }
});
