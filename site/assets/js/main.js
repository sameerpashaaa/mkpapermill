/**
 * Sri MK Papers — main.js (Phase 2)
 * Vanilla ES6+, no jQuery, progressive enhancement
 */

'use strict';

/* ============================================
   NAVIGATION
   ============================================ */
(function initNav() {
  const header  = document.getElementById('siteHeader');
  const toggle  = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!header) return;

  // Sticky scroll shadow
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
    // Back to top
    const btt = document.getElementById('backToTop');
    if (btt) btt.classList.toggle('visible', window.scrollY > 300);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('open') &&
          !mobileMenu.contains(e.target) &&
          !toggle.contains(e.target)) {
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });

    // Close on nav link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }
})();

/* ============================================
   SCROLL REVEAL
   ============================================ */
(function initReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: just show everything
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

/* ============================================
   ANIMATED COUNTERS
   ============================================ */
(function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const duration = 1800;

  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    const start = performance.now();

    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const val = target * easeOut(progress);
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

/* ============================================
   CONTACT / ENQUIRY FORMS
   ============================================ */
(function initForms() {
  const forms = document.querySelectorAll('[data-form]');
  
  forms.forEach(form => {
    const successId = form.dataset.successTarget;
    const successEl = successId ? document.getElementById(successId) : null;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate
      let valid = true;
      const requiredFields = form.querySelectorAll('[required]');
      requiredFields.forEach(field => {
        const isValid = field.checkValidity();
        field.classList.toggle('is-invalid', !isValid);
        if (!isValid) valid = false;
      });

      if (!valid) {
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Gather form data for mailto
      const data = {};
      new FormData(form).forEach((v, k) => data[k] = v);

      const lines = Object.entries(data)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
        .join('\n');

      const companyName = data.company || data.name || 'Enquiry';
      const subject = encodeURIComponent(`Product Enquiry — ${companyName} — Sri MK Papers Website`);
      const body = encodeURIComponent(lines);

      window.open(`mailto:aman@srimkpapers.com?subject=${subject}&body=${body}`);

      // Show success
      if (successEl) {
        form.style.display = 'none';
        successEl.classList.add('show');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // Live remove invalid class on input
    form.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('input', () => field.classList.remove('is-invalid'));
      field.addEventListener('change', () => field.classList.remove('is-invalid'));
    });
  });
})();

/* ============================================
   BACK TO TOP
   ============================================ */
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ============================================
   ACTIVE NAV LINK (based on current URL)
   ============================================ */
(function initActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-link]').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('active');
    }
  });
})();

/* ============================================
   HERO VIDEO MUTE TOGGLE (index.html only)
   ============================================ */
(function initHeroMute() {
  const btn  = document.getElementById('heroMuteBtn');
  const icon = document.getElementById('heroMuteIcon');
  const vid  = document.querySelector('.hero-video-bg');
  if (!btn || !vid) return;

  btn.addEventListener('click', function () {
    vid.muted = !vid.muted;
    icon.className = vid.muted ? 'ph ph-speaker-slash' : 'ph ph-speaker-high';
  });
})();
