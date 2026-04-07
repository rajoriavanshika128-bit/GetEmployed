'use strict';

(function () {


  const navbar         = document.getElementById('navbar');
  const searchContainer = document.getElementById('search-container');
  const searchToggleBtn = document.getElementById('search-toggle-btn');
  const searchInput    = document.getElementById('search-input');
  const heroTitle      = document.getElementById('hero-heading');
  const hamburgerBtn   = document.getElementById('hamburger-btn');
  const navLinks       = document.querySelector('.nav-links');
  const heroCTA        = document.getElementById('hero-cta');
  const heroGhostCTA   = document.getElementById('hero-cta-ghost');


  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }, { passive: true });


  heroCTA?.addEventListener('click', () => {
    document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth' });
  });

  heroGhostCTA?.addEventListener('click', () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  });

 
  if (searchToggleBtn && searchContainer) {
    searchToggleBtn.addEventListener('click', e => {
      e.stopPropagation();
      searchContainer.classList.toggle('active');
      if (searchContainer.classList.contains('active')) {
        setTimeout(() => searchInput?.focus(), 150);
      }
    });

    document.addEventListener('click', e => {
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


    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-active');
        hamburgerBtn.classList.remove('active');
      });
    });
  }


  if (heroTitle) {
    
    heroTitle.querySelectorAll('*').forEach(el => {
      
    });


    const originalHTML = heroTitle.innerHTML;
    const parts = originalHTML.trim().split(/\s+/);
    heroTitle.innerHTML = parts
      .map(p => `<span class="word" style="opacity:0;transform:translateY(20px);filter:blur(4px);display:inline-block;">${p}</span>`)
      .join(' ');

    heroTitle.querySelectorAll('.word').forEach((word, i) => {
      setTimeout(() => {
        word.style.transition = 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)';
        word.style.opacity    = '1';
        word.style.transform  = 'translateY(0)';
        word.style.filter     = 'blur(0px)';
      }, 300 + i * 200);
    });
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('section, footer').forEach(s => {
    s.classList.add('section-reveal');
    revealObserver.observe(s);
  });

  document.querySelectorAll('.content-row').forEach(row => {
    const container = row.querySelector('.scroll-container');
    const leftBtn   = row.querySelector('.scroll-arrow--left');
    const rightBtn  = row.querySelector('.scroll-arrow--right');
    if (!container || !leftBtn || !rightBtn) return;

    const step = () => container.offsetWidth * 0.8;

    leftBtn.addEventListener('click',  () => container.scrollBy({ left: -step(), behavior: 'smooth' }));
    rightBtn.addEventListener('click', () => container.scrollBy({ left:  step(), behavior: 'smooth' }));

    const updateArrows = () => {
      const atStart = container.scrollLeft <= 10;
      const atEnd   = container.scrollLeft + container.offsetWidth >= container.scrollWidth - 10;
      leftBtn.style.visibility  = atStart ? 'hidden' : 'visible';
      rightBtn.style.visibility = atEnd   ? 'hidden' : 'visible';
    };

    container.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize',   updateArrows, { passive: true });
    updateArrows();
  });


  document.querySelectorAll('.tab[data-cat]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab[data-cat]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Fire a custom event on the document so opportunities.js can react
      document.dispatchEvent(new CustomEvent('categorychange', {
        detail: { category: tab.dataset.cat }
      }));
    });
  });


  const copyEl = document.querySelector('.footer-copy');
  if (copyEl) {
    copyEl.innerHTML = copyEl.innerHTML.replace(
      /©️ \d{4}/,
      `©️ ${new Date().getFullYear()}`
    );
  }

})();