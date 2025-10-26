# Token Safety Verification

## ✅ Current Token Status
- **Expires:** 2025-10-26 22:35:43 UTC
- **Valid for:** ~15 hours
- **Stored in:** Redis (guesty:token key)
- **Buffer:** 60 seconds before expiry

## 🔒 Safety Mechanisms

### 1. Triple-Layer Caching
```
Request → In-Memory Cache → Redis Cache → Fetch New (ONLY if expired)
```

### 2. Expiry Checks (Multiple Layers)
- **kv-cache.js getCachedToken()**: Checks `expires_at > now + 60`
- **token-service-kv.js isTokenValid()**: Checks `expires_at > now + 60`
- **token-service-kv.js getCachedToken()**: Checks both memory and Redis

### 3. Defensive Programming
- ✅ Returns `null` if token missing
- ✅ Returns `null` if token structure invalid
- ✅ Returns `null` if token expired
- ✅ Returns `null` if token expiring within 60 seconds
- ✅ Logs every decision point

## 🚨 When Token Fetch Happens

**fetchNewToken() is ONLY called when:**
1. No token in memory cache
2. No token in Redis cache
3. Token in cache but expired (< 60 seconds left)

## 📊 Token Flow Diagram

```
API Request
    ↓
getCachedToken() in token-service-kv.js
    ↓
Check memory cache (fast)
    ↓ (miss or expired)
getTokenFromCache() in kv-cache.js
    ↓
Check Redis
    ↓ (miss or expired)
fetchNewToken() ⚠️  RATE LIMITED!
    ↓
Store in Redis (with TTL)
    ↓
Store in memory
    ↓
Return token
```

## 🧪 Test Commands

### Check current token in Redis:
```bash
# This should return the token with ~15 hours left
curl https://casao.vercel.app/api/calendar?from=2025-11-01&to=2025-11-30
# Look for log: "✅ Using Redis cached token (valid for X hours)"
```

### Verify no new token requests:
```bash
# Run this multiple times - should NEVER see "FETCHING NEW TOKEN"
for i in {1..5}; do
  curl -s https://casao.vercel.app/api/calendar?from=2025-11-01&to=2025-11-30 > /dev/null
  echo "Request $i complete"
  sleep 1
done
```

## ⚠️  Rate Limit Protection

**Guesty Limit:** 3 token requests per 24 hours

**Our Protection:**
- Token cached for 24 hours (86400 seconds)
- Refresh starts 60 seconds before expiry
- Redis persists across all serverless instances
- In-memory cache reduces Redis calls

**Expected Token Requests:**
- **Today:** 0 (using seeded token)
- **Tomorrow:** 1 (when token expires at 22:35 UTC)
- **Per Day:** 1 maximum

## 🔍 Monitoring

Watch Vercel logs for these messages:

**✅ GOOD (Expected):**
- `✅ Using Redis cached token (valid for X hours)`
- `✓ Using in-memory cached token`

**⚠️  WARNING (Investigate):**
- `⚠️  Token in cache but expired or expiring soon`
- `❌ No token in Redis cache`

**🚨 CRITICAL (Should be rare):**
- `⚠️  ⚠️  ⚠️  FETCHING NEW TOKEN FROM GUESTY`
- Should only appear once per 24 hours

## 📝 Code Locations

- **Token Service:** `/lib/token-service-kv.js`
- **Cache Functions:** `/lib/kv-cache.js`
- **API Routes:** `/app/api/calendar/route.js`, `/app/api/quotes/route.js`

## ✅ Verification Checklist

- [x] Token stored in Redis with TTL
- [x] getCachedToken checks expiry before returning
- [x] In-memory cache has expiry check
- [x] fetchNewToken has rate limit warning
- [x] All cache misses return null (not throw)
- [x] Token valid for 15+ hours
- [x] No duplicate token fetching logic
