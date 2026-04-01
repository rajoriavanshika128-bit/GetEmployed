'use strict';

const ADZUNA_APP_ID  = '3586e45f';
const ADZUNA_APP_KEY = '2bdf493f3272c77cc95b80ee76abcc7b';
const ADZUNA_BASE    = 'https://api.adzuna.com/v1/api/jobs/in/search/';

async function fetchJobs(what = 'developer', page = 1, sort = 'relevance') {
  const url = new URL(ADZUNA_BASE + page);
  url.searchParams.set('app_id',          ADZUNA_APP_ID);
  url.searchParams.set('app_key',         ADZUNA_APP_KEY);
  url.searchParams.set('results_per_page','20');
  url.searchParams.set('what',            what || 'developer');
  url.searchParams.set('content-type',    'application/json');
  url.searchParams.set('sort_by',         sort);

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`Adzuna API responded with ${res.status} – check your credentials.`);
  }

  return res.json();
}
