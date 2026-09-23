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
 * Tower Q&A script
 * answer: string, or function(context) returning a string
 * link: optional - appends a link to the GitHub issue to the answer
 * followUps: question IDs offered after this answer
 */
const TOWER_QA = {
  why: {
    question: 'Why are there no planes?',
    answer: 'Our flight data provider changed its access policy and now blocks requests from ' +
      'cloud servers, which is where our backend runs. No data coming in means no aircraft to show.',
    followUps: ['yourEnd', 'fixed', 'askedThem']
  },
  yourEnd: {
    question: 'Is it something on my end?',
    answer: 'Negative. Your location, browser and connection are all fine. ' +
      'Every visitor sees this same page right now.',
    followUps: ['why', 'fixed']
  },
  fixed: {
    question: 'When will it be fixed?',
    answer: ({ days }) => 'No ETA yet. We\'re switching to a new flight data provider, and this page ' +
      'will disappear as soon as we\'re cleared for takeoff. ' +
      `We've been grounded for ${days} ${days === 1 ? 'day' : 'days'} so far.`,
    followUps: ['askedThem', 'back']
  },
  askedThem: {
    question: 'Couldn\'t they just let you in?',
    answer: 'We asked. They confirmed there are no exceptions for servers like ours, ' +
      'so we\'re moving to a new provider.',
    followUps: ['fixed', 'back']
  },
  logbook: {
    question: 'Is my logbook safe?',
    answer: 'Affirmative. Your logbook lives in your own browser, not on our servers, so the ' +
      'outage can\'t touch it. Open it anytime with the 📖 button up top.',
    followUps: ['stillWorks']
  },
  stillWorks: {
    question: 'What can I still use?',
    answer: 'Your logbook, notification history and settings, all in the top bar. ' +
      'Only live aircraft tracking is grounded.',
    followUps: ['logbook', 'fixed']
  },
  back: {
    question: 'How will I know you\'re back?',
    answer: 'This page will be gone and planes will be back on your map. To be notified, watch ',
    link: true,
    followUps: ['fixed']
  }
};

const TOWER_START = ['why', 'yourEnd', 'fixed', 'logbook'];
const TOWER_TYPING_MS = 600;

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

  // Opens the Tower Q&A panel
  const towerBtn = createMaintenanceElement('button', 'maintenance-tower-btn', '🗼 Ask the Tower');
  towerBtn.type = 'button';
  towerBtn.id = 'maintenance-tower-btn';
  towerBtn.setAttribute('aria-controls', 'tower-panel');
  towerBtn.setAttribute('aria-expanded', 'false');

  const content = createMaintenanceElement('div', 'maintenance-content');
  content.append(header, callout, text, promise, meta, towerBtn);

  page.append(content, createTowerPanel(towerBtn));
  document.body.appendChild(page);

  debug('Maintenance page shown');
}

/**
 * Create the Tower Q&A panel (opened by the "Ask the Tower" button)
 * @param {HTMLButtonElement} toggleBtn - Button that opens and closes the panel
 * @returns {HTMLElement} Panel element
 */
function createTowerPanel(toggleBtn) {
  const panel = createMaintenanceElement('aside', 'tower-panel');
  panel.id = 'tower-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'tower-title');

  // Header: icon, title, close button
  const header = createMaintenanceElement('div', 'tower-header');
  const title = createMaintenanceElement('h3', 'tower-title', 'Metal Birds Tower');
  title.id = 'tower-title';
  const closeBtn = createMaintenanceElement('button', 'tower-close', '×');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close Tower');
  header.append(createMaintenanceElement('span', 'tower-icon', '🗼'), title, closeBtn);

  // Conversation log - new answers are announced to screen readers
  const log = createMaintenanceElement('div', 'tower-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  const greeting = createMaintenanceElement(
    'p',
    'tower-msg tower-msg-tower',
    'Metal Birds Tower here. Live traffic is unavailable while we\'re in the hangar. ' +
    'What would you like to know?'
  );
  log.appendChild(greeting);

  const chips = createMaintenanceElement('div', 'tower-chips');
  panel.append(header, log, chips);

  const { SINCE, ISSUE_URL } = CONFIG.MAINTENANCE;
  const context = { days: getOutageDay(parseLocalDate(SINCE)) };
  const issueNumber = ISSUE_URL.split('/').pop();
  const asked = new Set();

  const addMessage = (message) => {
    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
  };

  // Build the Tower's answer, with the issue link if the script asks for one
  const createAnswer = (entry) => {
    const answer = typeof entry.answer === 'function' ? entry.answer(context) : entry.answer;
    const message = createMaintenanceElement('p', 'tower-msg tower-msg-tower', answer);
    if (entry.link) {
      const link = createMaintenanceElement('a', 'tower-link', `issue #${issueNumber} on GitHub`);
      link.href = ISSUE_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      message.append(link, '.');
    }
    return message;
  };

  // Show unasked follow-ups; fall back to any unasked question, then "Start over"
  const renderChips = (ids) => {
    chips.replaceChildren();
    let available = ids.filter(id => !asked.has(id));
    if (available.length === 0) {
      available = Object.keys(TOWER_QA).filter(id => !asked.has(id));
    }

    if (available.length === 0) {
      const restart = createMaintenanceElement('button', 'tower-chip', '↺ Start over');
      restart.type = 'button';
      restart.addEventListener('click', () => {
        asked.clear();
        log.replaceChildren(greeting);
        renderChips(TOWER_START);
        chips.firstChild.focus();
      });
      chips.appendChild(restart);
      return;
    }

    available.forEach(id => {
      const chip = createMaintenanceElement('button', 'tower-chip', TOWER_QA[id].question);
      chip.type = 'button';
      chip.addEventListener('click', () => ask(id));
      chips.appendChild(chip);
    });
  };

  const showAnswer = (id) => {
    addMessage(createAnswer(TOWER_QA[id]));
    renderChips(TOWER_QA[id].followUps);
    // New chips can change the log's height - keep the answer in view
    log.scrollTop = log.scrollHeight;
    // Keep keyboard users in the conversation - the clicked chip is gone
    chips.firstChild.focus();
  };

  const ask = (id) => {
    asked.add(id);
    chips.replaceChildren();
    addMessage(createMaintenanceElement('p', 'tower-msg tower-msg-user', TOWER_QA[id].question));

    // Skip the typing pause for users who prefer reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showAnswer(id);
      return;
    }

    const typing = createMaintenanceElement('p', 'tower-msg tower-msg-tower tower-typing');
    typing.setAttribute('aria-hidden', 'true');
    typing.append(
      createMaintenanceElement('span', 'tower-typing-dot'),
      createMaintenanceElement('span', 'tower-typing-dot'),
      createMaintenanceElement('span', 'tower-typing-dot')
    );
    addMessage(typing);

    setTimeout(() => {
      typing.remove();
      showAnswer(id);
    }, TOWER_TYPING_MS);
  };

  renderChips(TOWER_START);

  const setOpen = (open) => {
    panel.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', String(open));
    (open ? closeBtn : toggleBtn).focus();
  };

  toggleBtn.addEventListener('click', () => setOpen(panel.hidden));
  closeBtn.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      setOpen(false);
    }
  });

  return panel;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (CONFIG.MAINTENANCE.ACTIVE) {
    initMaintenancePage();
  }
});
