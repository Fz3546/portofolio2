
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
   * Wraps all plain text characters in spans with opacity 0 to preserve layout sizes
   * while making characters invisible initially.
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
        newHTML += `<span class="typing-char" style="opacity: 0; transition: opacity 0.1s;">${token}</span>`;
      }
    });
    element.innerHTML = newHTML;
  }

  // Prepare label immediately to prevent Cumulative Layout Shift (CLS)
  prepareTyping(label);

  /**
   * Animates the typing effect for the given element.
   */
  function startTyping(element, speed, callback) {
    const chars = element.querySelectorAll('.typing-char');
    let i = 0;
    
    // Create cursor element
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.innerHTML = '|';
    element.appendChild(cursor);
    
    function type() {
      if (i < chars.length) {
        chars[i].style.opacity = '1';
        chars[i].parentNode.insertBefore(cursor, chars[i].nextSibling);
        i++;
        setTimeout(type, speed);
      } else {
        // Keep blinking for 0.8s, then remove
        setTimeout(() => {
          cursor.style.opacity = '0';
          setTimeout(() => cursor.remove(), 300);
          if (callback) callback();
        }, 800);
      }
    }
    type();
  }

  // Expose function globally to be triggered by Scroll Reveal
  window.triggerTyping = function() {
    const chars = label.querySelectorAll('.typing-char');
    const totalChars = chars.length;
    // Trigger slide-in when typing reaches ~40% through the label text
    const triggerAt = Math.floor(totalChars * 0.4);
    let slideTriggered = false;

    // Patched startTyping that fires slide-in mid-way
    function startTypingWithSlide(element, speed) {
      const chars = element.querySelectorAll('.typing-char');
      let i = 0;

      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      cursor.innerHTML = '|';
      element.appendChild(cursor);

      function type() {
        if (i < chars.length) {
          chars[i].style.opacity = '1';
          chars[i].parentNode.insertBefore(cursor, chars[i].nextSibling);
          i++;

          // Trigger slide-in once 40% of characters have been typed
          if (!slideTriggered && i >= triggerAt && title) {
            slideTriggered = true;
            title.classList.add('animate');
          }

          setTimeout(type, speed);
        } else {
          // Cursor blinks briefly then fades out
          setTimeout(() => {
            cursor.style.opacity = '0';
            setTimeout(() => cursor.remove(), 300);
          }, 800);
        }
      }
      type();
    }

    startTypingWithSlide(label, 30);
  };
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
      const threshold = section.offsetTop - 120;   // 120 px offset for fixed nav
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
