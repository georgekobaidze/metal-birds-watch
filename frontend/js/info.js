/**
 * Info modals - Built By & What's Next
 */

// Configuration - Edit these values
const INFO_CONFIG = {
  photo: "assets/icons/logo.png", // Replace with your photo path
  firstName: "Your",
  lastName: "Name",
  title: "Your Title / Role",
  bio: "Your bio text here. A few sentences about who you are, what you do, and your background in development.",
  purpose: "Describe the purpose of this project. What inspired you to build it? What problem does it solve? What technologies did you use?",
  social: [
    { name: "GitHub", url: "", icon: "github" },
    { name: "LinkedIn", url: "", icon: "linkedin" },
    { name: "Twitter/X", url: "", icon: "twitter" },
    { name: "Dev.to", url: "", icon: "devto" },
    { name: "Discord", url: "", icon: "discord" }
  ],
  roadmap: [
    "Historical flight path replay",
    "Advanced filtering by altitude, speed, and airline",
    "Custom alert zones with notifications",
    "Aircraft database with photos and details",
    "Flight schedule predictions",
    "Weather overlay integration",
    "Sound notifications for nearby aircraft",
    "Mobile app version",
    "Multi-location tracking",
    "Data export to various formats"
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
    purposeEl.textContent = INFO_CONFIG.purpose;
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
        link.textContent = s.name;
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
    listEl.innerHTML = INFO_CONFIG.roadmap
      .map(feature => `<li class="roadmap-item">${feature}</li>`)
      .join('');
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
