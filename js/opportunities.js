'use strict';

const SAVED_KEY = 'getemployed_saved_v2';

function loadSavedJobs() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); }
  catch { return []; }
}

const state = {
  query:        '',
  trendingJobs: [],
  browseJobs:   [],
  loading:      false,
  error:        null,
  category:     'all',
  salary:       0,
  sort:         'relevance',
  page:         1,
  totalPages:   1,
  savedJobs:    loadSavedJobs(),
};

const searchInput      = document.getElementById('search-input');
const filterSalary     = document.getElementById('filter-salary');
const filterSort       = document.getElementById('filter-sort');
const cardsGrid        = document.getElementById('cards-grid');
const pagWrap          = document.getElementById('pagination-wrap');
const pagButtons       = document.getElementById('pagination-buttons');
const topPicksList     = document.getElementById('top-picks-list');
const savedSectionGrid = document.getElementById('saved-section-grid');
const jobPanel         = document.getElementById('job-panel');
const jpBackdrop       = document.getElementById('jp-backdrop');
const jpClose          = document.getElementById('jp-close');
const jpBody           = document.getElementById('jp-body');
const resultsCount     = document.getElementById('results-count');

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSaved(id) {
  return state.savedJobs.some(j => j.id === String(id));
}

function normalizeCategory(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('it') || l.includes('tech') || l.includes('software') || l.includes('engineer') || l.includes('data') || l.includes('developer')) return 'tech';
  if (l.includes('design') || l.includes('creative') || l.includes('art') || l.includes('media') || l.includes('ux') || l.includes('ui')) return 'design';
  if (l.includes('market') || l.includes('sales') || l.includes('growth') || l.includes('brand') || l.includes('content')) return 'marketing';
  if (l.includes('financ') || l.includes('bank') || l.includes('account') || l.includes('invest') || l.includes('audit')) return 'finance';
  if (l.includes('health') || l.includes('care') || l.includes('pharma') || l.includes('science') || l.includes('bio') || l.includes('nurse') || l.includes('medic')) return 'healthcare';
  return 'other';
}

function computeScore(job) {
  let score = 50;
  if (job.salaryMin > 0)            score += 15;
  if (job.description.length > 300) score += 20;
  if (job.company !== 'Organization') score += 15;
  return Math.min(score, 99);
}

function mapJob(raw, idx) {
  const categoryNorm = normalizeCategory(raw.category?.label || '');
  const job = {
    id:          String(raw.id || idx),
    role:        raw.title                  || 'Untitled Role',
    company:     raw.company?.display_name  || 'Organization',
    location:    raw.location?.display_name || 'Remote / Global',
    category:    raw.category?.label        || 'General',
    categoryNorm,
    salaryMin:   raw.salary_min             || 0,
    salaryMax:   raw.salary_max             || 0,
    description: raw.description            || 'See full listing for role details.',
    redirectUrl: raw.redirect_url           || '#',
    created:     raw.created                || new Date().toISOString(),
  };
  job.matchScore = computeScore(job);
  return job;
}

function formatSalary(job) {
  if (job.salaryMin > 0) {
    const fmt = n => n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${n}`;
    return job.salaryMax > job.salaryMin
      ? `${fmt(job.salaryMin)}–${fmt(job.salaryMax)}`
      : fmt(job.salaryMin);
  }
  return null;
}

function toggleSave(job) {
  const idx = state.savedJobs.findIndex(j => j.id === job.id);
  if (idx === -1) {
    state.savedJobs.push(job);
  } else {
    state.savedJobs.splice(idx, 1);
  }
  localStorage.setItem(SAVED_KEY, JSON.stringify(state.savedJobs));
  refreshAllUI();
}


function jobHue(id) {
  const hues = [230, 260, 290, 320, 170, 200, 30, 0];
  const sum  = [...String(id)].reduce((s, c) => s + c.charCodeAt(0), 0);
  return hues[sum % hues.length];
}


function shortLocation(loc) {
  if (!loc) return 'Remote';
  if (loc.toLowerCase().includes('remote')) return 'Remote';
  if (loc.toLowerCase().includes('hybrid')) return 'Hybrid';
  
  return loc.split(',')[0].trim();
}


function buildCard(job, opts = {}) {
  const { topIndex = null } = opts;
  const saved  = isSaved(job.id);
  const salary = formatSalary(job);
  const hue    = jobHue(job.id);
  const initial = (job.company || 'G').charAt(0).toUpperCase();
  const loc    = shortLocation(job.location);

  const card = document.createElement('article');
  card.className   = 'job-card';
  card.dataset.id  = job.id;
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${job.role} at ${job.company}`);

  card.innerHTML = `
    ${topIndex !== null ? `<div class="top10-number" aria-hidden="true">${topIndex + 1}</div>` : ''}
    <div class="card-inner-pad">
      <div class="card-header-row">
        <div class="company-logo"
             style="background: hsl(${hue},65%,48%);"
             aria-hidden="true">${escapeHtml(initial)}</div>
        <button class="az-save-btn${saved ? ' saved' : ''}"
                aria-label="${saved ? 'Remove from shortlist' : 'Add to shortlist'}"
                aria-pressed="${saved}">
          ${saved ? '✓' : '+'}
        </button>
      </div>

      <div class="card-title">${escapeHtml(job.role)}</div>
      <div class="card-company-loc">${escapeHtml(job.company)} · ${escapeHtml(loc)}</div>

      <div class="card-tags">
        <span class="tag-pill">${escapeHtml(job.category)}</span>
        ${salary ? `<span class="tag-pill">${escapeHtml(salary)}</span>` : ''}
        <span class="tag-pill location">${escapeHtml(loc)}</span>
      </div>

      <div class="match-score">${job.matchScore}% Match</div>
    </div>
  `;


  card.querySelector('.az-save-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleSave(job);
  });

  card.addEventListener('click', () => openPanel(job.id));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPanel(job.id);
    }
  });

  return card;
}


function renderSkeletons() {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = Array(9).fill(`
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-line long"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line medium"></div>
    </div>
  `).join('');
}

function getFilteredBrowseJobs() {
  let jobs = [...state.browseJobs];

  if (state.category && state.category !== 'all') {
    jobs = jobs.filter(j => j.categoryNorm === state.category);
  }

  if (state.salary > 0) {
    jobs = jobs.filter(j => j.salaryMin >= state.salary || j.salaryMax >= state.salary);
  }

  return jobs;
}

function renderBrowseResults() {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';

  if (state.loading) return; 

  const jobs = getFilteredBrowseJobs();


  if (resultsCount) {
    resultsCount.textContent = jobs.length > 0
      ? `${jobs.length} role${jobs.length !== 1 ? 's' : ''} found`
      : '';
  }

  if (jobs.length === 0) {
    cardsGrid.innerHTML = `
      <div class="empty-state">
        <p style="margin-bottom:1rem;">No roles found for the selected filters.</p>
        <button class="btn-secondary" id="clear-filters-btn">Clear Filters</button>
      </div>
    `;
    document.getElementById('clear-filters-btn')?.addEventListener('click', resetFilters);
    renderPagination(0);
    return;
  }

  const fragment = document.createDocumentFragment();
  jobs.forEach(job => fragment.appendChild(buildCard(job)));
  cardsGrid.appendChild(fragment);
  renderPagination(jobs.length);
}

function renderTrending() {
  if (!topPicksList) return;
  topPicksList.innerHTML = '';

  if (state.trendingJobs.length === 0) {
    topPicksList.innerHTML = `
      <li style="padding:2.5rem; color:var(--muted); text-align:center; list-style:none; font-size:0.9rem; min-width:280px;">
        Trending roles unavailable right now.
      </li>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  state.trendingJobs.forEach((job, i) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');
    li.appendChild(buildCard(job, { topIndex: i }));
    fragment.appendChild(li);
  });
  topPicksList.appendChild(fragment);
}

function renderSavedSection() {
  if (!savedSectionGrid) return;
  savedSectionGrid.innerHTML = '';

  if (state.savedJobs.length === 0) {
    savedSectionGrid.innerHTML = `
      <div class="saved-empty" id="saved-empty">
        No roles shortlisted yet. Browse opportunities and hit <strong>+</strong> to save them here.
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  state.savedJobs.forEach(job => fragment.appendChild(buildCard(job)));
  savedSectionGrid.appendChild(fragment);
}

function renderPagination(visibleCount) {
  if (!pagButtons) return;
  pagButtons.innerHTML = '';

  const max = state.totalPages;
  const cur = state.page;

  if (max <= 1 || visibleCount === 0) {
    if (pagWrap) pagWrap.hidden = true;
    return;
  }
  if (pagWrap) pagWrap.hidden = false;

  const scrollToSection = () => {
    document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const addBtn = (p, label, isActive = false, isDisabled = false) => {
    const btn = document.createElement('button');
    btn.className   = `page-btn${isActive ? ' active' : ''}`;
    btn.textContent = label;
    btn.disabled    = isDisabled;
    btn.setAttribute('aria-label', isActive ? `Page ${p}, current` : `Page ${p}`);
    btn.setAttribute('aria-current', isActive ? 'page' : undefined);
    if (!isDisabled && !isActive) {
      btn.addEventListener('click', () => {
        state.page = p;
        fetchBrowse(p).then(scrollToSection);
      });
    }
    pagButtons.appendChild(btn);
  };

  const addDots = () => {
    const span = document.createElement('span');
    span.className   = 'pag-dots';
    span.textContent = '…';
    span.setAttribute('aria-hidden', 'true');
    pagButtons.appendChild(span);
  };

  addBtn(cur - 1, '←', false, cur === 1);

  const start = Math.max(1, cur - 2);
  const end   = Math.min(max, cur + 2);

  if (start > 1) { addBtn(1, '1'); if (start > 2) addDots(); }
  for (let i = start; i <= end; i++) addBtn(i, String(i), i === cur);
  if (end < max)  { if (end < max - 1) addDots(); addBtn(max, String(max)); }

  addBtn(cur + 1, '→', false, cur === max);
}


function refreshAllUI() {
  renderBrowseResults();
  renderTrending();
  renderSavedSection();
}


function resetFilters() {
  state.category = 'all';
  state.salary   = 0;
  state.sort     = 'relevance';
  state.query    = '';

  if (filterSort)   filterSort.value   = 'relevance';
  if (filterSalary) filterSalary.value = 'any';
  if (searchInput)  searchInput.value  = '';

  document.querySelectorAll('.tab[data-cat]').forEach(t => {
    const isAll = t.dataset.cat === 'all';
    t.classList.toggle('active', isAll);
    t.setAttribute('aria-selected', String(isAll));
  });

  fetchBrowse(1);
}


async function fetchTrending() {
  try {
    const data = await fetchJobs('graduate intern', 1, 'relevance', 0);
    state.trendingJobs = (data.results || [])
      .map((raw, idx) => mapJob(raw, idx))
      .slice(0, 10);
    renderTrending();
  } catch (err) {
    console.error('[fetchTrending]', err);
    renderTrending();
  }
}

async function fetchBrowse(page = 1) {
  if (state.loading) return;
  state.loading = true;
  state.page    = page;
  state.error   = null;

  renderSkeletons();
  if (resultsCount) resultsCount.textContent = 'Loading…';

  try {
    const data = await fetchJobs(
      state.query || 'graduate',
      state.page,
      state.sort,
      state.salary
    );

    const trendingIds = new Set(state.trendingJobs.map(j => j.id));

    state.browseJobs = (data.results || [])
      .map((raw, idx) => mapJob(raw, idx + (page - 1) * 20))
      .filter(job => !trendingIds.has(job.id));

    state.totalPages = Math.min(Math.ceil((data.count || 0) / 20), 50);
    state.loading    = false;

    renderBrowseResults();

  } catch (err) {
    state.loading = false;
    state.error   = err.message;
    console.error('[fetchBrowse]', err);

    if (resultsCount) resultsCount.textContent = '';

    if (cardsGrid) {
      cardsGrid.innerHTML = `
        <div class="error-msg" role="alert">
          <p>${escapeHtml(err.message || 'Unable to load opportunities. Please try again.')}</p>
          <button onclick="location.reload()" class="btn-secondary" style="margin-top:1rem;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
}


function openPanel(id) {
  const sid = String(id);
  const job = [...state.browseJobs, ...state.trendingJobs, ...state.savedJobs]
    .find(j => j.id === sid);
  if (!job || !jpBody) return;

  const saved  = isSaved(job.id);
  const salary = formatSalary(job);
  const loc    = shortLocation(job.location);
  const hue    = jobHue(job.id);
  const initial = (job.company || 'G').charAt(0).toUpperCase();

  jpBody.innerHTML = `
    <div class="modal-hero" style="background: hsl(${hue},45%,12%);">
      <div style="
        position:absolute; inset:0; z-index:1;
        display:flex; align-items:center; justify-content:center;
        background: linear-gradient(135deg, hsl(${hue},60%,15%), hsl(${hue + 40},50%,12%));
      ">
        <div style="
          width:80px; height:80px; border-radius:18px;
          background: hsl(${hue},65%,48%);
          display:flex; align-items:center; justify-content:center;
          font-size:2rem; font-weight:700; color:#fff;
          box-shadow: 0 8px 32px hsl(${hue},65%,20%);
        ">${escapeHtml(initial)}</div>
      </div>
      <div class="modal-hero-overlay" style="z-index:2;">
        <h2 style="
          font-family: var(--font-heading);
          font-style:italic;
          font-size: clamp(1.4rem, 3vw, 2rem);
          color:#fff;
          margin-bottom:1rem;
          line-height:1.1;
        ">${escapeHtml(job.role)}</h2>
        <div class="hero-buttons">
          <a class="btn-primary"
             href="${escapeHtml(job.redirectUrl)}"
             target="_blank"
             rel="noopener noreferrer">Apply Now ↗</a>
          <button class="btn-secondary" id="jp-save-modal">
            ${saved ? '✓ Shortlisted' : '+ Shortlist'}
          </button>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-left">
        <div class="match-score" style="margin-bottom:1.25rem; font-size:0.9rem;">
          ${job.matchScore}% Compatibility Score
        </div>
        <p style="color:rgba(255,255,255,0.75); line-height:1.75; font-size:0.92rem;">
          ${escapeHtml(job.description)}
        </p>
      </div>
      <div class="modal-right">
        <div class="modal-cast" style="gap:0.75rem;">
          <div><span>Company</span>${escapeHtml(job.company)}</div>
          <div><span>Location</span>${escapeHtml(loc)}</div>
          <div><span>Category</span>${escapeHtml(job.category)}</div>
          <div><span>Salary</span>${salary || 'Disclosed on request'}</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('jp-save-modal')?.addEventListener('click', () => {
    toggleSave(job);
    openPanel(id);
  });

  jobPanel?.classList.add('active');
  document.body.style.overflow = 'hidden';
  jpClose?.focus();
}

function closePanel() {
  jobPanel?.classList.remove('active');
  document.body.style.overflow = '';
}




searchInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    state.query = searchInput.value.trim();
    state.page  = 1;
    fetchBrowse(1);
  }
});


filterSort?.addEventListener('change', () => {
  state.sort = filterSort.value;
  state.page = 1;
  fetchBrowse(1);
});

filterSalary?.addEventListener('change', () => {
  state.salary = parseInt(filterSalary.value) || 0;
  state.page   = 1;
  fetchBrowse(1);
});


document.addEventListener('categorychange', e => {
  state.category = e.detail.category || 'all';
  state.page     = 1;
  renderBrowseResults();
});


jpClose?.addEventListener('click', closePanel);
jpBackdrop?.addEventListener('click', closePanel);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePanel();
});


document.getElementById('billboard-cta')?.addEventListener('click', () => {
  document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth' });
});


(function init() {
  console.log('[GetEmployed] Initialising…');


  renderSavedSection();


  fetchTrending()
    .then(() => fetchBrowse(1))
    .catch(err => {
      console.error('[Init]', err);
      if (cardsGrid) {
        cardsGrid.innerHTML = `
          <div class="error-msg" role="alert">
            <p>Failed to initialise. Please refresh the page.</p>
            <button onclick="location.reload()" class="btn-secondary" style="margin-top:1rem;">Refresh</button>
          </div>`;
      }
    });
})();
