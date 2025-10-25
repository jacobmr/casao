#!/usr/bin/env node
// Get a Guesty Booking Engine API token with local caching to avoid rate limits.
// Usage:
//   node scripts/get_token.js            # prints cached token if valid; fetches if needed
//   node scripts/get_token.js --no-fetch # prints cached token only; exits 1 if none/expired
//   node scripts/get_token.js --force    # fetches a new token even if cache valid (not recommended)

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const TOKEN_URL = process.env.GUESTY_OAUTH_TOKEN_URL || 'https://booking.guesty.com/oauth2/token';
const CLIENT_ID = process.env.GUESTY_CLIENT_ID;
const CLIENT_SECRET = process.env.GUESTY_CLIENT_SECRET;
const SCOPE = process.env.GUESTY_OAUTH_SCOPE || 'booking_engine:api';
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'guesty-token.json');

function readCache() {
  try {
    const j = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    return j;
  } catch { return null; }
}

function writeCache(token, expiresInSec) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const now = Math.floor(Date.now() / 1000);
  const data = { access_token: token, expires_at: now + (expiresInSec || 3600) };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  return data;
}

async function fetchToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('Missing GUESTY_CLIENT_ID/GUESTY_CLIENT_SECRET');
  const params = new URLSearchParams();
  params.set('grant_type', 'client_credentials');
  params.set('scope', SCOPE);
  params.set('client_id', CLIENT_ID);
  params.set('client_secret', CLIENT_SECRET);
  const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: params });
  const text = await res.text();
  if (!res.ok) throw new Error(`Token error ${res.status}: ${text.slice(0,200)}`);
  const json = JSON.parse(text);
  return writeCache(json.access_token, json.expires_in);
}

(async () => {
  const args = process.argv.slice(2);
  const noFetch = args.includes('--no-fetch');
  const force = args.includes('--force');
  const now = Math.floor(Date.now() / 1000);
  let cache = readCache();
  if (cache && cache.expires_at - 30 > now && !force) {
    process.stdout.write(cache.access_token);
    return;
  }
  if (noFetch) {
    console.error('No valid cached token and --no-fetch set.');
    process.exit(1);
  }
  cache = await fetchToken();
  process.stdout.write(cache.access_token);
})().catch(e => { console.error(e.message || e); process.exit(1); });

