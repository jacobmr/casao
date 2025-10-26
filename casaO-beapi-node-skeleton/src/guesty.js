import axios from 'axios';
import fs from 'fs';
import path from 'path';

const OAUTH_URL = process.env.GUESTY_OAUTH_URL || 'https://booking.guesty.com/oauth2/token';
const API_BASE = process.env.GUESTY_API_BASE || 'https://booking.guesty.com/api';
const CLIENT_ID = process.env.GUESTY_CLIENT_ID;
const CLIENT_SECRET = process.env.GUESTY_CLIENT_SECRET;
const TOKEN_CACHE_FILE = process.env.TOKEN_CACHE_FILE || '.cache/token.json';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('⚠️  Missing GUESTY_CLIENT_ID or GUESTY_CLIENT_SECRET');
}

function readCache() {
  try {
    const raw = fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8');
    const j = JSON.parse(raw);
    if (j.access_token && j.exp > Math.floor(Date.now()/1000) + 300) return j;
  } catch {}
  return null;
}

function writeCache(j) {
  const dir = path.dirname(TOKEN_CACHE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(j, null, 2));
}

async function fetchToken() {
  const params = new URLSearchParams();
  params.set('grant_type', 'client_credentials');
  params.set('scope', 'booking_engine:api');
  params.set('client_id', CLIENT_ID);
  params.set('client_secret', CLIENT_SECRET);

  const r = await axios.post(OAUTH_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: s => s < 500 || s === 429
  });
  if (r.status === 429) {
    const wait = parseInt(r.headers['retry-after'] || '60', 10);
    throw new Error(`Rate limited on token endpoint. Retry after ${wait}s.`);
  }
  if (r.status >= 400) {
    throw new Error(`Token error ${r.status}: ${JSON.stringify(r.data)}`);
  }
  const now = Math.floor(Date.now()/1000);
  const j = { ...r.data, exp: now + (r.data.expires_in || 86400) };
  writeCache(j);
  return j;
}

async function getToken() {
  const cached = readCache();
  if (cached) return cached.access_token;
  const j = await fetchToken();
  return j.access_token;
}

const http = axios.create({
  baseURL: API_BASE,
  timeout: 20000
});

http.interceptors.request.use(async config => {
  const token = await getToken();
  config.headers = config.headers || {};
  config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(undefined, async error => {
  const original = error.config;
  const status = error.response?.status;
  // On 401 once, refresh token and retry
  if (status === 401 && !original.__retried) {
    original.__retried = true;
    try {
      await fetchToken(); // refresh
      const token = await getToken();
      original.headers['Authorization'] = `Bearer ${token}`;
      return http(original);
    } catch (e) {
      throw error;
    }
  }
  // On 429, honor Retry-After
  if (status === 429) {
    const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
    return http(original);
  }
  throw error;
});

export function beGet(path) {
  return http.get(path);
}

export function bePost(path, body) {
  return http.post(path, body);
}
