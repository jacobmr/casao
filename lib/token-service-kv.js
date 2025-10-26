/**
 * Centralized Token Service (Vercel KV)
 * 
 * Manages Guesty OAuth tokens with KV caching to prevent rate limits.
 * ALL code must use this service - never fetch tokens directly!
 * 
 * Token expires after 24 hours, cached in Vercel KV (Redis)
 * This prevents hitting the rate limit (3 requests per 24 hours)
 */

import { getCachedToken as getTokenFromCache, setCachedToken as setTokenInCache } from './kv-cache';

const TOKEN_BUFFER_SECONDS = 60; // Refresh 60 seconds before expiry

// In-memory cache (for multiple requests in same serverless instance)
let memoryCache = {
  token: null,
  expiresAt: 0
};

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
 * 
 * ⚠️  CRITICAL: Guesty has a rate limit of 3 requests per 24 hours!
 * This function should RARELY be called - only when token truly expired.
 */
async function fetchNewToken() {
  const clientId = process.env.GUESTY_CLIENT_ID;
  const clientSecret = process.env.GUESTY_CLIENT_SECRET;
  const tokenUrl = process.env.GUESTY_OAUTH_TOKEN_URL || 'https://booking.guesty.com/oauth2/token';
  const scope = process.env.GUESTY_OAUTH_SCOPE || 'booking_engine:api';
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing GUESTY_CLIENT_ID or GUESTY_CLIENT_SECRET environment variables');
  }
  
  console.log('⚠️  ⚠️  ⚠️  FETCHING NEW TOKEN FROM GUESTY (Rate limit: 3/24h) ⚠️  ⚠️  ⚠️');
  
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
  // 1. Check in-memory cache first (fastest)
  if (memoryCache.token && isTokenValid(memoryCache.expiresAt)) {
    console.log('✓ Using in-memory cached token');
    return memoryCache.token;
  }
  
  // 2. Check Redis cache (persists across instances)
  const cachedToken = await getTokenFromCache();
  if (cachedToken) {
    console.log('✓ Using Redis-cached token');
    return cachedToken;
  }
  
  // 3. Cache is expired or missing - fetch new token
  console.log('⚠️  Token cache expired or missing, fetching new token...');
  
  try {
    const { token, expiresAt } = await fetchNewToken();
    
    // Update both caches
    memoryCache = { token, expiresAt };
    await setTokenInCache(token, expiresAt);
    
    console.log('✅ New token obtained and cached');
    return token;
    
  } catch (error) {
    console.error('❌ Failed to get token:', error.message);
    throw new Error(`Unable to get Guesty OAuth token: ${error.message}`);
  }
}

/**
 * Force refresh token (use sparingly!)
 */
export async function forceRefreshToken() {
  console.log('🔄 Force refreshing token...');
  const { token, expiresAt } = await fetchNewToken();
  memoryCache = { token, expiresAt };
  await setTokenInCache(token, expiresAt);
  return token;
}
