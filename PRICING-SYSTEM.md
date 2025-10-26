# Pricing System Architecture

## 🎯 Overview

The pricing system uses a **two-step caching approach**:

1. **Availability Cache** - Fast, simple (from Guesty calendar API)
2. **Pricing Cache** - Smart, efficient (from Guesty quotes API)

## 📊 Why Two Steps?

**Guesty's calendar API does NOT include pricing!**
- Calendar API returns: `{date, status, minNights}`
- Pricing requires: Separate quote requests

**Challenge:** Can't pre-cache all possible date combinations
- 30 days × 30 possible lengths = 900 combinations per month!
- Would hit rate limits immediately

**Solution:** Smart pricing fetcher
- Only fetch pricing for **available dates**
- Group into **weekly chunks** to minimize API calls
- Cache results for calendar display

## 🔄 Data Flow

### Step 1: Availability (Warmup)
```
Warmup Endpoint
  ↓
Fetch 6 months from Guesty calendar API
  ↓
Cache in Redis: availability:{year}-{month}
  ↓
Returns: [{date, status, minNights}, ...]
```

### Step 2: Pricing (After Availability)
```
Pricing Fetcher
  ↓
Read availability from Redis
  ↓
Filter to ONLY available dates
  ↓
Group into weekly chunks (3-7 days)
  ↓
Make quote requests for each chunk
  ↓
Extract per-day pricing from quotes
  ↓
Cache in Redis: monthly_pricing:{year}-{month}
  ↓
Returns: {date: price, ...}
```

## 📁 File Structure

### Core Files

**`/lib/pricing-fetcher.js`** - THE SMART PART
```javascript
// This is the key file!
// It efficiently fetches pricing for available dates only

fetchMonthlyPricing(availabilityData)
  1. Filter to available dates only
  2. Group into weekly chunks (3-7 days each)
  3. Make quote request for each chunk
  4. Extract per-day pricing from response
  5. Return Map of {date: price}
```

**`/lib/kv-cache.js`** - Redis storage
```javascript
// Availability
getCachedAvailability(year, month)
setCachedAvailability(year, month, data)

// Monthly pricing
getMonthlyPricing(year, month)
setMonthlyPricing(year, month, data)

// Quote pricing (date ranges)
getCachedPricing(checkIn, checkOut, guests)
setCachedPricing(checkIn, checkOut, guests, data)
```

### API Endpoints

**`/api/warmup-cache`** - Caches availability
- Fetches 6 months of availability
- Stores in Redis
- **TODO:** Should also trigger pricing fetch!

**`/api/pricing/monthly`** - Fetches pricing for a month
- Takes availability data
- Uses pricing-fetcher
- **TODO:** Migrate from files to Redis!

**`/api/pricing/monthly-cached`** - Reads cached pricing
- Returns pricing for calendar display
- **TODO:** Migrate from files to Redis!

**`/api/quotes`** - On-demand quote for date range
- Used when user selects specific dates
- Caches result for that date range
- Already uses Redis ✅

## 🔧 Current State (BEFORE FIX)

### What Works ✅
- Availability caching in Redis
- Quote caching in Redis (when dates selected)
- Pricing-fetcher logic (smart chunking)

### What's Broken ❌
- Warmup doesn't trigger pricing fetch
- Pricing endpoints still use FILE storage
- Monthly pricing not in Redis

### Result
- Calendar shows availability ✅
- Calendar shows NO pricing ❌
- Pricing appears when dates selected ✅

## 🎯 The Fix

### 1. Update Warmup Endpoint
```javascript
// app/api/warmup-cache/route.js

for each month:
  // Step 1: Fetch availability
  const availability = await fetchAvailability(year, month)
  await setCachedAvailability(year, month, availability)
  
  // Step 2: Fetch pricing for available dates
  const pricing = await fetchMonthlyPricing(availability)
  await setMonthlyPricing(year, month, pricing)
```

### 2. Update Pricing-Fetcher for Redis
```javascript
// lib/pricing-fetcher.js

// Change from CommonJS to ES modules
export async function fetchMonthlyPricing(availabilityData)

// Update to use token-service-kv (not old token-service)
import { getCachedToken } from './token-service-kv'
```

### 3. Update Monthly Pricing Endpoints
```javascript
// app/api/pricing/monthly/route.js
// Remove file system code
// Use setMonthlyPricing from kv-cache

// app/api/pricing/monthly-cached/route.js  
// Already updated to use Redis ✅
```

## 📈 Expected Results After Fix

### Warmup Process
```
1. Fetch availability for Oct 2025 → Cache in Redis
2. Fetch pricing for available dates → Cache in Redis
3. Fetch availability for Nov 2025 → Cache in Redis
4. Fetch pricing for available dates → Cache in Redis
... (6 months total)
```

### API Calls Per Month
```
Availability: 1 request
Pricing: ~4-8 requests (depends on available dates)
Total: ~5-9 requests per month
For 6 months: ~30-54 requests total
```

### Calendar Display
```
✅ Shows availability (booked/available)
✅ Shows per-day pricing ($XXX/night)
✅ Fast (all from Redis cache)
✅ Updates daily via cron
```

## ⚠️ Important Notes

### Rate Limits
- Guesty allows reasonable API usage
- Pricing-fetcher groups requests efficiently
- 1 second delay between quote requests
- Total warmup time: ~1-2 minutes

### Token Management
- Uses cached token (no new requests)
- Token valid for 24 hours
- Rate limit: 3 token requests per 24 hours
- See TOKEN-SAFETY-CHECK.md

### Cache Duration
- Availability: 24 hours
- Pricing: 24 hours
- Quotes: 24 hours
- All refresh daily at 2 AM UTC (cron)

## 🧪 Testing

### After Fix, Test:
```bash
# 1. Trigger warmup
curl https://www.casavistas.net/api/warmup-cache

# 2. Check availability cached
curl "https://www.casavistas.net/api/calendar?from=2025-11-01&to=2025-11-30"

# 3. Check pricing cached
curl "https://www.casavistas.net/api/pricing/monthly-cached?year=2025&month=10"

# 4. Should see pricing in response!
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "2025-11-01": 450,
    "2025-11-02": 450,
    "2025-11-03": 450,
    ...
  },
  "count": 25
}
```

## 📝 Migration Checklist

- [ ] Update pricing-fetcher.js to ES modules
- [ ] Update pricing-fetcher.js to use token-service-kv
- [ ] Update warmup to call pricing-fetcher
- [ ] Update /api/pricing/monthly to use Redis
- [ ] Remove file-based pricing-cache.js (deprecated)
- [ ] Test warmup on production
- [ ] Verify pricing shows in calendar
- [ ] Document in ROADMAP.md

## 🎓 Key Learnings

1. **Guesty calendar API ≠ pricing**
   - Calendar only has availability
   - Pricing requires quotes API

2. **Smart chunking is essential**
   - Can't cache all combinations
   - Weekly chunks minimize API calls

3. **Two-step process**
   - First: availability (simple)
   - Second: pricing (smart)

4. **Redis for everything**
   - File system doesn't work on Vercel
   - Redis persists across deployments
   - Fast and reliable

---

**REMEMBER:** The pricing-fetcher is the smart part that makes this work!
Don't try to get pricing from the calendar API - it's not there!
