'use strict';


const SAVED_KEY = 'getemployed_saved';

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
const savedEmptyEl     = document.getElementById('saved-empty');
const jobPanel         = document.getElementById('job-panel');
const jpBackdrop       = document.getElementById('jp-backdrop');
const jpClose          = document.getElementById('jp-close');
const jpBody           = document.getElementById('jp-body');


function isSaved(id) {
  return state.savedJobs.some(j => j.id === String(id));
}


function normalizeCategory(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('it') || l.includes('tech') || l.includes('software') || l.includes('engineer')) return 'tech';
  if (l.includes('design') || l.includes('creative') || l.includes('art')) return 'design';
  if (l.includes('market') || l.includes('sales') || l.includes('growth')) return 'marketing';
  if (l.includes('financ') || l.includes('bank') || l.includes('account')) return 'finance';
  if (l.includes('health') || l.includes('care') || l.includes('pharma') || l.includes('science')) return 'healthcare';
  return 'other';
}


function computeScore(job) {
  let score = 50;
  if (job.salaryMin > 0)          score += 15;
  if (job.description.length > 300) score += 20;
  if (job.company !== 'Organization') score += 15;
  return Math.min(score, 100);
}


function mapJob(raw, idx) {
  const categoryNorm = normalizeCategory(raw.category?.label || '');
  const job = {
    id:          String(raw.id || idx),
    role:        raw.title                 || 'Untitled Role',
    company:     raw.company?.display_name || 'Organization',
    location:    raw.location?.display_name || 'Remote / Global',
    category:    raw.category?.label       || 'General',
    categoryNorm,
    salaryMin:   raw.salary_min            || 0,
    salaryMax:   raw.salary_max            || 0,
    description: raw.description           || 'Detailed role description available upon application.',
    redirectUrl: raw.redirect_url          || '#',
    created:     raw.created               || new Date().toISOString(),
  };
  job.matchScore = computeScore(job);
  return job;
}


function formatSalary(job) {
  if (job.salaryMin > 0) {
    const fmt = n => n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${n}`;
    return job.salaryMax > job.salaryMin
      ? `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`
      : fmt(job.salaryMin);
  }
  return null;
}

function toggleSave(job) {
  const idx = state.savedJobs.findIndex(j => j.id === job.id);
  if (idx === -1) state.savedJobs.push(job);
  else            state.savedJobs.splice(idx, 1);
  localStorage.setItem(SAVED_KEY, JSON.stringify(state.savedJobs));
  refreshAllUI();
}

const THUMB_IMAGES = [
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600',
];

function buildCard(job, opts = {}) {
  const { topIndex = null } = opts;
  const saved  = isSaved(job.id);
  const salary = formatSalary(job);


  const thumbIdx = Math.abs([...job.id].reduce((s, c) => s + c.charCodeAt(0), 0)) % THUMB_IMAGES.length;
  const thumb    = THUMB_IMAGES[thumbIdx];

  const card = document.createElement('article');
  card.className    = 'job-card';
  card.dataset.id   = job.id;

  card.innerHTML = `
    ${topIndex !== null ? `<div class="top10-number">${topIndex + 1}</div>` : ''}
    <div class="card-media">
      <img src="${thumb}" alt="${escapeHtml(job.role)}" loading="lazy">
    </div>
    <div class="card-overlay">
      <div class="card-actions">
        <button class="action-icon fill az-view-btn"   aria-label="Apply for ${escapeHtml(job.role)}">▶️</button>
        <button class="action-icon az-save-btn ${saved ? 'saved' : ''}" aria-label="${saved ? 'Remove from shortlist' : 'Add to shortlist'}">${saved ? '✓' : '+'}</button>
        <button class="action-icon right az-detail-btn" aria-label="View details">▼</button>
      </div>
      <div class="card-title">${escapeHtml(job.role)}</div>
      <div class="card-meta">
        <span class="match-score">${job.matchScore}% Match</span>
        <span>${escapeHtml(job.company)}</span>
      </div>
      <div class="card-tags">
        <span class="tag-pill">${escapeHtml(job.category.toUpperCase())}</span>
        ${salary ? `<span class="tag-pill">${salary}</span>` : ''}
      </div>
    </div>
  `;

  card.querySelector('.az-save-btn').addEventListener('click', e => { e.stopPropagation(); toggleSave(job); });
  card.querySelector('.az-view-btn').addEventListener('click', e => { e.stopPropagation(); window.open(job.redirectUrl, '_blank', 'noopener'); });
  card.querySelector('.az-detail-btn').addEventListener('click', e => { e.stopPropagation(); openPanel(job.id); });
  card.addEventListener('click', () => openPanel(job.id));
  return card;
}


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


function getFilteredBrowseJobs() {
  let jobs = state.browseJobs;

 
  if (state.category && state.category !== 'all') {
    jobs = jobs.filter(j => j.categoryNorm === state.category);
  }

 
  if (state.salary > 0) {
    jobs = jobs.filter(j => j.salaryMin >= state.salary || j.salaryMax >= state.salary);
  }

  return jobs;
}

function renderSkeletons() {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = Array(8).fill(`
    <div class="skeleton-card">
      <div class="skeleton-line long"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
    </div>
  `).join('');
}

function renderBrowseResults() {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';

  const jobs = getFilteredBrowseJobs();

  if (jobs.length === 0 && !state.loading) {
    cardsGrid.innerHTML = `
      <div class="empty-state">
        <p>No roles found for the selected filters.</p>
        <button class="btn-secondary" id="clear-filters-btn" style="margin-top:1rem;">Clear Filters</button>
      </div>
    `;
    document.getElementById('clear-filters-btn')?.addEventListener('click', resetFilters);
    renderPagination(0);
    return;
  }

  jobs.forEach(job => cardsGrid.appendChild(buildCard(job)));
  renderPagination(jobs.length);
}

function renderTrending() {
  if (!topPicksList) return;

  if (state.trendingJobs.length === 0) {
    topPicksList.innerHTML = `
      <li style="padding:2rem; color:var(--muted); text-align:center; list-style:none;">
        Trending opportunities temporarily unavailable.
      </li>`;
    return;
  }

  topPicksList.innerHTML = '';
  state.trendingJobs.forEach((job, i) => {
    const li = document.createElement('li');
    li.appendChild(buildCard(job, { topIndex: i }));
    topPicksList.appendChild(li);
  });
}

function renderSavedSection() {
  if (!savedSectionGrid) return;


  savedSectionGrid.innerHTML = '';

  if (state.savedJobs.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className  = 'saved-empty';
    emptyMsg.id         = 'saved-empty';
    emptyMsg.textContent = 'No roles shortlisted yet. Explore opportunities to build your list.';
    savedSectionGrid.appendChild(emptyMsg);
    return;
  }

  state.savedJobs.forEach(job => savedSectionGrid.appendChild(buildCard(job)));
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

  const addBtn = (p, label, isActive = false, isDisabled = false) => {
    const btn       = document.createElement('button');
    btn.className   = `page-btn${isActive ? ' active' : ''}`;
    btn.textContent = label;
    btn.disabled    = isDisabled;
    if (!isDisabled && !isActive) {
      btn.addEventListener('click', () => {
        state.page = p;
        fetchBrowse(p);
        document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    pagButtons.appendChild(btn);
  };

  const addDots = () => {
    const span       = document.createElement('span');
    span.className   = 'pag-dots';
    span.textContent = '…';
    pagButtons.appendChild(span);
  };

  addBtn(cur - 1, '❮', false, cur === 1);

  let start = Math.max(1, cur - 2);
  let end   = Math.min(max, cur + 2);

  if (start > 1) { addBtn(1, '1'); if (start > 2) addDots(); }
  for (let i = start; i <= end; i++) addBtn(i, String(i), i === cur);
  if (end < max)  { if (end < max - 1) addDots(); addBtn(max, String(max)); }

  addBtn(cur + 1, '❯', false, cur === max);
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
    t.classList.toggle('active', t.dataset.cat === 'all');
  });

  fetchBrowse(1);
}


async function fetchTrending() {
  try {
    const data = await fetchJobs('internship', 1, 'relevance', 0);
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

    if (cardsGrid) {
      cardsGrid.innerHTML = `
        <div class="error-msg">
          <p>${escapeHtml(err.message || 'Unable to load opportunities. Please try again.')}</p>
          <button onclick="location.reload()" style="
            margin-top:1rem; padding:0.75rem 1.5rem;
            background:var(--accent-start); color:#fff;
            border:none; border-radius:var(--radius-pill);
            cursor:pointer; font-weight:500;">
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
  if (!job) return;

  const saved  = isSaved(job.id);
  const salary = formatSalary(job);

  jpBody.innerHTML = `
    <div class="modal-hero">
      <img class="modal-hero-img"
           src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200"
           alt="${escapeHtml(job.role)}">
      <div class="modal-hero-overlay">
        <h2 class="hero-title" style="font-size:2.4rem;">${escapeHtml(job.role)}</h2>
        <div class="hero-buttons">
          <a class="btn-primary"
             href="${job.redirectUrl}"
             target="_blank"
             rel="noopener noreferrer">Apply Now</a>
          <button class="btn-secondary" id="jp-save-modal">
            ${saved ? 'Shortlisted ✓' : 'Shortlist +'}
          </button>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-left">
        <div class="card-meta" style="font-size:1rem; margin-bottom:1.5rem;">
          <span class="match-score">${job.matchScore}% Compatibility</span>
        </div>
        <p style="color:var(--text); line-height:1.7;">${escapeHtml(job.description)}</p>
      </div>
      <div class="modal-right">
        <div class="modal-cast"><span>Organisation:</span> ${escapeHtml(job.company)}</div>
        <div class="modal-cast"><span>Location:</span>     ${escapeHtml(job.location)}</div>
        <div class="modal-cast"><span>Category:</span>     ${escapeHtml(job.category)}</div>
        <div class="modal-cast"><span>Salary:</span>       ${salary || 'Disclosed on Request'}</div>
      </div>
    </div>
  `;

  document.getElementById('jp-save-modal')?.addEventListener('click', () => {
    toggleSave(job);
    openPanel(id); 
  });

  jobPanel.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePanel() {
  jobPanel?.classList.remove('active');
  document.body.style.overflow = '';
}




searchInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    state.query  = searchInput.value.trim();
    state.page   = 1;
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


(function init() {
  console.log('[GetEmployed] Initialising...');

  renderSavedSection(); 

  fetchTrending()
    .then(() => fetchBrowse(1))
    .catch(err => {
      console.error('[Init]', err);
      if (cardsGrid) {
        cardsGrid.innerHTML = `
          <div class="error-msg">
            Failed to initialise. Please refresh the page.
          </div>`;
      }
    });
})();