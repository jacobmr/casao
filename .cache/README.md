# Cache Directory

## ⚠️ CRITICAL: guesty-token.json

**NEVER DELETE `guesty-token.json`!**

Guesty has a strict rate limit: **3 token requests per 24 hours**

If you delete this file, the app will try to fetch a new token and may hit the rate limit, blocking all API access for 24 hours.

## Data Cache Files

These can be safely deleted and will regenerate:
- `availability.json` - Availability data for all months
- `pricing.json` - Pricing quotes for all date ranges
- `.warmup-in-progress` - Lock file during cache warmup

## Cache Refresh

Run nightly at 2 AM via cron:
```bash
0 2 * * * cd /path/to/CasaVistas && PORT=3000 node scripts/cache-availability.js
```
