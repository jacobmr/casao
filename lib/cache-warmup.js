// Cache warmup utility
// Automatically pre-populates cache on first request if empty

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(process.cwd(), '.cache');
const WARMUP_LOCK_FILE = path.join(CACHE_DIR, '.warmup-in-progress');
const MONTHS_TO_CACHE = 6;

let warmupPromise = null;

/**
 * Check if cache is empty (needs warmup)
 */
function needsWarmup() {
  if (!fs.existsSync(CACHE_DIR)) {
    return true;
  }
  
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'));
  
  // If we have fewer than 3 cache files, probably needs warmup
  return files.length < 3;
}

/**
 * Check if warmup is already in progress
 */
function isWarmupInProgress() {
  return fs.existsSync(WARMUP_LOCK_FILE);
}

/**
 * Warm up cache by fetching next 6 months
 */
async function warmupCache() {
  // Prevent multiple simultaneous warmups
  if (warmupPromise) {
    console.log('⏳ Cache warmup already in progress, waiting...');
    return warmupPromise;
  }
  
  if (isWarmupInProgress()) {
    console.log('⏳ Cache warmup in progress (lock file exists)');
    return;
  }
  
  console.log('🔥 Starting cache warmup (first request or empty cache)...');
  
  // Create lock file
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(WARMUP_LOCK_FILE, new Date().toISOString());
  
  warmupPromise = (async () => {
    try {
      const now = new Date();
      const results = [];
      
      for (let i = 0; i < MONTHS_TO_CACHE; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        
        const from = new Date(year, month, 1).toISOString().split('T')[0];
        const to = new Date(year, month + 1, 0).toISOString().split('T')[0];
        
        console.log(`  📅 Warming up ${targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}...`);
        
        try {
          // Fetch availability (will cache it)
          const availResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/calendar?from=${from}&to=${to}`);
          
          if (availResponse.ok) {
            results.push({ month: `${year}-${month}`, status: 'success' });
          } else {
            results.push({ month: `${year}-${month}`, status: 'failed', error: availResponse.status });
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`  ❌ Error warming up ${year}-${month}:`, error.message);
          results.push({ month: `${year}-${month}`, status: 'error', error: error.message });
        }
      }
      
      console.log('✅ Cache warmup complete!');
      console.log('   Results:', results);
      
      // Remove lock file
      if (fs.existsSync(WARMUP_LOCK_FILE)) {
        fs.unlinkSync(WARMUP_LOCK_FILE);
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
      
      // Remove lock file on error
      if (fs.existsSync(WARMUP_LOCK_FILE)) {
        fs.unlinkSync(WARMUP_LOCK_FILE);
      }
      
      throw error;
    } finally {
      warmupPromise = null;
    }
  })();
  
  return warmupPromise;
}

/**
 * Ensure cache is warmed up (call this on app startup or first request)
 */
export async function ensureCacheWarmedUp() {
  if (needsWarmup() && !isWarmupInProgress()) {
    // Start warmup in background (don't block the request)
    warmupCache().catch(error => {
      console.error('Background cache warmup failed:', error);
    });
    
    console.log('🔥 Cache warmup started in background');
  }
}

/**
 * Force cache warmup (for manual trigger)
 */
export async function forceWarmup() {
  return warmupCache();
}

module.exports = { ensureCacheWarmedUp, forceWarmup, needsWarmup };
