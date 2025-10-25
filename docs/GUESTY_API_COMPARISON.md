# Guesty APIs: Complete Comparison

## The Two APIs

Guesty has **TWO separate APIs** with different purposes:

### 1. Booking Engine API (BE-API) ⭐ **THIS IS WHAT WE USE**
- **Purpose**: Build direct booking websites
- **Docs**: https://booking-api-docs.guesty.com/
- **Base URL**: `https://booking.guesty.com/api/`
- **Auth**: OAuth 2.0 (client credentials)
- **Rate Limits**: Higher (designed for public-facing websites)

### 2. Open API
- **Purpose**: Property management integrations, backend operations
- **Docs**: https://open-api-docs.guesty.com/
- **Base URL**: `https://open-api.guesty.com/v1/`
- **Auth**: API Key or OAuth 2.0
- **Rate Limits**: Lower (designed for backend systems)

## Key Differences

| Feature | Booking Engine API | Open API |
|---------|-------------------|----------|
| **Use Case** | Direct booking websites | Property management tools |
| **Rate Limits** | Higher | Lower |
| **Endpoints** | Booking-focused | Full property management |
| **Calendar** | ✅ Yes (`/listings/{id}/calendar`) | ✅ Yes (`/availability-pricing/api/calendar/listings/{id}`) |
| **Quotes** | ✅ Yes | ✅ Yes (different format) |
| **Reservations** | ✅ Instant booking | ✅ Full CRUD operations |
| **Listings** | ✅ Read-only | ✅ Full CRUD operations |
| **Pricing** | ✅ Quote-based | ✅ Direct pricing API |
| **Guests** | ✅ Basic info | ✅ Full guest management |
| **Communications** | ❌ No | ✅ Yes |
| **Tasks** | ❌ No | ✅ Yes |
| **Accounting** | ❌ No | ✅ Yes |

## What We Should Use

### For Casa Vistas Direct Booking Website:

**✅ USE: Booking Engine API**

We should use BE-API for:
- ✅ **Calendar/Availability**: `GET /api/listings/{id}/calendar?from={date}&to={date}`
- ✅ **Create Quotes**: `POST /api/reservations/quotes`
- ✅ **Instant Booking**: `POST /api/reservations/quotes/{quoteId}/instant`
- ✅ **Inquiry Booking**: `POST /api/reservations/quotes/{quoteId}/inquiry`

**❌ DON'T USE: Open API**

We don't need Open API because:
- We're building a booking website, not a property management tool
- BE-API has everything we need
- BE-API has higher rate limits for public websites
- Simpler authentication and endpoints

## Calendar Endpoint (The One You Found!)

**Booking Engine API Calendar:**
```
GET https://booking.guesty.com/api/listings/{listingId}/calendar?from=2025-11-01&to=2026-01-31
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "date": "2025-11-01",
    "status": "available",  // or "booked" or "unavailable"
    "price": 150.00,
    "minNights": 7,
    "currency": "USD"
  },
  {
    "date": "2025-11-02",
    "status": "booked",
    "price": 150.00,
    "minNights": 7,
    "currency": "USD"
  },
  // ... one object per day
]
```

This is **exactly what we need** for the calendar!

## Our Implementation Plan

### ✅ Current (What We Have)
- OAuth token retrieval
- Quote creation
- Instant booking tested

### 🔧 Fix Now (Use Calendar API)
Replace the quote-testing approach with the proper calendar endpoint:

```javascript
// OLD WAY (inefficient - testing quotes for every date range)
for (let day = 1; day <= daysInMonth; day += 7) {
  // Test quote creation...
}

// NEW WAY (efficient - one API call per month)
const response = await fetch(
  `/api/calendar?listingId=${listingId}&from=${monthStart}&to=${monthEnd}`
);
const days = await response.json();
const blockedDates = days
  .filter(d => d.status !== 'available')
  .map(d => d.date);
```

### 📋 Next Steps
1. Create `/api/calendar/route.js` endpoint
2. Update `BookingCalendar.jsx` to use calendar API
3. Build payment flow
4. Deploy

## Authentication Comparison

### Booking Engine API (What We Use)
```bash
POST https://booking.guesty.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
scope=booking_engine:api
client_id=YOUR_CLIENT_ID
client_secret=YOUR_CLIENT_SECRET
```

### Open API (We Don't Use This)
```bash
POST https://open-api.guesty.com/oauth2/token
# OR
GET https://open-api.guesty.com/v1/listings
Authorization: Bearer {API_KEY}
```

## Rate Limits

### Booking Engine API
- **Higher limits** for public-facing websites
- Designed for many concurrent users
- Token renewal: 3 times per 24 hours

### Open API
- **Lower limits** for backend operations
- Designed for periodic syncs
- More restrictive

## Summary

**For Casa Vistas:**
- ✅ **Use Booking Engine API exclusively**
- ✅ **Use calendar endpoint** for availability
- ✅ **Use quote endpoint** for pricing
- ✅ **Use instant booking** for reservations
- ❌ **Don't use Open API** (it's for property management tools)

The Booking Engine API has everything we need and is specifically designed for direct booking websites like ours.

## Resources

- **Booking Engine API Docs**: https://booking-api-docs.guesty.com/
- **Calendar Endpoint**: https://booking-api-docs.guesty.com/reference/getcalendarbylistingid
- **Quote Flow**: https://booking-api-docs.guesty.com/docs/new-reservation-creation-flow
- **Quick Start**: https://booking-api-docs.guesty.com/docs/quick-start
