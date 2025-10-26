# Environment Variables - For v0

## ❌ IGNORE These (v0 is guessing wrong)

v0 may ask for these - **we don't use them**:
- ❌ `GUESTY_SEARCH_URL`
- ❌ `GUESTY_API_KEY` 
- ❌ `GUESTY_API_SECRET`
- ❌ `GUESTY_BOOKING_URL`
- ❌ `__TMP_TOKEN`
- ❌ `GUESTY_QUOTES_URL`
- ❌ `GUESTY_INSTANT_URL`
- ❌ `GUESTY_INQUIRY_URL`

## ✅ What We Actually Use

We use **OAuth2 Client Credentials** flow, not API keys. Here are the ONLY 6 env vars needed:

```bash
GUESTY_BASE_URL=https://booking.guesty.com/api
GUESTY_CLIENT_ID=0oar5x3tmjD6hF3Ay5d7
GUESTY_CLIENT_SECRET=Za1CCofPzDMsOrTuuoU76hwxoYZHNDMpP1-zw7prUuLE8OxTOLhk4Vutea9kYO9J
GUESTY_OAUTH_TOKEN_URL=https://booking.guesty.com/oauth2/token
GUESTY_PROPERTY_ID=688a8aae483ff0001243e891
GUESTY_OAUTH_SCOPE=booking_engine:api
```

## How Our API Works

### Backend API Routes (already built)

1. **Get Calendar Availability**
   ```
   GET /api/calendar?listingId={id}&from={date}&to={date}
   ```
   - Returns: Array of dates with status (available/blocked)

2. **Create Quote**
   ```
   POST /api/quotes
   Body: { listingId, checkInDateLocalized, checkOutDateLocalized, adults, children, currency }
   ```
   - Returns: Quote object with pricing

3. **Create Booking** (to be built)
   ```
   POST /api/bookings
   Body: { quoteId, guest, ccToken }
   ```
   - Returns: Reservation with confirmation code

### Frontend Components (already built)

- `BookingCalendar.jsx` - Fetches from `/api/calendar`
- `PaymentPage` - Will call `/api/bookings`

## For v0: What to Tell It

**"Don't worry about environment variables or API calls. The backend API routes are already built and working:**

- **Calendar data**: `fetch('/api/calendar?listingId=688a8aae483ff0001243e891&from=2025-11-01&to=2025-11-30')`
- **Quote/pricing**: `fetch('/api/quotes', { method: 'POST', body: {...} })`
- **Booking**: `fetch('/api/bookings', { method: 'POST', body: {...} })`

**Just design the UI components. The API integration is done."**

## Token Management

We have a centralized token service (`lib/token-service.js`) that:
- ✅ Caches tokens in memory and file
- ✅ Refreshes automatically when expired
- ✅ Prevents rate limiting
- ✅ Used by all API routes

**v0 doesn't need to know about this - it's all handled server-side.**

## Summary for v0

Tell v0:

> "The Guesty API integration is complete. All API calls go through Next.js API routes:
> - `/api/calendar` - availability
> - `/api/quotes` - pricing  
> - `/api/bookings` - reservations
> 
> Environment variables are already set in Vercel. Just design the frontend UI components that call these endpoints. No need to handle OAuth, tokens, or direct Guesty API calls."
