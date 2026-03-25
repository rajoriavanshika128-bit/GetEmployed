
'use strict';

const ADZUNA_APP_ID  = '3586e45f';
const ADZUNA_APP_KEY = '2bdf493f3272c77cc95b80ee76abcc7b';
const ADZUNA_BASE    = 'https://api.adzuna.com/v1/api/jobs/in/search/1';

/**
 * Fetch jobs from Adzuna API.
 * @param {string} what  - Job title / keyword (e.g. "developer", "designer")
 * @returns {Promise<Object>} Raw API JSON response
 */
async function fetchJobs(what = 'developer') {
  const url = new URL(ADZUNA_BASE);
  url.searchParams.set('app_id',          ADZUNA_APP_ID);
  url.searchParams.set('app_key',         ADZUNA_APP_KEY);
  url.searchParams.set('results_per_page','20');
  url.searchParams.set('what',            what || 'developer');
  url.searchParams.set('content-type',    'application/json');

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`Adzuna API responded with ${res.status} – check your APP_ID and APP_KEY.`);
  }

  return res.json();
}
