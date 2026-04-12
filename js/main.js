'use strict';
(function () {
  const navbar          = document.getElementById('navbar');
  const hamburgerBtn    = document.getElementById('hamburger-btn');
  const navLinks        = document.getElementById('nav-links');
  const searchContainer = document.getElementById('search-container');
  const searchToggleBtn = document.getElementById('search-toggle-btn');
  const searchInput     = document.getElementById('search-input');
  const heroCTA         = document.getElementById('hero-cta');
  const heroGhostCTA    = document.getElementById('hero-cta-ghost');
  const heroTitle       = document.getElementById('hero-heading');
  const themeToggleBtn  = document.getElementById('theme-toggle-btn');
  const themeIconDark   = document.getElementById('theme-icon-dark');
  const themeIconLight  = document.getElementById('theme-icon-light');
  function onScroll() {
    const y = window.scrollY;
    if (y > 60) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
    const docH    = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docH > 0 ? Math.round((y / docH) * 100) : 0;
    navbar?.style.setProperty('--scroll-percent', `${percent}%`);
    const sections = ['hero', 'row-top-picks', 'saved', 'opportunities', 'about'];
    let currentId = 'hero';
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.45) {
        currentId = id;
      }
    }
    const navMap = {
      hero: 'nav-home',
      'row-top-picks': 'nav-browse',
      saved: 'nav-saved',
      opportunities: 'nav-browse',
      about: 'nav-about',
    };
    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    const activeNav = document.getElementById(navMap[currentId]);
    if (activeNav) activeNav.classList.add('active');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); 
  heroCTA?.addEventListener('click', () => {
    document.getElementById('opportunities')
      ?.scrollIntoView({ behavior: 'smooth' });
  });
  heroGhostCTA?.addEventListener('click', () => {
    document.getElementById('about')
      ?.scrollIntoView({ behavior: 'smooth' });
  });
  if (searchToggleBtn && searchContainer) {
    searchToggleBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = searchContainer.classList.toggle('active');
      searchToggleBtn.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        setTimeout(() => searchInput?.focus(), 180);
      }
    });
    document.addEventListener('click', e => {
      if (!searchContainer.contains(e.target)) {
        searchContainer.classList.remove('active');
        searchToggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
    searchInput?.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        searchContainer.classList.remove('active');
        searchToggleBtn.setAttribute('aria-expanded', 'false');
        searchToggleBtn.focus();
      }
    });
  }
  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('mobile-active');
      hamburgerBtn.classList.toggle('active', isOpen);
      hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-active');
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', e => {
      if (navLinks.classList.contains('mobile-active') &&
          !navLinks.contains(e.target) &&
          !hamburgerBtn.contains(e.target)) {
        navLinks.classList.remove('mobile-active');
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  if (heroTitle) {
    const words = heroTitle.innerHTML.trim().split(/\s+/);
    heroTitle.innerHTML = words
      .map(w => `<span class="hero-word" style="
        display:inline-block;
        opacity:0;
        transform:translateY(18px);
        transition:opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1);
      ">${w}</span>`)
      .join(' ');
    heroTitle.querySelectorAll('.hero-word').forEach((word, i) => {
      setTimeout(() => {
        word.style.opacity    = '1';
        word.style.transform  = 'translateY(0)';
      }, 200 + i * 150);
    });
  }
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('section, footer').forEach(el => {
    el.classList.add('section-reveal');
    revealObserver.observe(el);
  });
  document.querySelectorAll('.content-row').forEach(row => {
    const container = row.querySelector('.scroll-container');
    const leftBtn   = row.querySelector('.scroll-arrow--left');
    const rightBtn  = row.querySelector('.scroll-arrow--right');
    if (!container) return;
    const step = () => Math.round(container.offsetWidth * 0.75);
    leftBtn?.addEventListener('click',  () => container.scrollBy({ left: -step(), behavior: 'smooth' }));
    rightBtn?.addEventListener('click', () => container.scrollBy({ left:  step(), behavior: 'smooth' }));
    function updateArrows() {
      if (!leftBtn || !rightBtn) return;
      const atStart = container.scrollLeft <= 8;
      const atEnd   = container.scrollLeft + container.offsetWidth >= container.scrollWidth - 8;
      leftBtn.style.visibility  = atStart ? 'hidden' : 'visible';
      rightBtn.style.visibility = atEnd   ? 'hidden' : 'visible';
    }
    container.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize',   updateArrows, { passive: true });
    updateArrows();
  });
  document.querySelectorAll('.tab[data-cat]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab[data-cat]').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.dispatchEvent(new CustomEvent('categorychange', {
        detail: { category: tab.dataset.cat }
      }));
    });
  });
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
