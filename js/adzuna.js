'use strict';

/**
 * ========================================================================
 * ADZUNA JOB SEARCH API INTEGRATION
 * ========================================================================
 * 
 * This module provides real-time job data fetching from the Adzuna API.
 * It handles all HTTP requests, error management, and response parsing.
 * 
 * Features:
 * - ✅ Real-time API calls using Fetch API
 * - ✅ Comprehensive error handling with meaningful messages
 * - ✅ Request timeout protection
 * - ✅ Retry logic for failed requests
 * - ✅ Response caching (optional)
 * - ✅ Type-safe parameter validation
 * 
 * API Documentation: https://developer.adzuna.com/
 * ========================================================================
 */

// ========== API CONFIGURATION ==========
const ADZUNA_APP_ID  = '3586e45f';
const ADZUNA_APP_KEY = '2bdf493f3272c77cc95b80ee76abcc7b';
const ADZUNA_BASE    = 'https://api.adzuna.com/v1/api/jobs/in/search/';
const API_TIMEOUT    = 10000; // 10 seconds
const MAX_RETRIES    = 3;
const RETRY_DELAY    = 1000; // 1 second

// ========== CACHE CONFIGURATION ==========
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const requestCache = {};

/**
 * Generate cache key from request parameters
 * @param {string} what - Job search query
 * @param {number} page - Page number
 * @param {string} sort - Sort order
 * @returns {string} Cache key
 */
function getCacheKey(what, page, sort) {
  return `${what}_${page}_${sort}`;
}

/**
 * Check if cached data is still valid
 * @param {string} key - Cache key
 * @returns {boolean}
 */
function isCacheValid(key) {
  const cached = requestCache[key];
  if (!cached) return false;
  const now = Date.now();
  return (now - cached.timestamp) < CACHE_DURATION;
}

/**
 * Fetch data from cache
 * @param {string} key - Cache key
 * @returns {object|null}
 */
function getFromCache(key) {
  if (isCacheValid(key)) {
    console.log('[Cache Hit]', key);
    return requestCache[key].data;
  }
  return null;
}

/**
 * Store data in cache
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 */
function saveToCache(key, data) {
  requestCache[key] = {
    data: data,
    timestamp: Date.now()
  };
}

/**
 * Create a promise that rejects after a timeout
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise}
 */
function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
  );
}

/**
 * Retry a failed request with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Delay between retries
 * @returns {Promise}
 */
async function retryFetch(fn, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`[Retry ${i + 1}/${retries}] Failed:`, err.message);
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

/**
 * ========================================================================
 * MAIN FETCH FUNCTION
 * ========================================================================
 * 
 * Fetches job listings from Adzuna API with:
 * - Query parameter validation
 * - Request caching
 * - Automatic retry on failure
 * - Timeout protection
 * - Detailed error messages
 * 
 * @param {string} what - Job search query (e.g., 'developer', 'designer')
 * @param {number} page - Page number (1-indexed, max 50 pages per API)
 * @param {string} sort - Sort order ('relevance', 'salary-desc', 'date-desc')
 * @returns {Promise<object>} Parsed JSON response with results array
 * 
 * @throws {Error} On network failure, API error, or timeout
 * 
 * @example
 * try {
 *   const data = await fetchJobs('javascript developer', 1, 'relevance');
 *   console.log(`Found ${data.count} jobs`);
 *   console.log(data.results); // Array of job objects
 * } catch (error) {
 *   console.error('Failed to fetch jobs:', error.message);
 * }
 */
async function fetchJobs(what = 'developer', page = 1, sort = 'relevance') {
  // ===== INPUT VALIDATION =====
  what = String(what || 'developer').trim().substring(0, 100);
  page = Math.max(1, Math.min(parseInt(page) || 1, 50)); // Clamp between 1-50
  sort = ['relevance', 'salary-desc', 'date-desc', 'az'].includes(sort) ? sort : 'relevance';

  // ===== CHECK CACHE =====
  const cacheKey = getCacheKey(what, page, sort);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // ===== BUILD REQUEST URL =====
  const url = new URL(ADZUNA_BASE + page);
  url.searchParams.set('app_id',          ADZUNA_APP_ID);
  url.searchParams.set('app_key',         ADZUNA_APP_KEY);
  url.searchParams.set('results_per_page', '20');
  url.searchParams.set('what',            what);
  url.searchParams.set('content-type',    'application/json');
  url.searchParams.set('sort_by',         sort);

  console.log('[API Request]', { query: what, page, sort });

  // ===== FETCH WITH RETRY & TIMEOUT =====
  try {
    const response = await retryFetch(async () => {
      return Promise.race([
        fetch(url.toString()),
        timeout(API_TIMEOUT)
      ]);
    });

    // ===== HANDLE HTTP ERRORS =====
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const statusText = {
        400: 'Bad Request – Invalid search parameters',
        401: 'Unauthorized – Invalid API credentials',
        403: 'Forbidden – API rate limit exceeded',
        404: 'Not Found – Search endpoint unavailable',
        429: 'Too Many Requests – API rate limited. Please try again later',
        500: 'Server Error – Adzuna service temporarily unavailable',
        503: 'Service Unavailable – Maintenance in progress'
      }[response.status] || `HTTP ${response.status} Error`;

      throw new Error(`Adzuna API Error: ${statusText}`);
    }

    // ===== PARSE RESPONSE =====
    const data = await response.json();

    // ===== VALIDATE RESPONSE STRUCTURE =====
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid API response format – missing results array');
    }

    // ===== SAVE TO CACHE & RETURN =====
    saveToCache(cacheKey, data);
    console.log('[API Success]', { count: data.count, results: data.results.length });
    return data;

  } catch (error) {
    // ===== COMPREHENSIVE ERROR HANDLING =====
    let userMessage = 'Failed to fetch job listings. ';
    
    if (error.message.includes('timeout')) {
      userMessage += 'Request took too long. Please check your connection.';
    } else if (error.message.includes('Failed to fetch')) {
      userMessage += 'Network error. Please check your internet connection.';
    } else if (error.message.includes('JSON')) {
      userMessage += 'Received invalid data from the server.';
    } else {
      userMessage += error.message;
    }

    console.error('[API Error]', error);
    throw new Error(userMessage);
  }
}

/**
 * Clear the request cache
 * Useful for forcing a fresh fetch
 */
function clearCache() {
  Object.keys(requestCache).forEach(key => delete requestCache[key]);
  console.log('[Cache Cleared]');
}

/**
 * Get cache statistics
 * @returns {object} Cache info
 */
function getCacheStats() {
  return {
    entries: Object.keys(requestCache).length,
    totalSize: JSON.stringify(requestCache).length,
    keys: Object.keys(requestCache)
  };
}
