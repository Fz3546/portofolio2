
/* ═══════════════════════════════════════════════════════════════
   1. THEME TOGGLE
   Switches between [data-theme="dark"] and [data-theme="light"]
   on <html>. CSS variables do all the visual heavy-lifting.
═══════════════════════════════════════════════════════════════ */

/**
 * Flip the site between dark and light mode.
 * Called by both desktop and mobile toggle buttons.
 */
function toggleTheme() {
  const html    = document.documentElement;
  const current = html.getAttribute('data-theme') || 'dark';
  html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}

// Expose globally so inline onclick="toggleTheme()" in HTML still works.
window.toggleTheme = toggleTheme;


/* ═══════════════════════════════════════════════════════════════
   2. MOBILE NAVIGATION MENU
═══════════════════════════════════════════════════════════════ */

/**
 * Open / close the mobile drawer and swap the hamburger icon.
 */
function toggleMobile() {
  const menu   = document.getElementById('mobile-menu');
  const icon   = document.getElementById('menu-icon');
  if (!menu || !icon) return;

  const isHidden = menu.classList.contains('hidden');
  menu.classList.toggle('hidden');
  icon.textContent = isHidden ? 'close' : 'menu';
}

/**
 * Close the mobile drawer (called from each nav link's onclick).
 */
function closeMobile() {
  const menu = document.getElementById('mobile-menu');
  const icon = document.getElementById('menu-icon');
  if (!menu || !icon) return;

  menu.classList.add('hidden');
  icon.textContent = 'menu';
}

window.toggleMobile = toggleMobile;
window.closeMobile  = closeMobile;


/* ═══════════════════════════════════════════════════════════════
   3. SCROLL REVEAL
   Elements with class="reveal" fade + slide up when they enter
   the viewport. Uses IntersectionObserver for performance.
═══════════════════════════════════════════════════════════════ */

(function initScrollReveal() {
  /**
   * @param {IntersectionObserverEntry[]} entries
   */
  function handleReveal(entries, obs) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('visible');

      // Trigger typing animation if this is the hero section text container
      if (entry.target.contains(document.getElementById('typing-label'))) {
        if (typeof window.triggerTyping === 'function') {
          window.triggerTyping();
        }
      }

      obs.unobserve(entry.target);   // fire once only
    });
  }

  const revealObserver = new IntersectionObserver(handleReveal, {
    threshold: 0.12,   // element is 12 % visible before firing
  });

  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });
})();


/* ═══════════════════════════════════════════════════════════════
   3.5. TYPING ANIMATION
   Prepares and types out "Hallo Kenalin Aku" with low delay,
   then triggers the slide-in animation for "Faiz Al Amirin".
═══════════════════════════════════════════════════════════════ */

(function initTypingAnimation() {
  const label = document.getElementById('typing-label');
  const title = document.getElementById('typing-title');
  if (!label) return;

  /**
   * Wraps all plain text characters in spans to preserve layout sizes
   * while making characters invisible initially. Actual opacity/transform
   * is handled by the .typing-char / .typing-char.revealed CSS classes
   * for a smoother, GPU-friendly fade + rise instead of a hard jump.
   */
  function prepareTyping(element) {
    const html = element.innerHTML.trim();
    const regex = /(<[^>]+>|[^<])/g;
    const tokens = html.match(regex) || [];
    let newHTML = "";
    
    tokens.forEach(token => {
      if (token.startsWith('<') && token.endsWith('>')) {
        newHTML += token;
      } else {
        newHTML += `<span class="typing-char">${token}</span>`;
      }
    });
    element.innerHTML = newHTML;
  }

  // Prepare elements immediately
  prepareTyping(label);

  let typingTriggered = false;

  // Expose function globally to be triggered by Scroll Reveal or splash button
  window.triggerTyping = function() {
    if (typingTriggered) return;
    
    // Don't trigger animations if splash screen is still active (scroll-lock active)
    if (document.body.classList.contains('splash-active')) return;
    
    typingTriggered = true;
    const chars = label.querySelectorAll('.typing-char');
    const totalChars = chars.length;
    // Trigger title float near completion (~70% of label text) for a seamless fluid flow
    const triggerAt = Math.floor(totalChars * 0.7);
    let slideTriggered = false;

    function startTypingWithSlide(element, speed) {
      const chars = element.querySelectorAll('.typing-char');
      let i = 0;

      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      cursor.innerHTML = '|';
      element.appendChild(cursor);

      function type() {
        if (i < chars.length) {
          chars[i].classList.add('revealed');
          chars[i].after(cursor);
          i++;

          // Trigger title animation near label completion for visual harmony
          if (!slideTriggered && i >= triggerAt && title) {
            slideTriggered = true;
            title.classList.add('animate');
          }

          setTimeout(type, speed);
        } else {
          // Cursor blinks briefly then fades out smoothly
          setTimeout(() => {
            cursor.style.opacity = '0';
            setTimeout(() => cursor.remove(), 400);
          }, 600);
        }
      }
      type();
    }

    startTypingWithSlide(label, 42);
  };

  // Splash Screen Logic
  const splash = document.getElementById('landing-splash');

  function initSplash() {
    if (!splash) return;

    if (sessionStorage.getItem('visited-intro') === 'true') {
      // User already visited in this session: skip intro
      splash.style.display = 'none';
      document.body.classList.remove('splash-active');
      
      // Ensure nav is visible immediately
      const nav = document.querySelector('nav');
      if (nav) nav.classList.remove('nav-hidden');
      
      // Auto-trigger name animation slightly later
      setTimeout(() => {
        window.triggerTyping();
      }, 300);
    } else {
      // First visit: lock page and show splash
      document.body.classList.add('splash-active');
    }
  }

  function enterPortfolio() {
    if (!splash) return;

    // Mark as visited in session
    sessionStorage.setItem('visited-intro', 'true');

    // Unlock body scroll
    document.body.classList.remove('splash-active');

    // Fade in and slide down nav bar
    const nav = document.querySelector('nav');
    if (nav) nav.classList.remove('nav-hidden');

    // Smooth scroll to the main content (#home)
    const homeSection = document.getElementById('home');
    if (homeSection) {
      homeSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Trigger typing and name animations after scroll starts
    setTimeout(() => {
      window.triggerTyping();
    }, 800);
  }

  // Bind enterPortfolio to global window context
  window.enterPortfolio = enterPortfolio;

  // Run splash check on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplash);
  } else {
    initSplash();
  }
})();


/* ═══════════════════════════════════════════════════════════════
   4. LANGUAGE PROGRESS BARS
   Three bars (Indonesian, English, Arabic) animate to their
   target widths when the #skills section enters the viewport.
═══════════════════════════════════════════════════════════════ */

(function initProgressBars() {
  /* Map of element id → target width percentage */
  const TARGETS = {
    'prog-id': '100%',
    'prog-en': '65%',
    'prog-ar': '35%',
  };

  let animated = false;

  /**
   * Set each progress fill to its final width.
   * A small setTimeout gives the browser one frame to paint
   * the element at 0 % before the CSS transition fires.
   */
  function animateProgress() {
    if (animated) return;
    animated = true;

    setTimeout(() => {
      Object.entries(TARGETS).forEach(([id, width]) => {
        const el = document.getElementById(id);
        if (el) el.style.width = width;
      });
    }, 300);
  }

  const skillsSection = document.getElementById('skills');
  if (!skillsSection) return;

  const progressObserver = new IntersectionObserver(
    entries => { if (entries[0].isIntersecting) animateProgress(); },
    { threshold: 0.30 }
  );

  progressObserver.observe(skillsSection);

  // Expose for manual calls (e.g. from the reveal observer if needed)
  window.animateProgress = animateProgress;
})();


/* ═══════════════════════════════════════════════════════════════
   5. ACTIVE NAVIGATION HIGHLIGHTING (SCROLL-SPY)
   Adds/removes the .active class on desktop nav links as the
   user scrolls through each section.
═══════════════════════════════════════════════════════════════ */

(function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');

  if (!sections.length || !navLinks.length) return;

  /** Return the id of the section currently in view */
  function getCurrentSection() {
    let current = '';
    sections.forEach(section => {
      // Get absolute offset from top of document to prevent offsetParent issues with relative parents
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const threshold = sectionTop - 120;   // 120 px offset for fixed nav
      if (window.scrollY >= threshold) {
        current = section.getAttribute('id');
      }
    });
    return current;
  }

  function updateActiveLink() {
    const current = getCurrentSection();
    navLinks.forEach(link => {
      const matches = link.dataset.section === current;
      link.classList.toggle('active', matches);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // Run once on load in case the page is already scrolled
  updateActiveLink();
})();


/* ═══════════════════════════════════════════════════════════════
   5.5 NAVBAR GLASS CLICK & RIPPLE EFFECT
   Creates dynamic glass ripple wave + container sheen flash
   whenever any navbar link or container is clicked.
═══════════════════════════════════════════════════════════════ */
(function initNavbarGlassEffect() {
  function createGlassRipple(e, container) {
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.5;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const wave = document.createElement('span');
    wave.className = 'glass-ripple-wave';
    wave.style.width = `${size}px`;
    wave.style.height = `${size}px`;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;

    container.appendChild(wave);

    setTimeout(() => {
      wave.remove();
    }, 700);
  }

  function handleNavClick(e) {
    const link = e.target.closest('.nav-link, .brand-logo');
    const container = e.target.closest('.nav-glass-container');

    if (link) {
      link.classList.add('glass-clicked');
      setTimeout(() => link.classList.remove('glass-clicked'), 350);
      createGlassRipple(e, link);
    } else if (container) {
      container.classList.add('glass-flash');
      setTimeout(() => container.classList.remove('glass-flash'), 450);
      createGlassRipple(e, container);
    }
  }

  function setupListeners() {
    const navbars = document.querySelectorAll('.nav-glass-container');
    navbars.forEach(nav => {
      nav.addEventListener('click', handleNavClick);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupListeners);
  } else {
    setupListeners();
  }
})();


/* ═══════════════════════════════════════════════════════════════
   6. CONTACT FORM MOCK SUBMIT
   Simulates a network request, then shows a success message.
   Replace the setTimeout block with a real fetch() call when
   connecting to a back-end or service like Formspree / EmailJS.
═══════════════════════════════════════════════════════════════ */

/**
 * Called via onclick="handleSubmit(this)" on the submit button.
 * @param {HTMLButtonElement} btn — the button that was clicked
 */
function handleSubmit(btn) {
  // Prevent double-submission
  if (btn.disabled) return;

  // Visual loading state
  const originalHTML = btn.innerHTML;
  btn.innerHTML      = 'Mengirim...';
  btn.disabled       = true;
  btn.style.opacity  = '0.7';

  // ── Replace this block with a real fetch() call ──────────────
  setTimeout(() => {
    btn.style.display = 'none';

    const successEl = document.getElementById('form-success');
    if (successEl) {
      successEl.style.display = 'block';
    }

    // Optionally reset the form after a delay
    setTimeout(() => {
      const form = btn.closest('div[style]') || btn.parentElement;
      if (form) {
        form.querySelectorAll('.contact-input').forEach(input => {
          input.value = '';
        });
      }
    }, 3000);
  }, 1200);
  // ── End of mock block ─────────────────────────────────────────
}

window.handleSubmit = handleSubmit;






/* ═══════════════════════════════════════════════════════════════
   7. OPTIONAL ENHANCEMENTS
   Un-comment any block below to enable additional interactivity.
═══════════════════════════════════════════════════════════════ */

/*
// ── Smooth scroll for all anchor links ────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
*/

/*
// ── Persist theme preference in localStorage ──────────────────
(function restoreTheme() {
  const saved = localStorage.getItem('alhakim-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

// Override toggleTheme to also save preference
const _baseToggle = window.toggleTheme;
window.toggleTheme = function () {
  _baseToggle();
  const theme = document.documentElement.getAttribute('data-theme');
  localStorage.setItem('alhakim-theme', theme);
};
*/

/*
// ── Parallax orbs on mouse move ───────────────────────────────
(function initParallax() {
  const orb1 = document.querySelector('.orb1');
  const orb2 = document.querySelector('.orb2');
  if (!orb1 || !orb2) return;

  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    orb1.style.transform = `translate(${x}px, ${y}px)`;
    orb2.style.transform = `translate(${-x * 0.6}px, ${-y * 0.6}px)`;
  });
})();
*/

/* ═══════════════════════════════════════════════════════════════
   8. PORTFOLIO CARD SLIDERS
   Manages image sliders in portfolio card design-card-img-wrapper
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  const sliders = document.querySelectorAll(".slider-container");
  
  sliders.forEach(slider => {
    const track = slider.querySelector(".slider-track");
    const slides = slider.querySelectorAll(".slider-slide");
    const dots = slider.querySelectorAll(".dot");
    const prevBtn = slider.querySelector(".prev-btn");
    const nextBtn = slider.querySelector(".next-btn");
    
    if (!track || !slides.length) return;
    
    let currentIndex = 0;
    const maxIndex = slides.length - 1;
    
    function updateSlider() {
      // Move track
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      // Update dots
      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === currentIndex);
      });
    }
    
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
        updateSlider();
      });
      
      nextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentIndex = currentIndex === maxIndex ? 0 : currentIndex + 1;
        updateSlider();
      });
    }
    
    dots.forEach((dot, index) => {
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentIndex = index;
        updateSlider();
      });
    });
  });
});

/* ═══════════════════════════════════════════════════════════════
   9. PROFESSIONAL EXPERIENCE 3-COLUMN SLIDER
   ═══════════════════════════════════════════════════════════════ */
(function initProfSlider() {
  function setupSlider() {
    const track = document.getElementById('prof-slider-track');
    const container = document.getElementById('prof-slider-container');
    const prevBtn = document.getElementById('prof-prev-btn');
    const nextBtn = document.getElementById('prof-next-btn');
    const dotsContainer = document.getElementById('prof-dots');
    
    if (!track || !container) return;

    const slides = Array.from(track.querySelectorAll('.prof-slide-item'));
    if (!slides.length) return;

    let currentIndex = 0;

    function getItemsPerPage() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 640) return 2;
      return 1;
    }

    function getMaxIndex() {
      const itemsPerPage = getItemsPerPage();
      return Math.max(0, slides.length - itemsPerPage);
    }

    function updateDots() {
      if (!dotsContainer) return;
      const maxIdx = getMaxIndex();
      dotsContainer.innerHTML = '';
      
      for (let i = 0; i <= maxIdx; i++) {
        const dot = document.createElement('button');
        dot.className = `prof-dot ${i === currentIndex ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      }
    }

    function updateSlider() {
      const maxIdx = getMaxIndex();
      if (currentIndex > maxIdx) currentIndex = maxIdx;
      if (currentIndex < 0) currentIndex = 0;

      const gap = 24;
      const itemWidth = slides[0].getBoundingClientRect().width;
      const moveDistance = (itemWidth + gap) * currentIndex;

      track.style.transform = `translateX(-${moveDistance}px)`;

      updateDots();
    }

    function goTo(index) {
      const maxIdx = getMaxIndex();
      if (maxIdx <= 0) return;
      currentIndex = (index + (maxIdx + 1)) % (maxIdx + 1);
      updateSlider();
    }

    function next() {
      const maxIdx = getMaxIndex();
      if (maxIdx <= 0) return;
      if (currentIndex < maxIdx) {
        currentIndex++;
      } else {
        currentIndex = 0;
      }
      updateSlider();
    }

    function prev() {
      const maxIdx = getMaxIndex();
      if (maxIdx <= 0) return;
      if (currentIndex > 0) {
        currentIndex--;
      } else {
        currentIndex = maxIdx;
      }
      updateSlider();
    }

    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);

    // Touch Swipe Support
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) next();
        else prev();
      }
    }, { passive: true });

    window.addEventListener('resize', updateSlider, { passive: true });

    updateSlider();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSlider);
  } else {
    setupSlider();
  }
})();


