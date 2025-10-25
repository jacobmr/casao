# Token Service - Centralized OAuth Management

## 🎯 Purpose

Prevents rate limit issues by ensuring ALL code uses a single, cached OAuth token.

## ⚠️ Critical Rules

1. **NEVER fetch tokens directly** - always use `getCachedToken()`
2. **NEVER create your own token logic** - use the service
3. **Token is cached for 24 hours** - don't worry about expiry

## 📍 Location

`/lib/token-service.js`

## 🔧 Usage

```javascript
import { getCachedToken } from './lib/token-service';

// In any API route or server component
const token = await getCachedToken();

// Use token for Guesty API calls
const response = await fetch('https://booking.guesty.com/api/...', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
});
```

## 💾 How It Works

### Three-Level Caching

1. **In-Memory Cache** (fastest)
   - Stored in process memory
   - Lost on server restart
   - Checked first

2. **File Cache** (persistent)
   - Stored in `.cache/guesty-token.json`
   - Survives server restarts
   - Checked if memory cache empty

3. **Fresh Token** (fallback)
   - Only fetched if both caches expired
   - Automatically updates both caches
   - Rate limited by Guesty (3 per 24 hours)

### Cache File Format

```json
{
  "access_token": "eyJ...",
  "expires_at": 1730000000,
  "cached_at": 1729900000,
  "expires_in_hours": 24
}
```

## 🛡️ Rate Limit Protection

Guesty allows **3 token requests per 24 hours**. The service prevents this by:

- ✅ Caching tokens for 24 hours
- ✅ Checking cache before fetching
- ✅ Refreshing 60 seconds before expiry
- ✅ Sharing cache across all code

## 📊 Token Info (Debugging)

```javascript
import { getTokenInfo } from './lib/token-service';

const info = getTokenInfo();
console.log(info);
// {
//   cached: true,
//   valid: true,
//   expiresAt: "2025-10-26T22:00:00.000Z",
//   expiresInHours: 23,
//   cachedAt: "2025-10-25T22:00:00.000Z"
// }
```

## 🔄 Force Refresh (Emergency Only)

```javascript
import { forceRefreshToken } from './lib/token-service';

// Only use if token is definitely invalid
const newToken = await forceRefreshToken();
```

⚠️ **Use sparingly!** This counts against rate limit.

## 📁 Files Using Token Service

All these files use `getCachedToken()`:

- `/app/api/calendar/route.js`
- `/app/api/quotes/route.js`
- `/lib/guesty.js`

## 🚫 What NOT To Do

```javascript
// ❌ DON'T DO THIS
const response = await fetch('https://booking.guesty.com/oauth2/token', {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.GUESTY_CLIENT_ID,
    client_secret: process.env.GUESTY_CLIENT_SECRET
  })
});

// ✅ DO THIS INSTEAD
import { getCachedToken } from './lib/token-service';
const token = await getCachedToken();
```

## 🔍 Troubleshooting

### "Token request failed: 429 Too many requests"

**Cause**: Hit rate limit (3 requests per 24 hours)

**Solution**: 
1. Wait 24 hours, OR
2. Use cached token from `.cache/guesty-token.json`
3. Ensure all code uses `getCachedToken()`

### "No token cached"

**Cause**: Cache file doesn't exist or is expired

**Solution**:
1. Run: `node scripts/get_token.js` to create cache
2. Service will auto-fetch on first request

### Token expired but cache says valid

**Cause**: System clock issue or cache corruption

**Solution**:
```bash
rm .cache/guesty-token.json
# Service will fetch new token on next request
```

## 📝 Environment Variables

Required in `.env`:

```bash
GUESTY_CLIENT_ID=your_client_id
GUESTY_CLIENT_SECRET=your_client_secret
GUESTY_OAUTH_TOKEN_URL=https://booking.guesty.com/oauth2/token
GUESTY_OAUTH_SCOPE=booking_engine:api
```

## ✅ Benefits

1. **No Rate Limits**: Single cached token shared by all code
2. **Performance**: In-memory cache = instant token access
3. **Reliability**: File cache survives restarts
4. **Simplicity**: One function to get tokens
5. **Safety**: Automatic refresh before expiry

## 🎓 Best Practices

1. Always import from `./lib/token-service`
2. Never cache tokens yourself
3. Let the service handle expiry
4. Use `getTokenInfo()` for debugging
5. Only use `forceRefreshToken()` in emergencies

---

**Remember**: One service, one cache, no rate limits! 🎉
