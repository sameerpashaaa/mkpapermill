/**
 * Sri MK Papers — main.js
 * Vanilla ES6+, no jQuery, progressive enhancement
 *
 * Features:
 *  1. Lenis smooth scroll (butter-smooth inertial scrolling)
 *  2. Header sticky / scroll state
 *  3. Mobile nav
 *  4. Scroll reveal (fade-up / fade-left / fade-right / scale-in variants)
 *  5. Animated counters
 *  6. Contact forms
 *  7. Back-to-top
 *  8. Active nav link
 *  9. Hero video mute toggle
 * 10. prefers-reduced-motion respected throughout
 */

'use strict';

/* ============================================
   REDUCED-MOTION GATE
   ============================================ */
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

/* ============================================
   1. LENIS SMOOTH SCROLL
   ============================================ */
(function initSmoothScroll() {
  // Lenis is loaded via CDN before this script
  if (typeof Lenis === 'undefined') return;
  if (prefersReducedMotion) return; // respect accessibility preference

  const lenis = new Lenis({
    duration: 1.2,          // scroll duration multiplier (higher = slower/smoother)
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease-out
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    smoothTouch: false,     // disable on touch devices — iOS handles it natively
    touchMultiplier: 2,
    infinite: false,
  });

  // Wire Lenis into ScrollTrigger if GSAP is present (future-proof)
  // lenis.on('scroll', ScrollTrigger?.update);

  // RAF loop — Lenis needs this to tick each frame
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Expose so other code can call lenis.scrollTo()
  window.__lenis = lenis;

  // Wire anchor <a href="#..."> links to Lenis smooth-scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -88, duration: 1.4 }); // 88 = header height
    });
  });
})();

/* ============================================
   2. NAVIGATION
   ============================================ */
(function initNav() {
  const header     = document.getElementById('siteHeader');
  const toggle     = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!header) return;

  // Sticky scroll shadow — throttled via rAF
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 10);
        const btt = document.getElementById('backToTop');
        if (btt) btt.classList.toggle('visible', window.scrollY > 300);
        ticking = false;
      });
      ticking = true;
    }
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

    document.addEventListener('click', (e) => {
      if (
        mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });

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
   3. SCROLL REVEAL
   Supports: data-reveal="up|left|right|scale|fade"
   Supports: data-reveal-delay="100..600"
   ============================================ */
(function initReveal() {
  // If reduced motion, just show everything immediately
  if (prefersReducedMotion) {
    document.querySelectorAll('[class*="reveal"], [data-reveal]').forEach(el => {
      el.classList.add('visible');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal, [data-reveal]').forEach(el =>
      el.classList.add('visible')
    );
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.revealDelay || 0;
          // Apply delay inline so it only fires once
          setTimeout(() => el.classList.add('visible'), parseInt(delay, 10));
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.10, rootMargin: '0px 0px -48px 0px' }
  );

  document.querySelectorAll('.reveal, [data-reveal]').forEach(el =>
    observer.observe(el)
  );
})();

/* ============================================
   4. ANIMATED COUNTERS
   ============================================ */
(function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const duration = prefersReducedMotion ? 0 : 1800;

  const animateCounter = (el) => {
    const target   = parseFloat(el.dataset.counter);
    const suffix   = el.dataset.suffix   || '';
    const prefix   = el.dataset.prefix   || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;

    if (duration === 0) {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }

    const start = performance.now();
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = prefix + (target * easeOut(progress)).toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(el => observer.observe(el));
})();

/* ============================================
   5. CONTACT / ENQUIRY FORMS
   ============================================ */
(function initForms() {
  const forms = document.querySelectorAll('[data-form]');

  forms.forEach(form => {
    const successId = form.dataset.successTarget;
    const successEl = successId ? document.getElementById(successId) : null;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;
      form.querySelectorAll('[required]').forEach(field => {
        const isValid = field.checkValidity();
        field.classList.toggle('is-invalid', !isValid);
        if (!isValid) valid = false;
      });

      if (!valid) {
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const data = {};
      new FormData(form).forEach((v, k) => (data[k] = v));
      const lines = Object.entries(data)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
        .join('\n');

      const companyName = data.company || data.name || 'Enquiry';
      const subject = encodeURIComponent(
        `Product Enquiry — ${companyName} — Sri MK Papers Website`
      );
      const body = encodeURIComponent(lines);
      window.open(`mailto:aman@srimkpapers.com?subject=${subject}&body=${body}`);

      if (successEl) {
        form.style.display = 'none';
        successEl.classList.add('show');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    form.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('input',  () => field.classList.remove('is-invalid'));
      field.addEventListener('change', () => field.classList.remove('is-invalid'));
    });
  });
})();

/* ============================================
   6. BACK TO TOP
   ============================================ */
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
})();

/* ============================================
   7. ACTIVE NAV LINK
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
   8. HERO VIDEO MUTE TOGGLE
   ============================================ */
(function initHeroMute() {
  const btn  = document.getElementById('heroMuteBtn');
  const icon = document.getElementById('heroMuteIcon');
  const vid  = document.querySelector('.hero-video-bg');
  
  if (vid) {
    vid.playbackRate = 0.65; // Slow down video for cinematic premium pacing
  }
  
  if (!btn || !vid) return;

  btn.addEventListener('click', function () {
    vid.muted = !vid.muted;
    icon.className = vid.muted ? 'ph ph-speaker-slash' : 'ph ph-speaker-high';
  });
})();

/* ============================================
   9. PROCESS TIMELINE ANIMATION
   ============================================ */
(function initProcessTimeline() {
  const section = document.querySelector('.process-section');
  const activeLine = document.querySelector('.process-timeline-active');
  const steps = document.querySelectorAll('.process-step');

  if (!section || !steps.length) return;

  // Respect prefers-reduced-motion
  if (prefersReducedMotion) {
    if (activeLine) {
      activeLine.style.width = '100%';
      activeLine.style.height = '100%';
    }
    steps.forEach(step => step.classList.add('reveal-active'));
    return;
  }

  // Set initial states for elements
  steps.forEach(step => {
    step.classList.add('timeline-reveal');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animate the line (width on desktop, height on mobile)
        if (activeLine) {
          activeLine.style.width = '100%';
          activeLine.style.height = '100%';
        }

        // Staggered reveal of the steps
        steps.forEach((step, idx) => {
          setTimeout(() => {
            step.classList.add('reveal-active');
          }, idx * 150 + 200); // 150ms stagger
        });

        // Disconnect after triggering
        observer.unobserve(entry.target);
      }
    });
  }, {
    // Start once ~30% of the section is in viewport
    threshold: 0.3
  });

  observer.observe(section);
})();
