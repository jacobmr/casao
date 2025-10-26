// Server-side cache for availability data
// Refreshes daily at 2 AM or when cache expires
// Stores in filesystem for persistence

const fs = require('fs');
const path = require('path');

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_DIR = path.join(process.cwd(), '.cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Get cache key for a month
 */
function getCacheKey(year, month) {
  return `availability_${year}_${month}`;
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
 * Get cached availability for a month
 */
export function getCachedAvailability(year, month) {
  const key = getCacheKey(year, month);
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const cached = JSON.parse(fileContent);
      
      if (isCacheValid(cached)) {
        console.log(`✅ Cache HIT for ${year}-${month} (from file)`);
        return cached.data;
      } else {
        console.log(`⏰ Cache EXPIRED for ${year}-${month}`);
        fs.unlinkSync(filePath); // Delete expired cache
      }
    }
  } catch (error) {
    console.error(`Error reading cache for ${year}-${month}:`, error);
  }
  
  console.log(`❌ Cache MISS for ${year}-${month}`);
  return null;
}

/**
 * Set cached availability for a month
 */
export function setCachedAvailability(year, month, data) {
  const key = getCacheKey(year, month);
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  
  const cacheEntry = {
    data,
    timestamp: new Date().toISOString(),
  };
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(cacheEntry, null, 2), 'utf8');
    console.log(`💾 Cached availability for ${year}-${month} to file`);
  } catch (error) {
    console.error(`Error writing cache for ${year}-${month}:`, error);
  }
}

/**
 * Clear all cache (useful for manual refresh)
 */
export function clearCache() {
  availabilityCache.clear();
  console.log('🗑️  Cache cleared');
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    size: availabilityCache.size,
    keys: Array.from(availabilityCache.keys()),
  };
}
