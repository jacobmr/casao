/**
 * Centralized Token Service
 * 
 * Manages Guesty OAuth tokens with file-based caching to prevent rate limits.
 * ALL code must use this service - never fetch tokens directly!
 * 
 * Token expires after 24 hours, but we cache it in .cache/guesty-token.json
 * This prevents hitting the rate limit (3 requests per 24 hours)
 */

import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'guesty-token.json');
const TOKEN_BUFFER_SECONDS = 60; // Refresh 60 seconds before expiry

// In-memory cache (for multiple requests in same process)
let memoryCache = {
  token: null,
  expiresAt: 0
};

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Read token from file cache
 */
function readFromFileCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }
    
    const data = fs.readFileSync(CACHE_FILE, 'utf8');
    const cache = JSON.parse(data);
    
    // Validate structure
    if (!cache.access_token || !cache.expires_at) {
      return null;
    }
    
    return cache;
  } catch (error) {
    console.warn('Failed to read token cache:', error.message);
    return null;
  }
}

/**
 * Write token to file cache
 */
function writeToFileCache(token, expiresAt) {
  try {
    ensureCacheDir();
    
    const cache = {
      access_token: token,
      expires_at: expiresAt,
      cached_at: Math.floor(Date.now() / 1000),
      expires_in_hours: Math.round((expiresAt - Math.floor(Date.now() / 1000)) / 3600)
    };
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`✅ Token cached until ${new Date(expiresAt * 1000).toISOString()}`);
  } catch (error) {
    console.error('Failed to write token cache:', error.message);
  }
}

/**
 * Check if token is still valid
 */
function isTokenValid(expiresAt) {
  const now = Math.floor(Date.now() / 1000);
  return expiresAt > (now + TOKEN_BUFFER_SECONDS);
}

/**
 * Fetch new token from Guesty OAuth endpoint
 * ONLY called when cache is expired or missing
 */
async function fetchNewToken() {
  const clientId = process.env.GUESTY_CLIENT_ID;
  const clientSecret = process.env.GUESTY_CLIENT_SECRET;
  const tokenUrl = process.env.GUESTY_OAUTH_TOKEN_URL || 'https://booking.guesty.com/oauth2/token';
  const scope = process.env.GUESTY_OAUTH_SCOPE || 'booking_engine:api';
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing GUESTY_CLIENT_ID or GUESTY_CLIENT_SECRET environment variables');
  }
  
  console.log('🔄 Fetching new token from Guesty...');
  
  const body = new URLSearchParams();
  body.set('grant_type', 'client_credentials');
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);
  body.set('scope', scope);
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  
  if (!response.ok) {
    const error = await response.text().catch(() => '');
    throw new Error(`Token request failed (${response.status}): ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.access_token || !data.expires_in) {
    throw new Error('Invalid token response from Guesty');
  }
  
  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
  
  return {
    token: data.access_token,
    expiresAt
  };
}

/**
 * Get cached token (THE ONLY FUNCTION YOU SHOULD USE)
 * 
 * Returns a valid OAuth token, using cache when possible.
 * Only fetches a new token if cache is expired or missing.
 * 
 * @returns {Promise<string>} Valid OAuth access token
 * @throws {Error} If unable to get token
 */
export async function getCachedToken() {
  const now = Math.floor(Date.now() / 1000);
  
  // 1. Check in-memory cache first (fastest)
  if (memoryCache.token && isTokenValid(memoryCache.expiresAt)) {
    console.log('✓ Using in-memory cached token');
    return memoryCache.token;
  }
  
  // 2. Check file cache (fast, persists across restarts)
  const fileCache = readFromFileCache();
  if (fileCache && isTokenValid(fileCache.expires_at)) {
    console.log('✓ Using file-cached token');
    
    // Update memory cache
    memoryCache = {
      token: fileCache.access_token,
      expiresAt: fileCache.expires_at
    };
    
    return fileCache.access_token;
  }
  
  // 3. Cache is expired or missing - fetch new token
  console.log('⚠️  Token cache expired or missing, fetching new token...');
  
  try {
    const { token, expiresAt } = await fetchNewToken();
    
    // Update both caches
    memoryCache = { token, expiresAt };
    writeToFileCache(token, expiresAt);
    
    console.log('✅ New token obtained and cached');
    return token;
    
  } catch (error) {
    console.error('❌ Failed to get token:', error.message);
    throw new Error(`Unable to get Guesty OAuth token: ${error.message}`);
  }
}

/**
 * Get token info (for debugging)
 */
export function getTokenInfo() {
  const fileCache = readFromFileCache();
  
  if (!fileCache) {
    return { cached: false, message: 'No token cached' };
  }
  
  const now = Math.floor(Date.now() / 1000);
  const isValid = isTokenValid(fileCache.expires_at);
  const expiresIn = fileCache.expires_at - now;
  
  return {
    cached: true,
    valid: isValid,
    expiresAt: new Date(fileCache.expires_at * 1000).toISOString(),
    expiresInSeconds: expiresIn,
    expiresInHours: Math.round(expiresIn / 3600),
    cachedAt: new Date(fileCache.cached_at * 1000).toISOString()
  };
}

/**
 * Force refresh token (use sparingly!)
 */
export async function forceRefreshToken() {
  console.log('🔄 Force refreshing token...');
  const { token, expiresAt } = await fetchNewToken();
  memoryCache = { token, expiresAt };
  writeToFileCache(token, expiresAt);
  return token;
}
