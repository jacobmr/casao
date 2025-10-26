/**
 * Vercel KV Cache Implementation
 * Uses Redis for persistent cache storage on Vercel
 */

import { kv } from '@vercel/kv';

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

/**
 * Get cached availability for a month
 */
export async function getCachedAvailability(year, month) {
  try {
    const key = `availability:${year}-${month}`;
    const cached = await kv.get(key);
    
    if (cached) {
      console.log(`✅ KV Cache HIT for ${year}-${month}`);
      return cached;
    }
    
    console.log(`❌ KV Cache MISS for ${year}-${month}`);
    return null;
  } catch (error) {
    console.error(`Error reading KV cache for ${year}-${month}:`, error);
    return null;
  }
}

/**
 * Set cached availability for a month
 */
export async function setCachedAvailability(year, month, data) {
  try {
    const key = `availability:${year}-${month}`;
    await kv.set(key, data, { ex: CACHE_DURATION });
    console.log(`💾 Cached availability for ${year}-${month} in KV`);
  } catch (error) {
    console.error(`Error writing KV cache for ${year}-${month}:`, error);
  }
}

/**
 * Get cached pricing for a date range
 */
export async function getCachedPricing(checkIn, checkOut, guests) {
  try {
    const key = `pricing:${checkIn}_${checkOut}_${guests}`;
    const cached = await kv.get(key);
    
    if (cached) {
      console.log(`✅ KV Pricing cache HIT for ${checkIn} to ${checkOut}`);
      return cached;
    }
    
    console.log(`❌ KV Pricing cache MISS for ${checkIn} to ${checkOut}`);
    return null;
  } catch (error) {
    console.error(`Error reading KV pricing cache:`, error);
    return null;
  }
}

/**
 * Set cached pricing for a date range
 */
export async function setCachedPricing(checkIn, checkOut, guests, data) {
  try {
    const key = `pricing:${checkIn}_${checkOut}_${guests}`;
    await kv.set(key, data, { ex: CACHE_DURATION });
    console.log(`💾 Cached pricing for ${checkIn} to ${checkOut} in KV`);
  } catch (error) {
    console.error(`Error writing KV pricing cache:`, error);
  }
}

/**
 * Get cached token
 */
export async function getCachedToken() {
  try {
    const cached = await kv.get('guesty:token');
    
    if (cached && cached.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      if (cached.expires_at > now + 60) {
        console.log('✅ Using KV cached token');
        return cached.access_token;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error reading KV token cache:', error);
    return null;
  }
}

/**
 * Set cached token
 */
export async function setCachedToken(token, expiresAt) {
  try {
    const ttl = expiresAt - Math.floor(Date.now() / 1000);
    await kv.set('guesty:token', {
      access_token: token,
      expires_at: expiresAt,
      cached_at: Math.floor(Date.now() / 1000)
    }, { ex: ttl });
    console.log(`✅ Token cached in KV until ${new Date(expiresAt * 1000).toISOString()}`);
  } catch (error) {
    console.error('Error writing KV token cache:', error);
  }
}

/**
 * Get monthly pricing from cache
 */
export async function getMonthlyPricing(year, month) {
  try {
    const key = `monthly_pricing:${year}-${month}`;
    const cached = await kv.get(key);
    
    if (cached) {
      console.log(`✅ KV Monthly pricing HIT for ${year}-${month}`);
      return cached;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading KV monthly pricing:', error);
    return null;
  }
}

/**
 * Set monthly pricing in cache
 */
export async function setMonthlyPricing(year, month, data) {
  try {
    const key = `monthly_pricing:${year}-${month}`;
    await kv.set(key, data, { ex: CACHE_DURATION });
    console.log(`💾 Cached monthly pricing for ${year}-${month} in KV`);
  } catch (error) {
    console.error('Error writing KV monthly pricing:', error);
  }
}
