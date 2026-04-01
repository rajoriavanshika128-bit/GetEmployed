'use strict';

(function() {
  const navbar = document.getElementById('navbar');
  const searchContainer = document.getElementById('search-container');
  const searchToggleBtn = document.getElementById('search-toggle-btn');
  const searchInputLocal = document.getElementById('search-input');
  const heroTitle = document.getElementById('hero-heading');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navLinks = document.querySelector('.nav-links');
  const heroCTA = document.getElementById('hero-cta');
  const heroGhostCTA = document.getElementById('hero-cta-ghost');

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    navbar?.style.setProperty('--scroll-percent', scrolled + '%');

    if (currentScroll > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }, { passive: true });

  if (heroCTA) {
    heroCTA.addEventListener('click', () => {
      document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (heroGhostCTA) {
    heroGhostCTA.addEventListener('click', () => {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (searchToggleBtn && searchContainer) {
    searchToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      searchContainer.classList.toggle('active');
      if (searchContainer.classList.contains('active')) {
        setTimeout(() => searchInputLocal?.focus(), 150);
      }
    });
    document.addEventListener('click', (e) => {
      if (!searchContainer.contains(e.target)) {
        searchContainer.classList.remove('active');
      }
    });
  }

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-active');
      hamburgerBtn.classList.toggle('active');
    });
  }

  if (heroTitle) {
    const text = heroTitle.textContent.trim();
    const words = text.split(/\s+/);
    heroTitle.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(' ');
    const wordEls = heroTitle.querySelectorAll('.word');
    wordEls.forEach((word, i) => {
      setTimeout(() => {
        word.style.transition = 'all 1s cubic-bezier(0.16, 1, 0.3, 1)';
        word.style.opacity = '1';
        word.style.transform = 'translateY(0)';
        word.style.filter = 'blur(0px)';
      }, 300 + i * 200);
    });
  }

  const revealSections = document.querySelectorAll('section, footer');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  revealSections.forEach(s => {
    s.classList.add('section-reveal');
    revealObserver.observe(s);
  });

  document.querySelectorAll('.content-row').forEach(row => {
    const scrollContainer = row.querySelector('.scroll-container');
    const leftBtn = row.querySelector('.scroll-arrow--left');
    const rightBtn = row.querySelector('.scroll-arrow--right');
    if (scrollContainer && leftBtn && rightBtn) {
      const scrollStep = () => scrollContainer.offsetWidth * 0.8;
      leftBtn.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: -scrollStep(), behavior: 'smooth' });
      });
      rightBtn.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: scrollStep(), behavior: 'smooth' });
      });
      const updateArrows = () => {
        const atStart = scrollContainer.scrollLeft <= 10;
        const atEnd = scrollContainer.scrollLeft + scrollContainer.offsetWidth >= scrollContainer.scrollWidth - 10;
        leftBtn.style.visibility = atStart ? 'hidden' : 'visible';
        rightBtn.style.visibility = atEnd ? 'hidden' : 'visible';
      };
      scrollContainer.addEventListener('scroll', updateArrows);
      window.addEventListener('resize', updateArrows);
      updateArrows();
    }
  });

  document.querySelectorAll('.tab[data-cat]').forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;
      document.querySelectorAll('.tab[data-cat]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filterSelect = document.getElementById('filter-category');
      if (filterSelect) {
        filterSelect.value = cat;
        filterSelect.dispatchEvent(new Event('change'));
      }
    });
  });
})();
