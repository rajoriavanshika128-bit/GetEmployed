

'use strict';


const navbar      = document.getElementById('navbar');
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');
const themeToggle = document.getElementById('theme-toggle');
const html        = document.documentElement;


const THEME_KEY = 'getEmployed_theme';

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);


  themeToggle.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved ?? (systemDark ? 'dark' : 'light');
  applyTheme(theme);
}

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

initTheme();


let lastScrollY = 0;
let ticking     = false;

function onScroll() {
  const y = window.scrollY;

  
  if (y > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  lastScrollY = y;
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


mobileLinks.forEach(link => {
  link.addEventListener('click', closeMenu);
});


document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    closeMenu();
    hamburger.focus();
  }
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
        setTimeout(() => {
          item.classList.add('visible');
        }, i * 120);
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


window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {

  if (!localStorage.getItem(THEME_KEY)) {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});
