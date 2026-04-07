'use strict';

const SAVED_KEY = 'getemployed_saved';

function loadSavedJobs() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); }
  catch { return []; }
}

let state = {
  query:        '',
  trendingJobs: [],
  browseJobs:   [],
  loading:      false,
  error:        null,
  category:     'all',
  salary:       'any',
  sort:         'relevance',
  page:         1,
  totalPages:   1,
  savedJobs:    loadSavedJobs(),
};

const searchInput    = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const filterSalary   = document.getElementById('filter-salary');
const filterSort     = document.getElementById('filter-sort');
const cardsGrid      = document.getElementById('cards-grid');
const pagWrap        = document.getElementById('pagination-wrap');
const pagButtons     = document.getElementById('pagination-buttons');
const topPicksList   = document.getElementById('top-picks-list');
const savedSectionGrid = document.getElementById('saved-section-grid');
const savedEmptyEl   = document.getElementById('saved-empty');
const jobPanel       = document.getElementById('job-panel');
const jpBackdrop     = document.getElementById('jp-backdrop');
const jpClose        = document.getElementById('jp-close');
const jpBody         = document.getElementById('jp-body');

function isSaved(id) {
  return state.savedJobs.some(j => j.id === String(id));
}

function normalizeCategory(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('it') || l.includes('tech') || l.includes('software')) return 'tech';
  if (l.includes('design') || l.includes('creative')) return 'design';
  if (l.includes('market') || l.includes('sales')) return 'marketing';
  if (l.includes('financ') || l.includes('bank')) return 'finance';
  if (l.includes('health') || l.includes('care')) return 'healthcare';
  return 'other';
}

function computeScore(job) {
  let score = 50;
  if (job.salaryMin > 0) score += 15;
  if (job.description.length > 300) score += 20;
  if (job.company) score += 15;
  return Math.min(score, 100);
}

function mapJob(raw, idx) {
  const categoryNorm = normalizeCategory(raw.category?.label || '');
  const job = {
    id:          String(raw.id || idx),
    role:        raw.title                    || 'Untitled Role',
    company:     raw.company?.display_name    || 'Organization',
    location:    raw.location?.display_name   || 'Remote / Global',
    category:    raw.category?.label          || 'General',
    categoryNorm,
    salaryMin:   raw.salary_min               || 0,
    salaryMax:   raw.salary_max               || 0,
    description: raw.description              || 'Detailed role description available upon application.',
    redirectUrl: raw.redirect_url             || '#',
    created:     raw.created                  || new Date().toISOString(),
  };
  job.matchScore = computeScore(job);
  return job;
}

function formatSalary(job) {
  if (job.salaryMin > 0) {
    const fmt = n => n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${n}`;
    if (job.salaryMax > job.salaryMin) return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
    return fmt(job.salaryMin);
  }
  return null;
}

function toggleSave(job) {
  const idx = state.savedJobs.findIndex(j => j.id === job.id);
  if (idx === -1) state.savedJobs.push(job);
  else state.savedJobs.splice(idx, 1);
  localStorage.setItem(SAVED_KEY, JSON.stringify(state.savedJobs));
  updateSavedUI();
}

function updateSavedUI() {
  const n = state.savedJobs.length;
  const countEl = document.getElementById('saved-count');
  if (countEl) countEl.textContent = n;
  renderBrowseResults();
  renderTrending();
  renderSavedSection();
}

function buildCard(job, opts = {}) {
  const { topIndex = null } = opts;
  const saved = isSaved(job.id);
  const salary = formatSalary(job);
  const card = document.createElement('article');
  card.className = 'job-card';
  card.dataset.id = job.id;
  
  const images = [
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600'
  ];
  const thumb = images[Math.abs(job.id.length) % images.length];

  card.innerHTML = `
    ${topIndex !== null ? `<div class="top10-number">${topIndex + 1}</div>` : ''}
    <div class="card-media">
      <img src="${thumb}" alt="${job.role}">
    </div>
    <div class="card-overlay">
      <div class="card-actions">
        <button class="action-icon fill az-view-btn">▶</button>
        <button class="action-icon az-save-btn ${saved ? 'saved' : ''}">${saved ? '✓' : '+'}</button>
        <button class="action-icon right az-detail-btn">▼</button>
      </div>
      <div class="card-title">${job.role}</div>
      <div class="card-meta">
        <span class="match-score">${job.matchScore}% Match</span>
        <span>${job.company}</span>
      </div>
      <div class="card-tags">
        <span class="tag-pill">${job.category.toUpperCase()}</span>
        ${salary ? `<span class="tag-pill">${salary}</span>` : ''}
      </div>
    </div>
  `;

  card.querySelector('.az-save-btn').addEventListener('click', e => { e.stopPropagation(); toggleSave(job); });
  card.querySelector('.az-view-btn').addEventListener('click', e => { e.stopPropagation(); window.open(job.redirectUrl, '_blank'); });
  card.addEventListener('click', () => openPanel(job.id));
  return card;
}

function renderBrowseResults() {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';
  state.browseJobs.forEach(job => cardsGrid.appendChild(buildCard(job)));
  renderPagination();
}

function renderTrending() {
  if (!topPicksList || state.trendingJobs.length === 0) return;
  topPicksList.innerHTML = '';
  state.trendingJobs.forEach((job, i) => topPicksList.appendChild(buildCard(job, { topIndex: i })));
}

function renderPagination() {
  if (!pagButtons) return;
  pagButtons.innerHTML = '';
  const max = state.totalPages;
  const cur = state.page;
  if (max <= 1) { pagWrap.hidden = true; return; }
  pagWrap.hidden = false;

  const addBtn = (p, label, active = false, disabled = false) => {
    const btn = document.createElement('button');
    btn.className = `page-btn ${active ? 'active' : ''}`;
    btn.textContent = label || p;
    btn.disabled = disabled;
    if (!disabled && !active) {
      btn.onclick = () => {
        state.page = p;
        fetchBrowse(p);
        window.scrollTo({ top: document.getElementById('opportunities').offsetTop - 100, behavior: 'smooth' });
      };
    }
    pagButtons.appendChild(btn);
  };

  addBtn(cur - 1, '❮ Prev', false, cur === 1);
  let start = Math.max(1, cur - 2);
  let end = Math.min(max, cur + 2);
  if (start > 1) {
    addBtn(1);
    if (start > 2) {
      const span = document.createElement('span');
      span.textContent = '...';
      span.className = 'pag-dots';
      pagButtons.appendChild(span);
    }
  }
  for (let i = start; i <= end; i++) addBtn(i, i, i === cur);
  if (end < max) {
    if (end < max - 1) {
      const span = document.createElement('span');
      span.textContent = '...';
      span.className = 'pag-dots';
      pagButtons.appendChild(span);
    }
    addBtn(max);
  }
  addBtn(cur + 1, 'Next ❯', false, cur === max);
}

async function fetchTrending() {
  try {
    console.log('[fetchTrending] Starting fetch...');
    const data = await fetchJobs('internship', 1, 'relevance');
    state.trendingJobs = (data.results || []).map((raw, idx) => mapJob(raw, idx)).slice(0, 10);
    console.log('[fetchTrending] Success:', state.trendingJobs.length, 'trending jobs loaded');
    renderTrending();
  } catch (err) {
    console.error('[fetchTrending] Error:', err);
    state.error = err.message;
    // Gracefully handle trending fetch failure - show empty state but continue
    if (topPicksList) {
      topPicksList.innerHTML = `
        <div style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 2rem;
          color: var(--muted);
        ">
          Trending opportunities temporarily unavailable
        </div>
      `;
    }
  }
}

/**
 * Render skeleton loaders for cards
 * Creates a visual placeholder while loading
 */
function renderSkeletons() {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton-line long"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
    `;
    cardsGrid.appendChild(skeleton);
  }
}

/**
 * Fetch jobs with comprehensive loading state management
 * - Shows skeleton loaders during fetch
 * - Implements error recovery with user-friendly messages
 * - Updates UI with loading indicators
 * - Handles network errors gracefully
 */
async function fetchBrowse(page = 1) {
  state.loading = true;
  state.page = page;
  state.error = null;

  // Show skeleton loaders immediately
  renderSkeletons();

  try {
    console.log('[fetchBrowse] Fetching page', page, 'with query:', state.query || 'graduate');
    
    const data = await fetchJobs(state.query || 'graduate', state.page, state.sort);
    const rawResults = data.results || [];
    const trendingIds = new Set(state.trendingJobs.map(j => j.id));
    
    state.browseJobs = rawResults
      .map((raw, idx) => mapJob(raw, idx + (page * 20)))
      .filter(job => !trendingIds.has(job.id));

    state.totalPages = Math.min(Math.ceil((data.count || 0) / 20), 50);
    state.loading = false;
    state.error = null;
    
    console.log('[fetchBrowse] Success:', state.browseJobs.length, 'jobs loaded');
    renderBrowseResults();
    
  } catch (err) {
    state.loading = false;
    state.error = err.message;
    
    console.error('[fetchBrowse] Error:', err);
    
    // Display user-friendly error message
    const errorMsg = err.message || 'Unable to load opportunities. Please try again.';
    cardsGrid.innerHTML = `
      <div class="error-msg">
        ${errorMsg}
        <button onclick="location.reload()" style="
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: var(--accent-start);
          color: white;
          border: none;
          border-radius: var(--radius-pill);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          Try Again
        </button>
      </div>
    `;
  }
}

function renderSavedSection() {
  if (!savedSectionGrid) return;
  const n = state.savedJobs.length;
  savedEmptyEl.hidden = n > 0;
  savedSectionGrid.innerHTML = '';
  state.savedJobs.forEach(job => savedSectionGrid.appendChild(buildCard(job)));
}

function openPanel(id) {
  const sid = String(id);
  const job = [...state.browseJobs, ...state.trendingJobs, ...state.savedJobs].find(j => j.id === sid);
  if (!job) return;
  const saved = isSaved(job.id);
  const salary = formatSalary(job);
  jpBody.innerHTML = `
    <div class="modal-hero">
      <img class="modal-hero-img" src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200" alt="${job.role}">
      <div class="modal-hero-overlay">
        <h2 class="hero-title" style="font-size: 3rem;">${job.role}</h2>
        <div class="hero-buttons">
          <button class="btn-primary" onclick="window.open('${job.redirectUrl}', '_blank')">Apply Now</button>
          <button class="btn-secondary" id="jp-save-modal">${saved ? 'Shortlisted' : 'Shortlist'}</button>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-left">
        <div class="card-meta" style="font-size: 1.1rem; margin-bottom: 1.5rem;">
          <span class="match-score">${job.matchScore}% Compatibility</span>
          <span>Verified Partner</span>
        </div>
        <p class="hero-desc" style="max-width: 100%; color: var(--text);">${job.description}</p>
      </div>
      <div class="modal-right">
        <div class="modal-cast"><span>Organization:</span> ${job.company}</div>
        <div class="modal-cast"><span>Geography:</span> ${job.location}</div>
        <div class="modal-cast"><span>Expertise:</span> ${job.category}</div>
        <div class="modal-cast"><span>Package:</span> ${salary || 'Disclosed on Request'}</div>
      </div>
    </div>
  `;
  document.getElementById('jp-save-modal').addEventListener('click', () => { toggleSave(job); openPanel(id); });
  jobPanel.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePanel() {
  jobPanel.classList.remove('active');
  document.body.style.overflow = '';
}

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    state.query = searchInput.value;
    state.page = 1;
    fetchBrowse(1);
  }
});

filterSort.addEventListener('change', () => {
  state.sort = filterSort.value;
  state.page = 1;
  fetchBrowse(1);
});

filterSalary.addEventListener('change', () => {
  state.salary = filterSalary.value;
  state.page = 1;
  fetchBrowse(1);
});

if (jpClose) jpClose.addEventListener('click', closePanel);
if (jpBackdrop) jpBackdrop.addEventListener('click', closePanel);

(function init() {
  console.log('[APP] Initializing GetEmployed...');
  updateSavedUI();
  
  // Load trending data first (non-blocking)
  fetchTrending()
    .then(() => {
      console.log('[APP] Trending loaded, fetching browse results...');
      // Then fetch main browse results
      return fetchBrowse(1);
    })
    .catch(err => {
      console.error('[APP] Initialization error:', err);
      if (cardsGrid) {
        cardsGrid.innerHTML = `
          <div class="error-msg">
            Failed to initialize application. Please refresh the page.
          </div>
        `;
      }
    });
})();
