/**
 * Info modals - Built By & What's Next
 */

/**
 * Get SVG icon for social platform
 */
function getSocialIcon(iconName) {
  const icons = {
    github: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    linkedin: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>',
    twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    devto: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z"/></svg>',
    discord: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/></svg>'
  };
  
  return icons[iconName] || '';
}

// Configuration - Edit these values
const INFO_CONFIG = {
  photo: "assets/images/author.jpg", // Replace with your photo path
  firstName: "Giorgi",
  lastName: "Kobaidze",
  title: "Principal Software Engineer | Aircraft Enthusiast",
  bio: "Passionate about a few things and all-in on every one of them. I build with the same care I brew coffee: strong and clean. Always aiming to be the main pilot in what I do, never just a passenger.",
  purpose: [
    "What started as a simple DEV.TO Copilot (a perfect name for the project's purpose and topic) challenge submission quickly turned into one of the most interesting and exciting projects I've ever built.",
    
    "Metal Birds Watch is a real-time aircraft-tracking web app that uses the public OpenSky service to retrieve flight data and notifies you when planes fly overhead and provides insightful information and stats. If you're anything like me, an aircraft enthusiast, you'll feel right at home with this app.",
    
    "I've wanted to build something like this for a long time, and the DEV.TO challenge finally gave me the perfect excuse. The app is completely stateless and doesn't permanently store any data. All data is fetched and processed entirely in memory by the backend application. I hope you'll enjoy it as much as I do.",
    
    "Feel free to contribute, fork the project, open pull requests, and join the Discord community to discuss future improvements. This is just the beginning. The app has huge potential, and your input absolutely matters."
  ],
  social: [
    { name: "GitHub", url: "https://github.com/georgekobaidze", icon: "github" },
    { name: "LinkedIn", url: "https://www.linkedin.com/in/giorgikobaidze/", icon: "linkedin" },
    { name: "Twitter/X", url: "https://x.com/georgekobaidze", icon: "twitter" },
    { name: "Dev.to", url: "https://dev.to/georgekobaidze", icon: "devto" },
    { name: "Discord", url: "https://discord.gg/cRe5ThCA", icon: "discord" }
  ],
  roadmap: [
    "Including more information about aircraft (type, photo, etc.)",
    "Weather overlay integration",
    "Mobile app version",
    "Desktop app version",
    "Smartwatch app version",
    "Customizable tracking radius and altitude filters",
    "Epecial notifications for favorite aircraft types and models",
  ],
  disclaimer: [
    "Your Privacy Matters: This application is completely stateless and privacy-first by design. We do not store any personal information or user data in any persistent database.",
    
    "Temporary Caching Only: Flight data from the OpenSky Network API is temporarily cached in server memory for 30 seconds to optimize performance and respect API rate limits. This cache is automatically cleared and refreshed frequently.",
    
    "Your Location: Your GPS coordinates are only used to filter relevant aircraft data in real-time. They are never logged, stored, or transmitted to any third-party services. Each request is independent and anonymous.",
    
    "No Tracking: We don't use cookies for tracking, analytics, or advertising. Your browsing activity and usage patterns are not monitored or recorded in any way."
  ]
};

/**
 * Initialize info modals
 */
function initInfoModals() {
  populateBuiltBy();
  populateWhatsNext();
  setupInfoHandlers();
}

/**
 * Populate Built By modal
 */
function populateBuiltBy() {
  // Photo
  const photoEl = document.getElementById('info-photo');
  if (photoEl) {
    photoEl.src = INFO_CONFIG.photo;
    photoEl.alt = `${INFO_CONFIG.firstName} ${INFO_CONFIG.lastName}`;
  }
  
  // Name
  const nameEl = document.getElementById('info-name');
  if (nameEl) {
    nameEl.textContent = `${INFO_CONFIG.firstName} ${INFO_CONFIG.lastName}`;
  }
  
  // Title
  const titleEl = document.getElementById('info-title');
  if (titleEl) {
    titleEl.textContent = INFO_CONFIG.title;
  }
  
  // Bio
  const bioEl = document.getElementById('info-bio');
  if (bioEl) {
    bioEl.textContent = INFO_CONFIG.bio;
  }
  
  // Purpose
  const purposeEl = document.getElementById('info-purpose');
  if (purposeEl) {
    // Clear existing content
    purposeEl.innerHTML = '';
    
    // Create separate paragraphs for each text block
    INFO_CONFIG.purpose.forEach((paragraph, index) => {
      const p = document.createElement('p');
      p.textContent = paragraph;
      p.className = 'purpose-paragraph';
      purposeEl.appendChild(p);
    });
  }
  
  // Disclaimer
  const disclaimerEl = document.getElementById('info-disclaimer');
  if (disclaimerEl) {
    // Clear existing content
    disclaimerEl.innerHTML = '';
    
    // Create separate paragraphs for each disclaimer text block
    INFO_CONFIG.disclaimer.forEach((paragraph, index) => {
      const p = document.createElement('p');
      p.textContent = paragraph;
      p.className = 'disclaimer-paragraph';
      disclaimerEl.appendChild(p);
    });
  }
  
  // Social links
  const socialEl = document.getElementById('info-social');
  if (socialEl) {
    // Clear any existing content
    socialEl.innerHTML = '';

    const socialsWithUrl = INFO_CONFIG.social.filter(s => s.url);

    if (socialsWithUrl.length > 0) {
      socialsWithUrl.forEach(s => {
        const link = document.createElement('a');
        link.href = s.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'social-link';
        link.title = s.name;
        
        // Add icon
        const icon = document.createElement('span');
        icon.className = 'social-icon';
        icon.innerHTML = getSocialIcon(s.icon);
        link.appendChild(icon);
        
        // Add text
        const text = document.createElement('span');
        text.textContent = s.name;
        link.appendChild(text);
        
        socialEl.appendChild(link);
      });
    } else {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'social-empty';
      emptyMsg.textContent = 'No social links provided yet.';
      socialEl.appendChild(emptyMsg);
    }
  }
}

/**
 * Populate What's Next modal
 */
function populateWhatsNext() {
  const listEl = document.getElementById('roadmap-list');
  
  if (listEl) {
    // Clear existing items
    listEl.innerHTML = '';

    // Safely create list items without using innerHTML for content
    INFO_CONFIG.roadmap.forEach(feature => {
      const li = document.createElement('li');
      li.className = 'roadmap-item';
      li.textContent = feature;
      listEl.appendChild(li);
    });
  }
}

/**
 * Setup event handlers
 */
function setupInfoHandlers() {
  // Built By modal
  const builtByLink = document.getElementById('built-by-link');
  const builtByModal = document.getElementById('built-by-modal');
  const builtByClose = document.getElementById('built-by-close');
  
  if (builtByLink && builtByModal) {
    builtByLink.addEventListener('click', (e) => {
      e.preventDefault();
      openBuiltByModal();
    });
    
    if (builtByClose) {
      builtByClose.addEventListener('click', () => {
        closeModal(builtByModal);
      });
    }
    
    builtByModal.addEventListener('click', (e) => {
      if (e.target === builtByModal) {
        closeModal(builtByModal);
      }
    });
  }
  
  // What's Next modal
  const whatsNextLink = document.getElementById('whats-next-link');
  const whatsNextModal = document.getElementById('whats-next-modal');
  const whatsNextClose = document.getElementById('whats-next-close');
  
  if (whatsNextLink && whatsNextModal) {
    whatsNextLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(whatsNextModal);
    });
    
    if (whatsNextClose) {
      whatsNextClose.addEventListener('click', () => {
        closeModal(whatsNextModal);
      });
    }
    
    whatsNextModal.addEventListener('click', (e) => {
      if (e.target === whatsNextModal) {
        closeModal(whatsNextModal);
      }
    });
  }
  
  // Roadmap social link - switches to Built By modal
  const roadmapSocialLink = document.getElementById('roadmap-social-link');
  if (roadmapSocialLink) {
    roadmapSocialLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Close What's Next modal
      const whatsNextModal = document.getElementById('whats-next-modal');
      closeModal(whatsNextModal);
      
      // Wait for close animation, then open Built By modal with highlight
      setTimeout(() => {
        openBuiltByModal(true);
      }, 350);
    });
  }
  
  // Purpose roadmap link - switches to What's Next modal
  const purposeRoadmapLink = document.getElementById('purpose-roadmap-link');
  if (purposeRoadmapLink) {
    purposeRoadmapLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Close Built By modal
      const builtByModal = document.getElementById('built-by-modal');
      closeModal(builtByModal);
      
      // Wait for close animation, then open What's Next modal
      setTimeout(() => {
        const whatsNextModal = document.getElementById('whats-next-modal');
        openModal(whatsNextModal);
      }, 350);
    });
  }
}

/**
 * Open Built By modal
 */
function openBuiltByModal(highlightSocial = false) {
  const builtByModal = document.getElementById('built-by-modal');
  if (!builtByModal) return;
  
  openModal(builtByModal);
  
  if (highlightSocial) {
    // Wait for modal to open, then scroll and highlight social section
    setTimeout(() => {
      const infoSocialEl = document.querySelector('#info-social');
      if (!infoSocialEl) return;
      const socialSection = infoSocialEl.closest('.info-section');
      const modalBody = builtByModal.querySelector('.modal-body');
      
      if (socialSection && modalBody) {
        // Scroll to social section
        socialSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight class
        socialSection.classList.add('highlight');
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          socialSection.classList.remove('highlight');
        }, 3000);
      }
    }, 400);
  }
}

/**
 * Open a modal
 */
function openModal(modal) {
  if (!modal) return;
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

/**
 * Close a modal
 */
function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 300);
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInfoModals);
} else {
  initInfoModals();
}
