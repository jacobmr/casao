// Server-side cache for availability data
// Refreshes daily at 2 AM or when cache expires
// Stores in filesystem for persistence

const fs = require('fs');
const path = require('path');

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'availability.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
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
 * Load entire availability cache
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const fileContent = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error loading availability cache:', error);
  }
  return { data: {}, timestamp: new Date().toISOString() };
}

/**
 * Save entire availability cache
 */
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving availability cache:', error);
  }
}

/**
 * Get cached availability for a month
 */
export function getCachedAvailability(year, month) {
  const cache = loadCache();
  
  if (!isCacheValid(cache)) {
    console.log(`⏰ Availability cache EXPIRED`);
    return null;
  }
  
  const key = `${year}-${month}`;
  if (cache.data[key]) {
    console.log(`✅ Cache HIT for ${year}-${month}`);
    return cache.data[key];
  }
  
  console.log(`❌ Cache MISS for ${year}-${month}`);
  return null;
}

/**
 * Set cached availability for a month
 */
export function setCachedAvailability(year, month, data) {
  const cache = loadCache();
  const key = `${year}-${month}`;
  
  cache.data[key] = data;
  cache.timestamp = new Date().toISOString();
  
  saveCache(cache);
  console.log(`💾 Cached availability for ${year}-${month}`);
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
