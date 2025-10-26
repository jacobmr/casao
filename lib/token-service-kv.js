/**
 * Centralized Token Service (Vercel KV)
 * 
 * Manages Guesty OAuth tokens with KV caching to prevent rate limits.
 * ALL code must use this service - never fetch tokens directly!
 * 
 * Token expires after 24 hours, cached in Vercel KV (Redis)
 * This prevents hitting the rate limit (3 requests per 24 hours)
 */

import { kv } from '@vercel/kv';

const TOKEN_BUFFER_SECONDS = 60; // Refresh 60 seconds before expiry

// In-memory cache (for multiple requests in same serverless instance)
let memoryCache = {
  token: null,
  expiresAt: 0
};

/**
 * Read token from KV cache
 */
async function readFromKVCache() {
  try {
    const cached = await kv.get('guesty:token');
    
    if (cached && cached.access_token && cached.expires_at) {
      return cached;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to read token from KV:', error.message);
    return null;
  }
}

/**
 * Write token to KV cache
 */
async function writeToKVCache(token, expiresAt) {
  try {
    const ttl = expiresAt - Math.floor(Date.now() / 1000);
    
    const cache = {
      access_token: token,
      expires_at: expiresAt,
      cached_at: Math.floor(Date.now() / 1000),
      expires_in_hours: Math.round(ttl / 3600)
    };
    
    await kv.set('guesty:token', cache, { ex: ttl });
    console.log(`✅ Token cached in KV until ${new Date(expiresAt * 1000).toISOString()}`);
  } catch (error) {
    console.error('Failed to write token to KV:', error.message);
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
  
  // 2. Check KV cache (fast, persists across instances)
  const kvCache = await readFromKVCache();
  if (kvCache && isTokenValid(kvCache.expires_at)) {
    console.log('✓ Using KV-cached token');
    
    // Update memory cache
    memoryCache = {
      token: kvCache.access_token,
      expiresAt: kvCache.expires_at
    };
    
    return kvCache.access_token;
  }
  
  // 3. Cache is expired or missing - fetch new token
  console.log('⚠️  Token cache expired or missing, fetching new token...');
  
  try {
    const { token, expiresAt } = await fetchNewToken();
    
    // Update both caches
    memoryCache = { token, expiresAt };
    await writeToKVCache(token, expiresAt);
    
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
export async function getTokenInfo() {
  const kvCache = await readFromKVCache();
  
  if (!kvCache) {
    return { cached: false, message: 'No token cached' };
  }
  
  const now = Math.floor(Date.now() / 1000);
  const isValid = isTokenValid(kvCache.expires_at);
  const expiresIn = kvCache.expires_at - now;
  
  return {
    cached: true,
    valid: isValid,
    expiresAt: new Date(kvCache.expires_at * 1000).toISOString(),
    expiresInSeconds: expiresIn,
    expiresInHours: Math.round(expiresIn / 3600),
    cachedAt: new Date(kvCache.cached_at * 1000).toISOString()
  };
}

/**
 * Force refresh token (use sparingly!)
 */
export async function forceRefreshToken() {
  console.log('🔄 Force refreshing token...');
  const { token, expiresAt } = await fetchNewToken();
  memoryCache = { token, expiresAt };
  await writeToKVCache(token, expiresAt);
  return token;
}
