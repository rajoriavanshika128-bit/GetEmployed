'use strict';


const ADZUNA_APP_ID  = '3586e45f';
const ADZUNA_APP_KEY = '2bdf493f3272c77cc95b80ee76abcc7b';
const ADZUNA_BASE    = 'https://api.adzuna.com/v1/api/jobs/gb/search/';
const API_TIMEOUT    = 10000;
const MAX_RETRIES    = 2;
const RETRY_DELAY    = 1000;


const CACHE_DURATION = 5 * 60 * 1000;
const requestCache   = {};

function getCacheKey(what, page, sort, salaryMin) {
  return `${what}_${page}_${sort}_${salaryMin}`;
}

function isCacheValid(key) {
  const cached = requestCache[key];
  if (!cached) return false;
  return (Date.now() - cached.timestamp) < CACHE_DURATION;
}

function getFromCache(key) {
  if (isCacheValid(key)) return requestCache[key].data;
  return null;
}

function saveToCache(key, data) {
  requestCache[key] = { data, timestamp: Date.now() };
}

function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
  );
}

async function retryFetch(fn, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`[Retry ${i + 1}/${retries}]`, err.message);
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
}


function toAdzunaSort(sort) {
  switch (sort) {
    case 'salary-desc': return 'salary';
    case 'date-desc':   return 'date';
    case 'az':          return 'relevance'; 
    default:            return 'relevance';
  }
}

/**
 * Fetch job listings from Adzuna API.
 *
 @param {string} what      
 * @param {number} page      - Page number (1–50)
 * @param {string} sort      - 'relevance' | 'salary-desc' | 'date-desc' | 'az'
 * @param {number} salaryMin - Minimum salary filter (0 = any)
 * @returns {Promise<object>} Parsed response with .results array and .count
 */
async function fetchJobs(what = 'graduate', page = 1, sort = 'relevance', salaryMin = 0) {
  // Input validation
  what      = String(what || 'graduate').trim().substring(0, 100) || 'graduate';
  page      = Math.max(1, Math.min(parseInt(page) || 1, 50));
  sort      = ['relevance', 'salary-desc', 'date-desc', 'az'].includes(sort) ? sort : 'relevance';
  salaryMin = parseInt(salaryMin) || 0;

  const cacheKey = getCacheKey(what, page, sort, salaryMin);
  const cached   = getFromCache(cacheKey);
  if (cached) {
    console.log('[Cache Hit]', cacheKey);
    return cached;
  }

  const url = new URL(ADZUNA_BASE + page);
  url.searchParams.set('app_id',           ADZUNA_APP_ID);
  url.searchParams.set('app_key',          ADZUNA_APP_KEY);
  url.searchParams.set('results_per_page', '20');
  url.searchParams.set('what',             what);
  url.searchParams.set('content-type',     'application/json');
  url.searchParams.set('sort_by',          toAdzunaSort(sort));


  if (salaryMin > 0) {
    url.searchParams.set('salary_min', String(salaryMin));
  }

  console.log('[API Request]', { what, page, sort, salaryMin });

  try {
    const response = await retryFetch(async () =>
      Promise.race([fetch(url.toString()), timeout(API_TIMEOUT)])
    );

    if (!response.ok) {
      const statusMessages = {
        400: 'Bad Request – Invalid search parameters',
        401: 'Unauthorized – Invalid API credentials',
        403: 'Forbidden – API access denied',
        404: 'Not Found – Search endpoint unavailable',
        429: 'Too Many Requests – Please try again in a moment',
        500: 'Server Error – Adzuna service temporarily unavailable',
        503: 'Service Unavailable – Maintenance in progress',
      };
      const msg = statusMessages[response.status] || `HTTP ${response.status} Error`;
      throw new Error(`Adzuna API Error: ${msg}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.results)) {
      throw new Error('Invalid API response – missing results array');
    }


    if (sort === 'az') {
      data.results.sort((a, b) =>
        (a.title || '').localeCompare(b.title || '')
      );
    }

    saveToCache(cacheKey, data);
    console.log('[API Success]', { count: data.count, returned: data.results.length });
    return data;

  } catch (error) {
    let userMessage = 'Failed to fetch job listings. ';
    if (error.message.includes('timeout')) {
      userMessage += 'Request took too long – please check your connection.';
    } else if (error.message.includes('Failed to fetch')) {
      userMessage += 'Network error – please check your internet connection.';
    } else if (error.message.includes('JSON')) {
      userMessage += 'Received invalid data from the server.';
    } else {
      userMessage += error.message;
    }
    console.error('[API Error]', error);
    throw new Error(userMessage);
  }
}

function clearCache() {
  Object.keys(requestCache).forEach(k => delete requestCache[k]);
  console.log('[Cache Cleared]');
}