# Guesty API Test Results
**Date**: October 25, 2025
**Property ID**: `688a8aae483ff0001243e891`

## ✅ Working Endpoints

### 1. OAuth Token
- **URL**: `POST https://booking.guesty.com/oauth2/token`
- **Status**: ✅ Working
- **Token Expiry**: 24 hours
- **Cached**: Yes (`.cache/guesty-token.json`)
- **Rate Limit**: Can renew up to 3 times per 24 hours

### 2. Create Quote
- **URL**: `POST https://booking.guesty.com/api/reservations/quotes`
- **Status**: ✅ Working (200)
- **Required Fields**:
  ```json
  {
    "listingId": "688a8aae483ff0001243e891",
    "checkInDateLocalized": "2026-01-15",
    "checkOutDateLocalized": "2026-01-22",
    "adults": 2,
    "children": 0,
    "currency": "USD"
  }
  ```
- **Response Includes**:
  - `_id`: Quote ID
  - `rates.ratePlans[0].ratePlan._id`: Rate Plan ID (needed for booking)
  - `expiresAt`: Quote expiration (24 hours)

### 3. Instant Booking
- **URL**: `POST https://booking.guesty.com/api/reservations/quotes/{quoteId}/instant`
- **Status**: ✅ Working (200) - **Reservation Created!**
- **Required Fields**:
  ```json
  {
    "ratePlanId": "default-rateplan-id",
    "guest": {
      "firstName": "Test",
      "lastName": "Guest",
      "email": "test@example.com",
      "phone": "+11234567890"
    },
    "ccToken": "pm_..."
  }
  ```
- **Response**:
  ```json
  {
    "_id": "reservation_id",
    "status": "confirmed",
    "createdAt": "...",
    ...
  }
  ```

## ❌ Not Working / Not Available

### Search Endpoint
- **Tried**: `GET https://booking.guesty.com/api/v1/search`
- **Status**: ❌ 404 Not Found
- **Note**: May not be available in your BE API tier, or requires different path

## 🎯 Booking Mode

**Your account is configured for: INSTANT BOOKING ONLY**

- ✅ Instant bookings work
- ❌ Inquiry bookings fail with: "Inquiry is already fulfilled by a reservation"
- This means once a quote is used for instant booking, it cannot be used for inquiry

## 🔑 Important Discoveries

### 1. Domain Confusion
The official Guesty documentation references `booking-api.guesty.com` but:
- ❌ **This domain does NOT exist** (NXDOMAIN)
- ✅ **All endpoints are under**: `booking.guesty.com`

### 2. Parameter Names
- Use `checkInDateLocalized` and `checkOutDateLocalized`
- NOT `checkInDate` / `checkOutDate` (those cause validation errors)

### 3. Rate Plan Requirement
- Must extract `ratePlanId` from quote response
- Include it in both instant and inquiry booking requests

### 4. Credit Card Tokens
- Field name is `ccToken` (not `payment.token`)
- Must use Stripe SCA tokens starting with `pm_...`
- Old tokens starting with `tok_...` are NOT supported

## 📋 Next Steps for Deployment

1. **Update Environment Variables**:
   ```bash
   GUESTY_BASE_URL=https://booking.guesty.com/api
   GUESTY_CLIENT_ID=0oar5x3tmjD6hF3Ay5d7
   GUESTY_CLIENT_SECRET=Za1CCofPzDMsOrTuuoU76hwxoYZHNDMpP1-zw7prUuLE8OxTOLhk4Vutea9kYO9J
   GUESTY_OAUTH_TOKEN_URL=https://booking.guesty.com/oauth2/token
   GUESTY_PROPERTY_ID=688a8aae483ff0001243e891
   GUESTY_OAUTH_SCOPE=booking_engine:api
   ```

2. **Update `lib/guesty.js`**:
   - Fix base URL
   - Use correct parameter names (`checkInDateLocalized`)
   - Extract and use `ratePlanId` from quotes
   - Use `ccToken` field for payment tokens

3. **Implement Payment Integration**:
   - Integrate Stripe for tokenization
   - Generate `pm_...` tokens on frontend
   - Pass to instant booking endpoint

4. **Deploy to Vercel**:
   - Set environment variables in Vercel dashboard
   - Test booking flow in production
   - Monitor for rate limit issues (cache tokens!)

## 🚨 Rate Limiting

- Token endpoint has strict rate limits (hit 429 during testing)
- **Always use cached tokens** - don't fetch new ones unnecessarily
- Token cache location: `.cache/guesty-token.json`
- Tokens valid for 24 hours

## 📚 Corrected Documentation

See `docs/GUESTY_API_ENDPOINTS.md` for corrected endpoint documentation with:
- Correct domain names
- Correct parameter names
- Working examples
- Rate limit guidance
