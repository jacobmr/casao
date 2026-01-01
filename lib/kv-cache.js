/**
 * Redis Cache Implementation  
 * Uses Redis for persistent cache storage on Vercel
 * Connects via REDIS_URL environment variable
 */

import { createClient } from 'redis';

// Create and connect Redis client
let redisClient = null;

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }
  
  if (!redisClient) {
    redisClient = createClient({ 
      url: process.env.REDIS_URL 
    });
    
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  }
  
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  
  return redisClient;
}

const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds (for pricing)
const AVAILABILITY_CACHE_DURATION = 15 * 60; // 15 minutes in seconds (availability changes more often)

/**
 * Get cached availability for a month
 */
export async function getCachedAvailability(year, month) {
  try {
    const redis = await getRedisClient();
    const key = `availability:${year}-${month}`;
    const cached = await redis.get(key);
    
    if (cached) {
      console.log(`✅ Redis Cache HIT for ${year}-${month}`);
      return JSON.parse(cached);
    }
    
    console.log(`❌ Redis Cache MISS for ${year}-${month}`);
    return null;
  } catch (error) {
    console.error(`Error reading Redis cache for ${year}-${month}:`, error);
    return null;
  }
}

/**
 * Set cached availability for a month
 */
export async function setCachedAvailability(year, month, data) {
  try {
    const redis = await getRedisClient();
    const key = `availability:${year}-${month}`;
    await redis.set(key, JSON.stringify(data), { EX: AVAILABILITY_CACHE_DURATION });
    console.log(`💾 Cached availability for ${year}-${month} in Redis (15 min TTL)`);
  } catch (error) {
    console.error(`Error writing Redis cache for ${year}-${month}:`, error);
  }
}

/**
 * Get cached pricing for a date range
 */
export async function getCachedPricing(checkIn, checkOut, guests) {
  try {
    const redis = await getRedisClient();
    const key = `pricing:${checkIn}_${checkOut}_${guests}`;
    const cached = await redis.get(key);
    
    if (cached) {
      console.log(`✅ Redis Pricing cache HIT for ${checkIn} to ${checkOut}`);
      return JSON.parse(cached);
    }
    
    console.log(`❌ Redis Pricing cache MISS for ${checkIn} to ${checkOut}`);
    return null;
  } catch (error) {
    console.error(`Error reading Redis pricing cache:`, error);
    return null;
  }
}

/**
 * Set cached pricing for a date range
 */
export async function setCachedPricing(checkIn, checkOut, guests, data) {
  try {
    const redis = await getRedisClient();
    const key = `pricing:${checkIn}_${checkOut}_${guests}`;
    await redis.set(key, JSON.stringify(data), { EX: CACHE_DURATION });
    console.log(`💾 Cached pricing for ${checkIn} to ${checkOut} in Redis`);
  } catch (error) {
    console.error(`Error writing Redis pricing cache:`, error);
  }
}

/**
 * Get cached token
 * Returns ONLY if token is valid (not expired)
 * Returns null if expired or missing - caller must fetch new token
 */
export async function getCachedToken() {
  try {
    const redis = await getRedisClient();
    const cached = await redis.get('guesty:token');
    
    if (!cached) {
      console.log('❌ No token in Redis cache');
      return null;
    }
    
    const data = JSON.parse(cached);
    
    if (!data.access_token || !data.expires_at) {
      console.log('❌ Invalid token structure in cache');
      return null;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = data.expires_at - now;
    
    // Only return token if it has more than 60 seconds left
    if (expiresIn > 60) {
      console.log(`✅ Using Redis cached token (valid for ${Math.round(expiresIn/3600)} hours)`);
      return data.access_token;
    }
    
    console.log(`⚠️  Token in cache but expired or expiring soon (${expiresIn}s left)`);
    return null;
    
  } catch (error) {
    console.error('Error reading Redis token cache:', error);
    return null;
  }
}

/**
 * Set cached token
 */
export async function setCachedToken(token, expiresAt) {
  try {
    const redis = await getRedisClient();
    const ttl = expiresAt - Math.floor(Date.now() / 1000);
    await redis.set('guesty:token', JSON.stringify({
      access_token: token,
      expires_at: expiresAt,
      cached_at: Math.floor(Date.now() / 1000)
    }), { EX: ttl });
    console.log(`✅ Token cached in Redis until ${new Date(expiresAt * 1000).toISOString()}`);
  } catch (error) {
    console.error('Error writing Redis token cache:', error);
  }
}

/**
 * Get monthly pricing from cache
 */
export async function getMonthlyPricing(year, month) {
  try {
    const redis = await getRedisClient();
    const key = `monthly_pricing:${year}-${month}`;
    const cached = await redis.get(key);
    
    if (cached) {
      console.log(`✅ Redis Monthly pricing HIT for ${year}-${month}`);
      return JSON.parse(cached);
    }
    
    return null;
  } catch (error) {
    console.error('Error reading Redis monthly pricing:', error);
    return null;
  }
}

/**
 * Set monthly pricing in cache
 */
export async function setMonthlyPricing(year, month, data) {
  try {
    const redis = await getRedisClient();
    const key = `monthly_pricing:${year}-${month}`;
    await redis.set(key, JSON.stringify(data), { EX: CACHE_DURATION });
    console.log(`💾 Cached monthly pricing for ${year}-${month} in Redis`);
  } catch (error) {
    console.error('Error writing Redis monthly pricing:', error);
  }
}

// ============================================
// Read-through Availability Cache
// ============================================

/**
 * Get availability with read-through caching
 * If cache miss, fetches from Guesty and caches the result
 * @param {number} year
 * @param {number} month
 * @param {string} token - Guesty auth token
 * @returns {Promise<Array|null>}
 */
export async function getAvailabilityWithFallback(year, month, token) {
  // Try cache first
  const cached = await getCachedAvailability(year, month);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from Guesty
  try {
    const listingId = process.env.GUESTY_PROPERTY_ID;

    // Calculate first and last day of month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const fromDate = monthStart.toISOString().split('T')[0];
    const toDate = monthEnd.toISOString().split('T')[0];

    const url = `https://booking.guesty.com/api/listings/${listingId}/calendar?from=${fromDate}&to=${toDate}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Guesty API error for ${year}-${month}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const days = data.days || data;

    // Cache for next time
    await setCachedAvailability(year, month, days);
    console.log(`📅 Read-through cache: fetched and cached ${year}-${month} from Guesty`);

    return days;
  } catch (error) {
    console.error(`Failed to fetch Guesty data for ${year}-${month}:`, error);
    return null;
  }
}

// ============================================
// Seasonal Discount Code Functions
// ============================================

const SEASONAL_CODE_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Get seasonal inquiry by code
 */
export async function getSeasonalCode(code) {
  try {
    const redis = await getRedisClient();
    const key = `seasonal:${code}`;
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  } catch (error) {
    console.error('Error reading seasonal code:', error);
    return null;
  }
}

/**
 * Set seasonal inquiry code
 */
export async function setSeasonalCode(code, data) {
  try {
    const redis = await getRedisClient();
    const key = `seasonal:${code}`;
    await redis.set(key, JSON.stringify(data), { EX: SEASONAL_CODE_DURATION });
    console.log(`💾 Cached seasonal code ${code} in Redis (30 day TTL)`);
  } catch (error) {
    console.error('Error writing seasonal code:', error);
    throw error; // Re-throw so caller knows it failed
  }
}
