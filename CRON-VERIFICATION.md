# Cron Job Verification

## ✅ Configuration Status

### Vercel Cron Setup

- **Schedule:** `0 2 * * *` (Daily at 2 AM UTC)
- **Endpoint:** `/api/cron/cache-refresh`
- **Security:** Protected by `CRON_SECRET`
- **Status:** ✅ Configured in `vercel.json`

### Environment Variables

- ✅ `CRON_SECRET` - Set in Production, Preview, Development
- ✅ `REDIS_URL` - Set in all environments
- ✅ `GUESTY_CLIENT_ID` - Set
- ✅ `GUESTY_CLIENT_SECRET` - Set
- ✅ `GUESTY_PROPERTY_ID` - Set

## 🔄 What the Cron Does

**Every day at 2 AM UTC (6 PM PST / 7 PM PDT):**

1. Vercel triggers `/api/cron/cache-refresh`
2. Endpoint verifies `CRON_SECRET` (security)
3. Calls `/api/warmup-cache` internally
4. Warmup fetches 6 months of availability from Guesty
5. Stores data in Redis with 24-hour TTL
6. Returns success/failure status

## 📊 Expected Behavior

### Daily Cycle:

```
2:00 AM UTC - Cron triggers
2:00 AM UTC - Fetches 6 months of availability
2:01 AM UTC - Stores in Redis
2:01 AM UTC - Cache valid for 24 hours
```

### Token Usage:

- **Cron warmup:** Uses cached token (no new request)
- **Token refresh:** Happens automatically when expired
- **Expected:** 1 token request per 24 hours (not from cron)

## 🧪 Manual Test

You can manually trigger the cron (requires CRON_SECRET):

```bash
# Get your CRON_SECRET
vercel env pull .env.local
source .env.local

# Test the cron endpoint
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://casao.vercel.app/api/cron/cache-refresh
```

**Expected response:**

```json
{
  "success": true,
  "message": "Cache refresh completed",
  "timestamp": "2025-10-26T...",
  "results": {
    "success": true,
    "message": "Cache warmup completed",
    "results": [
      {"month": "2025-9", "status": "success"},
      {"month": "2025-10", "status": "success"},
      ...
    ]
  }
}
```

## 📍 Vercel Dashboard

**View cron status:**

1. Go to: https://vercel.com/huddlehealth/casao/settings/crons
2. Should see:
   - Path: `/api/cron/cache-refresh`
   - Schedule: `0 2 * * *`
   - Status: Enabled ✅

**View cron logs:**

1. Go to: https://vercel.com/huddlehealth/casao/logs
2. Filter by: `/api/cron/cache-refresh`
3. Look for:
   - `🕐 Cron job started: Cache refresh`
   - `✅ Cron job completed successfully`

## 🚨 Monitoring

### Success Indicators:

- ✅ Cron runs daily at 2 AM UTC
- ✅ Returns `success: true`
- ✅ All 6 months show `status: "success"`
- ✅ No token rate limit errors

### Warning Signs:

- ⚠️ Cron returns `success: false`
- ⚠️ Any month shows `status: "failed"`
- ⚠️ Token rate limit error (429)
- ⚠️ Cron doesn't run (check Vercel dashboard)

## 🔧 Troubleshooting

### If cron doesn't run:

1. Check Vercel dashboard → Settings → Crons
2. Verify cron is enabled
3. Check `vercel.json` is committed
4. Redeploy if needed

### If cron fails:

1. Check Vercel logs for error message
2. Verify `CRON_SECRET` is set
3. Test `/api/warmup-cache` manually
4. Check token is valid in Redis

### If token rate limit hit:

1. Wait 24 hours
2. Check logs to see why multiple requests
3. Verify token caching is working
4. See `TOKEN-SAFETY-CHECK.md`

## 📅 Schedule Details

**Cron Expression:** `0 2 * * *`

- **Minute:** 0
- **Hour:** 2 (UTC)
- **Day of Month:** \* (every day)
- **Month:** \* (every month)
- **Day of Week:** \* (every day)

**In Your Timezone:**

- UTC: 2:00 AM
- PST: 6:00 PM (previous day)
- PDT: 7:00 PM (previous day)
- EST: 9:00 PM (previous day)
- EDT: 10:00 PM (previous day)

## ✅ Verification Checklist

- [x] `vercel.json` has cron configuration
- [x] `/api/cron/cache-refresh` endpoint exists
- [x] `CRON_SECRET` set in all environments
- [x] Endpoint validates `CRON_SECRET`
- [x] Calls `/api/warmup-cache` internally
- [x] Warmup uses cached token (no new request)
- [x] Stores data in Redis
- [x] Returns success/failure status
- [x] Cron enabled in Vercel dashboard

## 🎯 Next Cron Run

**Current time:** Check https://time.is/UTC

**Next run:** Tomorrow at 2:00 AM UTC

**To verify it ran:**

1. Check Vercel logs after 2:00 AM UTC
2. Look for "Cron job completed successfully"
3. Test calendar API - should have fresh data

## 📝 Files

- **Cron config:** `/vercel.json`
- **Cron endpoint:** `/app/api/cron/cache-refresh/route.js`
- **Warmup logic:** `/app/api/warmup-cache/route.js`
- **Token service:** `/lib/token-service-kv.js`
- **Cache functions:** `/lib/kv-cache.js`
