
'use strict';

const navbar      = document.getElementById('navbar');
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');
const themeToggle = document.getElementById('theme-toggle');
const html        = document.documentElement;

const THEME_KEY = 'getEmployed_theme';

function applyTheme(theme) {
  if (theme === 'light') {
    html.setAttribute('data-theme', 'light');
    localStorage.setItem(THEME_KEY, 'light');
    themeToggle.setAttribute('aria-label', 'Light mode active');
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem(THEME_KEY, 'dark');
    themeToggle.setAttribute('aria-label', 'Dark mode active');
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'light') {
    applyTheme('light');
  } else {
    applyTheme('dark');
  }
}

themeToggle.addEventListener('click', () => {
  const currentTheme = html.getAttribute('data-theme');
  if (currentTheme === 'dark') {
    applyTheme('light');
  } else {
    applyTheme('dark');
  }
});

initTheme();

let ticking = false;

function onScroll() {
  const y = window.scrollY;
  if (y > 100) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(onScroll);
    ticking = true;
  }
}, { passive: true });

onScroll();

function openMenu() {
  hamburger.classList.add('active');
  mobileMenu.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  mobileMenu.setAttribute('aria-hidden', 'false');
  document.body.style.overflowY = 'hidden';
}

function closeMenu() {
  hamburger.classList.remove('active');
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflowY = '';
}

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.contains('open');
  isOpen ? closeMenu() : openMenu();
});

mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    closeMenu();
    hamburger.focus();
  }
});

function revealHeroWords() {
  const letters = document.querySelectorAll('.hero-heading .letter');
  letters.forEach((letter, i) => {
    setTimeout(() => {
      letter.style.transition = 'all 0.35s ease';
      letter.style.filter     = 'blur(0px)';
      letter.style.opacity    = '1';
      letter.style.transform  = 'translateY(0)';
    }, i * 80);
  });

  const totalDelay = letters.length * 80 + 200;

  const heroSub  = document.getElementById('hero-sub');
  const heroDesc = document.getElementById('hero-desc');
  const heroBadge = document.querySelector('.hero-tag');

  if (heroBadge) {
    setTimeout(() => {
      heroBadge.style.transition = 'all 0.5s ease';
      heroBadge.style.opacity    = '1';
      heroBadge.style.transform  = 'translateY(0)';
      heroBadge.style.filter     = 'blur(0)';
    }, 100);
  }

  if (heroSub) {
    setTimeout(() => {
      heroSub.classList.add('revealed');
    }, totalDelay);
  }

  if (heroDesc) {
    setTimeout(() => {
      heroDesc.classList.add('revealed');
    }, totalDelay + 150);
  }

  const ctaWrap = document.querySelector('.hero-cta-wrap');
  if (ctaWrap) {
    ctaWrap.style.opacity = '0';
    ctaWrap.style.transform = 'translateY(20px)';
    setTimeout(() => {
      ctaWrap.style.transition = 'all 0.5s ease';
      ctaWrap.style.opacity    = '1';
      ctaWrap.style.transform  = 'translateY(0)';
    }, totalDelay + 300);
  }

  const scrollInd = document.querySelector('.scroll-indicator');
  if (scrollInd) {
    scrollInd.style.opacity = '0';
    setTimeout(() => {
      scrollInd.style.transition = 'opacity 0.6s ease';
      scrollInd.style.opacity    = '1';
    }, totalDelay + 500);
  }
}

const heroBadgeInit = document.querySelector('.hero-tag');
if (heroBadgeInit) {
  heroBadgeInit.style.opacity   = '0';
  heroBadgeInit.style.transform = 'translateY(10px)';
  heroBadgeInit.style.filter    = 'blur(4px)';
}

window.addEventListener('load', () => {
  setTimeout(revealHeroWords, 200);
});

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function animateCounter(el, target, duration = 2000) {
  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed  = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOutQuart(progress);
    const current  = Math.round(eased * target);
    el.textContent = current.toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target.toLocaleString();
    }
  }
  requestAnimationFrame(step);
}

const statItems   = document.querySelectorAll('.animate-stat');
const statNumbers = document.querySelectorAll('.stat-number[data-target]');
let statsAnimated = false;

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !statsAnimated) {
      statsAnimated = true;
      statItems.forEach((item, i) => {
        setTimeout(() => item.classList.add('visible'), i * 120);
      });
      statNumbers.forEach((numEl) => {
        const target = parseInt(numEl.getAttribute('data-target'), 10);
        if (!isNaN(target)) animateCounter(numEl, target, 1800);
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const statsBar = document.getElementById('stats-bar');
if (statsBar) statsObserver.observe(statsBar);

const sectionObserverFade = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section-observe').forEach(el => {
  sectionObserverFade.observe(el);
});

const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle(
          'active',
          link.getAttribute('href') === `#${id}`
        );
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(sec => sectionObserver.observe(sec));

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  applyTheme('dark');
});
