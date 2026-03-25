
'use strict';


const SAVED_KEY = 'getemployed_saved';

function loadSavedJobs() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); }
  catch { return []; }
}

let state = {
  query:     '',
  jobs:      [],       
  loading:   false,
  error:     null,
  category:  'all',
  salary:    'any',
  sort:      'relevance',
  view:      'grid',
  page:      1,
  perPage:   6,
  savedJobs: loadSavedJobs(),  
};


const searchInput    = document.getElementById('search-input');
const searchBtn      = document.getElementById('search-btn');
const filterCategory = document.getElementById('filter-category');
const filterSalary   = document.getElementById('filter-salary');
const filterSort     = document.getElementById('filter-sort');
const filterReset    = document.getElementById('filter-reset');
const resultsNum     = document.getElementById('results-num');
const skeletonGrid   = document.getElementById('skeleton-grid');
const cardsGrid      = document.getElementById('cards-grid');
const loadMoreWrap   = document.getElementById('load-more-wrap');
const loadMoreBtn    = document.getElementById('load-more-btn');
const viewGridBtn    = document.getElementById('view-grid');
const viewListBtn    = document.getElementById('view-list');
const savedCountEl   = document.getElementById('saved-count');
const savedNumEl     = document.getElementById('saved-num');
const savedPluralEl  = document.getElementById('saved-plural');
const topPicksList   = document.getElementById('top-picks-list');


const savedSectionGrid  = document.getElementById('saved-section-grid');
const savedSectionTotal = document.getElementById('saved-section-total');
const savedEmptyEl      = document.getElementById('saved-empty');


const jobPanel   = document.getElementById('job-panel');
const jpBackdrop = document.getElementById('jp-backdrop');
const jpClose    = document.getElementById('jp-close');
const jpBody     = document.getElementById('jp-body');



function isSaved(id) {
  return state.savedJobs.some(j => j.id === String(id));
}

function normalizeCategory(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('it')       || l.includes('tech')     || l.includes('software') ||
      l.includes('engineer') || l.includes('computing') || l.includes('developer') ||
      l.includes('data')     || l.includes('cyber'))                  return 'tech';
  if (l.includes('design')   || l.includes('art')       || l.includes('creative') ||
      l.includes('ux')       || l.includes('ui')        || l.includes('media'))   return 'design';
  if (l.includes('market')   || l.includes('sales')     || l.includes('pr') ||
      l.includes('advert')   || l.includes('content')   || l.includes('seo'))    return 'marketing';
  if (l.includes('financ')   || l.includes('account')   || l.includes('bank') ||
      l.includes('invest')   || l.includes('audit'))                  return 'finance';
  if (l.includes('health')   || l.includes('medical')   || l.includes('care') ||
      l.includes('nurs')     || l.includes('pharma')    || l.includes('clinical')) return 'healthcare';
  return 'other';
}

function computeDeadline(id) {
  const hash  = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const days  = (hash % 28) + 3;
  const urgency = days <= 7 ? 'urgent' : days <= 15 ? 'moderate' : 'safe';
  return { days, urgency };
}

function computeScore(job) {
  let score = 0;
  if (job.salaryMin > 0 || job.salaryMax > 0)             score += 30;
  if (job.categoryNorm === 'tech' || job.categoryNorm === 'design') score += 25;
  if ((job.description || '').length > 200)               score += 20;
  if (job.company)                                        score += 15;
  const d = (job.description || '').toLowerCase();
  if (d.includes('remote') || d.includes('hybrid'))       score += 10;
  return Math.min(score, 100);
}

function mapJob(raw, idx) {
  const categoryNorm = normalizeCategory(raw.category?.label || '');
  const deadline     = computeDeadline(raw.id || idx);
  const job = {
    id:          String(raw.id || idx),
    role:        raw.title                    || 'Untitled Role',
    company:     raw.company?.display_name    || '',
    location:    raw.location?.display_name   || 'Unknown',
    category:    raw.category?.label          || 'General',
    categoryNorm,
    salaryMin:   raw.salary_min               || 0,
    salaryMax:   raw.salary_max               || 0,
    description: raw.description              || '',
    redirectUrl: raw.redirect_url             || '#',
    deadline,
  };
  job.matchScore = computeScore(job);
  return job;
}

function formatSalaryRange(job) {
  if (job.salaryMin > 0 || job.salaryMax > 0) {
    const fmt = n => n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${n}`;
    if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
    return fmt(job.salaryMin || job.salaryMax);
  }
  return null;
}

function getInitials(company) {
  if (!company) return '??';
  return company.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function scoreColor(s) { return s >= 76 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#FF4655'; }


function toggleSave(job) {
  const idx = state.savedJobs.findIndex(j => j.id === job.id);
  if (idx === -1) {
    state.savedJobs.push(job);
  } else {
    state.savedJobs.splice(idx, 1);
  }
  localStorage.setItem(SAVED_KEY, JSON.stringify(state.savedJobs));
  updateSavedBadge();
  renderCards();
  renderSavedSection();
}

function updateSavedBadge() {
  const n = state.savedJobs.length;
  if (savedCountEl)  savedCountEl.textContent  = n;
  if (savedNumEl)    savedNumEl.textContent     = n;
  if (savedPluralEl) savedPluralEl.textContent  = n === 1 ? '' : 's';
}



function salaryFilter(job) {
  const thresholds = { any: 0, '20k': 20000, '40k': 40000, '60k': 60000, '80k': 80000 };
  const min = thresholds[state.salary] || 0;
  return min === 0 || (job.salaryMin >= min) || (job.salaryMax >= min);
}

function getFiltered() {
  const q = state.query.toLowerCase().trim();

  let list = state.jobs.filter(j => {
    
    const matchSearch = !q ||
      j.role.toLowerCase().includes(q)        ||
      j.company.toLowerCase().includes(q)     ||
      j.description.toLowerCase().includes(q);

   
    const matchCat = state.category === 'all' ||
      j.categoryNorm === state.category ||
      j.category.toLowerCase().includes(state.category.toLowerCase());

    
    const matchSal = salaryFilter(j);

    return matchSearch && matchCat && matchSal;
  });

  
  if (state.sort === 'relevance') {
    
    list.sort((a, b) => b.matchScore - a.matchScore);
  } else if (state.sort === 'salary-desc') {
    
    list.sort((a, b) => {
      const av = a.salaryMin || a.salaryMax || 0;
      const bv = b.salaryMin || b.salaryMax || 0;
      if (av === 0 && bv === 0) return 0;
      if (av === 0) return  1;
      if (bv === 0) return -1;
      return bv - av;
    });
  } else if (state.sort === 'az') {
    list.sort((a, b) => a.role.localeCompare(b.role));
  }

  return list;
}



function buildCard(job, opts = {}) {
  const { showRemove = false } = opts;
  const saved    = isSaved(job.id);
  const salary   = formatSalaryRange(job);
  const { days, urgency } = job.deadline;
  const score    = job.matchScore;
  const color    = scoreColor(score);
  const initials = getInitials(job.company);
  const dash     = score.toFixed(1);
  const gap      = (100 - score).toFixed(1);
  const urgencyClass = urgency === 'urgent'   ? 'az-deadline--urgent'   :
                       urgency === 'moderate' ? 'az-deadline--moderate' :
                                                'az-deadline--safe';

  const card = document.createElement('article');
  card.className = 'az-card';
  card.setAttribute('aria-label', `${job.role}${job.company ? ' at ' + job.company : ''}`);
  card.dataset.id = job.id;

  card.innerHTML = `
    <div class="az-header">
      <div class="az-logo" aria-hidden="true">${initials}</div>
      <div class="az-meta">
        <div class="az-title">${job.role}</div>
        <div class="az-company">${job.company || 'Unknown Company'} &middot; ${job.location}</div>
      </div>
      ${showRemove
        ? `<button class="az-save-btn saved" data-id="${job.id}"
              aria-label="Remove ${job.role} from saved" aria-pressed="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
           </button>`
        : `<button class="az-save-btn ${saved ? 'saved' : ''}" data-id="${job.id}"
              aria-label="${saved ? 'Unsave' : 'Save'} ${job.role}" aria-pressed="${saved}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="${saved ? 'currentColor' : 'none'}"
                stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
           </button>`
      }
    </div>

    <div class="az-badges">
      <span class="az-salary-badge ${salary ? 'has-salary' : 'negotiable'}"
            aria-label="Salary: ${salary || 'Negotiable'}">
        ${salary || 'NEGOTIABLE'}
      </span>
      <span class="az-cat-tag">${job.category.toUpperCase()}</span>
    </div>

    <p class="az-desc">${job.description || 'No description available for this listing.'}</p>

    <div class="az-footer">
      <span class="az-deadline ${urgencyClass}" aria-label="Closes in ${days} days">
        <span class="az-deadline-dot" aria-hidden="true"></span>
        Closes in ${days} day${days === 1 ? '' : 's'}
      </span>

      <div class="az-score-wrap" title="Match Score: ${score}/100"
           aria-label="Match score ${score} out of 100">
        <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
          <circle cx="18" cy="18" r="15.9" fill="none"
            stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
          <circle cx="18" cy="18" r="15.9" fill="none"
            stroke="${color}" stroke-width="3"
            stroke-dasharray="${dash} ${gap}" stroke-dashoffset="25" stroke-linecap="butt"/>
        </svg>
        <span class="az-score-val" style="color:${color}">${score}</span>
      </div>

      <div class="az-card-actions">
        <button class="az-view-btn" data-url="${job.redirectUrl}"
                aria-label="View ${job.role} on Adzuna">
          VIEW <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
  `;

  
  card.querySelector('.az-save-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleSave(job);
  });

  
  card.querySelector('.az-view-btn').addEventListener('click', e => {
    e.stopPropagation();
    if (job.redirectUrl && job.redirectUrl !== '#') {
      window.open(job.redirectUrl, '_blank', 'noopener,noreferrer');
    }
  });


  card.addEventListener('click', e => {
    if (e.target.closest('.az-save-btn') || e.target.closest('.az-view-btn')) return;
    openPanel(job.id);
  });

  return card;
}



function renderError(msg) {
  cardsGrid.innerHTML = `
    <div class="api-error-card">
      <div class="api-error-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
          fill="none" stroke="#FF4655" stroke-width="1.5" stroke-linecap="square">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="api-error-title">UNABLE TO LOAD JOBS</div>
      <p class="api-error-msg">${msg || 'Could not reach the Adzuna API. Check your credentials or network.'}</p>
      <button class="api-error-retry" id="api-retry-btn">&#8635; RETRY</button>
    </div>
  `;
  cardsGrid.querySelector('#api-retry-btn')?.addEventListener('click', () => fetchAndRender());
}



function renderCards() {
  const filtered = getFiltered();
  const total    = state.jobs.length;
  const toShow   = filtered.slice(0, state.page * state.perPage);

  if (resultsNum) {
    resultsNum.textContent = (filtered.length === total || total === 0)
      ? String(filtered.length)
      : `${filtered.length} of ${total}`;
  }

  cardsGrid.innerHTML = '';

  if (filtered.length === 0 && !state.loading && !state.error) {
    cardsGrid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon az-red-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
            fill="none" stroke="#FF4655" stroke-width="1.5" stroke-linecap="square">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
        <div class="no-results-title">NO RESULTS FOUND</div>
        <p class="no-results-text">Try adjusting your filters or searching a different keyword.</p>
      </div>`;
    loadMoreWrap.hidden = true;
    return;
  }

  toShow.forEach(job => cardsGrid.appendChild(buildCard(job)));
  loadMoreWrap.hidden = toShow.length >= filtered.length;
  applyView();
}

function applyView() {
  cardsGrid.classList.toggle('list-view', state.view === 'list');
}



function renderTopPicks() {
  if (!topPicksList || state.jobs.length === 0) return;

  const top3 = [...state.jobs]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  topPicksList.innerHTML = top3.map((job, i) => `
    <li class="top-pick-item tp-animate" style="animation-delay:${0.05 + i * 0.09}s"
        data-id="${job.id}" role="button" tabindex="0"
        aria-label="View ${job.role} at ${job.company}">
      <span class="pick-dot" aria-hidden="true"></span>
      <div class="pick-info">
        <span class="pick-role">${job.role}</span>
        <span class="pick-company">${job.company || 'Unknown'}</span>
      </div>
      <span class="pick-score-badge"
            style="color:${scoreColor(job.matchScore)};border-color:${scoreColor(job.matchScore)}"
            title="Match score: ${job.matchScore}/100">${job.matchScore}</span>
      <a href="${job.redirectUrl}" target="_blank" rel="noopener noreferrer" class="pick-view-link" tabindex="-1">VIEW &rarr;</a>
    </li>
  `).join('');


  topPicksList.querySelectorAll('.tp-animate').forEach(li => {
    const handler = () => openPanel(li.dataset.id);
    li.addEventListener('click', handler);
    li.addEventListener('keydown', e => { if (e.key === 'Enter') handler(); });
  });
}



async function fetchAndRender(what = 'developer') {
  state.loading = true;
  state.error   = null;
  state.page    = 1;

  skeletonGrid.hidden = false;
  skeletonGrid.setAttribute('aria-busy', 'true');
  cardsGrid.hidden    = true;
  cardsGrid.innerHTML = '';
  loadMoreWrap.hidden = true;

  try {
    const data    = await fetchJobs(what);
    console.log('[GetEmployed] Fetched Adzuna data:', data);
    state.jobs    = (data.results || []).map((raw, idx) => mapJob(raw, idx));
    state.loading = false;

    skeletonGrid.hidden = true;
    skeletonGrid.removeAttribute('aria-busy');
    cardsGrid.hidden = false;

    renderCards();
    renderTopPicks();
    renderSavedSection();
  } catch (err) {
    console.error('[GetEmployed] Adzuna API error:', err);
    state.loading = false;
    state.error   = err.message;

    skeletonGrid.hidden = true;
    skeletonGrid.removeAttribute('aria-busy');
    cardsGrid.hidden = false;

    renderError(err.message);
    if (resultsNum) resultsNum.textContent = '0';
  }
}



function renderSavedSection() {
  if (!savedSectionGrid) return;

  const n = state.savedJobs.length;

  if (savedSectionTotal) {
    savedSectionTotal.textContent = n === 0
      ? 'No jobs saved'
      : `${n} job${n === 1 ? '' : 's'} saved`;
  }
  if (savedEmptyEl) savedEmptyEl.hidden = n > 0;

  savedSectionGrid.innerHTML = '';

  state.savedJobs.forEach(job => savedSectionGrid.appendChild(buildCard(job, { showRemove: true })));
}


function openPanel(id) {
  const strId = String(id);

  const job = state.jobs.find(j => j.id === strId) ||
              state.savedJobs.find(j => j.id === strId);
  if (!job || !jobPanel || !jpBody) return;

  const saved  = isSaved(strId);
  const salary = formatSalaryRange(job);

  jpBody.innerHTML = `
    <div class="jp-logo-row">
      <div class="jp-logo-box" aria-hidden="true">${getInitials(job.company)}</div>
      <div>
        <div class="jp-role">${job.role}</div>
        <div class="jp-company">${job.company || 'Unknown Company'}</div>
      </div>
    </div>

    <div class="jp-tags">
      <span class="jp-tag tag-accent">${job.category.toUpperCase()}</span>
      <span class="jp-tag">${job.location}</span>
      ${salary ? `<span class="jp-tag">${salary}</span>` : ''}
    </div>

    <div class="jp-salary-box">
      <div>
        <div class="jp-salary-val">${salary || 'Negotiable'}</div>
        <div class="jp-salary-label">Estimated compensation</div>
      </div>
    </div>

    <div class="jp-section-title">About the Role</div>
    <p class="jp-desc">${job.description || 'No description available.'}</p>

    <div class="jp-actions">
      <a class="jp-apply-btn" href="${job.redirectUrl}" target="_blank"
         rel="noopener noreferrer" id="jp-apply-btn"
         aria-label="Apply for ${job.role}${job.company ? ' at ' + job.company : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        APPLY NOW
      </a>
      <button class="jp-save-btn ${saved ? 'saved' : ''}" id="jp-save-btn"
        aria-label="${saved ? 'Unsave' : 'Save'} this job" data-id="${strId}">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="${saved ? 'currentColor' : 'none'}"
          stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        ${saved ? 'SAVED' : 'SAVE'}
      </button>
    </div>
  `;


  jpBody.querySelector('#jp-save-btn').addEventListener('click', () => {
    toggleSave(job);
    const btn      = jpBody.querySelector('#jp-save-btn');
    const nowSaved = isSaved(strId);
    btn.classList.toggle('saved', nowSaved);
    btn.setAttribute('aria-label', (nowSaved ? 'Unsave' : 'Save') + ' this job');
    btn.querySelector('svg').setAttribute('fill', nowSaved ? 'currentColor' : 'none');
    btn.lastChild.textContent = ' ' + (nowSaved ? 'SAVED' : 'SAVE');
  });

  jobPanel.hidden = false;
  document.body.style.overflow = 'hidden';
  jobPanel.focus?.();
}

function closePanel() {
  if (!jobPanel) return;
  jobPanel.hidden = true;
  document.body.style.overflow = '';
}


let _searchTimer = null;

function applySearch() {
  state.query = searchInput.value.trim();
  state.page  = 1;
  renderCards();
}

function debounceSearch() {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(applySearch, 300);
}


searchInput.addEventListener('input', debounceSearch);
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { 
    clearTimeout(_searchTimer); 
    fetchAndRender(searchInput.value.trim() || 'developer'); 
  }
});
searchBtn.addEventListener('click', () => {
  clearTimeout(_searchTimer); 
  fetchAndRender(searchInput.value.trim() || 'developer');
});


filterCategory.addEventListener('change', () => {
  state.category = filterCategory.value; state.page = 1; renderCards();
});
filterSalary.addEventListener('change', () => {
  state.salary = filterSalary.value; state.page = 1; renderCards();
});
filterSort.addEventListener('change', () => {
  state.sort = filterSort.value; state.page = 1; renderCards();
});


filterReset.addEventListener('click', () => {
  state.query    = '';
  state.category = 'all';
  state.salary   = 'any';
  state.sort     = 'relevance';
  state.page     = 1;
  searchInput.value    = '';
  filterCategory.value = 'all';
  filterSalary.value   = 'any';
  filterSort.value     = 'relevance';
  fetchAndRender('developer');
});


loadMoreBtn.addEventListener('click', () => {
  state.page++;
  renderCards();
  const allCards = cardsGrid.querySelectorAll('.az-card');
  const firstNew = allCards[(state.page - 1) * state.perPage];
  if (firstNew) firstNew.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});


viewGridBtn.addEventListener('click', () => {
  state.view = 'grid';
  viewGridBtn.classList.add('active');
  viewListBtn.classList.remove('active');
  applyView();
});
viewListBtn.addEventListener('click', () => {
  state.view = 'list';
  viewListBtn.classList.add('active');
  viewGridBtn.classList.remove('active');
  applyView();
});

const filterMobBtn = document.getElementById('filter-mob-btn');
const filterBar    = document.getElementById('filter-bar');
if (filterMobBtn && filterBar) {
  filterMobBtn.addEventListener('click', () => {
    const isOpen = filterBar.classList.toggle('open');
    filterMobBtn.setAttribute('aria-expanded', isOpen);
  });
}


if (jpClose)    jpClose.addEventListener('click', closePanel);
if (jpBackdrop) jpBackdrop.addEventListener('click', closePanel);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !jobPanel?.hidden) closePanel();
});


(function init() {
  updateSavedBadge();
  renderSavedSection();
  fetchAndRender('developer');
})();
