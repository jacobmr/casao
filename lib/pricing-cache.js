// Server-side cache for pricing/quotes data
// Refreshes daily at 2 AM or when cache expires

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// In-memory cache (in production, use Redis or similar)
let pricingCache = new Map();

/**
 * Get cache key for a date range
 */
function getCacheKey(checkIn, checkOut, guests) {
  return `pricing_${checkIn}_${checkOut}_${guests}`;
}

/**
 * Check if cache is still valid
 */
function isCacheValid(cacheEntry) {
  if (!cacheEntry) return false;
  
  const now = new Date();
  const cacheTime = new Date(cacheEntry.timestamp);
  
  // Check if cache is less than 24 hours old
  if (now - cacheTime < CACHE_DURATION) {
    return true;
  }
  
  // Also check if we've passed 2 AM since cache was created
  const today2AM = new Date(now);
  today2AM.setHours(2, 0, 0, 0);
  
  if (cacheTime < today2AM && now >= today2AM) {
    // Cache was created before today's 2 AM, and it's now past 2 AM
    return false;
  }
  
  return true;
}

/**
 * Get cached pricing for a date range
 */
export function getCachedPricing(checkIn, checkOut, guests) {
  const key = getCacheKey(checkIn, checkOut, guests);
  const cached = pricingCache.get(key);
  
  if (cached && isCacheValid(cached)) {
    console.log(`✅ Pricing cache HIT for ${checkIn} to ${checkOut}`);
    return cached.data;
  }
  
  console.log(`❌ Pricing cache MISS for ${checkIn} to ${checkOut}`);
  return null;
}

/**
 * Set cached pricing for a date range
 */
export function setCachedPricing(checkIn, checkOut, guests, data) {
  const key = getCacheKey(checkIn, checkOut, guests);
  pricingCache.set(key, {
    data,
    timestamp: new Date().toISOString(),
  });
  console.log(`💾 Cached pricing for ${checkIn} to ${checkOut}`);
}

/**
 * Clear all cache (useful for manual refresh)
 */
export function clearPricingCache() {
  pricingCache.clear();
  console.log('🗑️  Pricing cache cleared');
}

/**
 * Get cache stats
 */
export function getPricingCacheStats() {
  return {
    size: pricingCache.size,
    keys: Array.from(pricingCache.keys()),
  };
}
