# Casa Vistas - API Contracts

## Overview

Casa Vistas exposes several Next.js API routes that handle availability checking, pricing quotes, and checkout handoff. All routes are located in `app/api/`.

## Authentication

Most internal API routes do not require authentication from the client. However, routes that call Guesty use the centralized token service (`lib/token-service-kv.js`) for OAuth authentication.

---

## Availability API

### GET /api/availability

Fetches raw availability data from Guesty for a date range.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |

**Response:**
```json
{
  "data": [
    {
      "date": "2025-01-15",
      "status": "available",
      "minNights": 3
    },
    {
      "date": "2025-01-16",
      "status": "booked"
    }
  ]
}
```

**Status Values:** `available`, `booked`, `blocked`

---

### GET /api/calendar

Fetches calendar data with caching support.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | number | Yes | Year (e.g., 2025) |
| month | number | Yes | Month (1-12) |

**Response:** Same structure as availability API, cached for 15 minutes.

---

## Pricing API

### POST /api/quotes

Gets a pricing quote for specified dates and guest count.

**Request Body:**
```json
{
  "checkIn": "2025-02-01",
  "checkOut": "2025-02-05",
  "guests": 2,
  "coupon": "FRIENDS25"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| checkIn | string | Yes | Check-in date (YYYY-MM-DD) |
| checkOut | string | Yes | Check-out date (YYYY-MM-DD) |
| guests | number | No | Number of guests (default: 2) |
| coupon | string | No | Discount code |

**Response:**
```json
{
  "rates": {
    "ratePlans": [{
      "money": {
        "hostPayout": 1250.00,
        "totalTaxes": 150.00,
        "totalPrice": 1400.00
      },
      "days": [
        {"date": "2025-02-01", "price": 350},
        {"date": "2025-02-02", "price": 350},
        {"date": "2025-02-03", "price": 275},
        {"date": "2025-02-04", "price": 275}
      ]
    }]
  },
  "money": {
    "hostPayout": 1250.00,
    "totalTaxes": 150.00,
    "totalPrice": 1400.00
  }
}
```

**Caching:** Results cached for 24 hours (unless coupon is provided).

---

### GET /api/pricing/monthly

Fetches per-day pricing for all available dates in a month.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | number | Yes | Year |
| month | number | Yes | Month (1-12) |

---

### GET /api/pricing/monthly-cached

Same as above but checks Redis cache first.

---

## Checkout API

### GET /api/handoff

Handles the checkout handoff flow with lead capture and branded interstitial.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| checkIn | string | Yes | Check-in date |
| checkOut | string | Yes | Check-out date |
| adults | number | No | Guest count (default: 2) |
| propertyId | string | No | Property ID (uses env default) |
| experiences | string | No | Comma-separated experience IDs |
| promo | string | No | Promo code to display |
| name | string | No | Guest name (triggers notification) |
| email | string | No | Guest email (triggers notification) |

**Response Flow:**

1. **If name/email missing:** Returns HTML lead capture form
2. **If name/email provided:**
   - Sends Pushover notification
   - Returns HTML interstitial page
   - Interstitial redirects to Blue Zone Guesty checkout

**Redirect URL Format:**
```
https://bluezoneexperience.guestybookings.com/en/properties/{propertyId}
  ?minOccupancy={adults}
  &checkIn={checkIn}
  &checkOut={checkOut}
```

---

## Cache Management API

### GET /api/warmup-cache

Preloads 6 months of availability and pricing data into Redis cache.

**Response:**
```json
{
  "success": true,
  "months_cached": 6,
  "duration_ms": 45000
}
```

---

### GET /api/cron/cache-refresh

Triggered by Vercel Cron (2 AM UTC daily). Refreshes all cached data.

**Note:** This endpoint is protected by Vercel's cron authentication.

---

## Experience API

### POST /api/experience-inquiry

Captures guest interest in experiences.

**Request Body:**
```json
{
  "experienceId": "private-chef",
  "name": "John Doe",
  "email": "john@example.com",
  "checkIn": "2025-02-01",
  "checkOut": "2025-02-05",
  "message": "Interested in the tasting menu"
}
```

---

## Seasonal Promotion APIs

### POST /api/seasonal-inquiry

Creates a seasonal discount inquiry with unique code.

### GET /api/seasonal-verify

Verifies a seasonal discount code.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| code | string | Yes | Discount code to verify |

### POST /api/seasonal-use

Marks a seasonal code as used.

### POST /api/seasonal-approve

Admin approval for seasonal discount (requires validation).

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing the issue"
}
```

**HTTP Status Codes:**
- `400` - Bad Request (missing/invalid parameters)
- `500` - Internal Server Error (Guesty API failure, etc.)

---

## Rate Limiting

**Guesty OAuth Token:** Limited to 3 requests per 24 hours. The token service caches tokens to prevent hitting this limit.

**Cache Invalidation:** Cache is refreshed nightly at 2 AM UTC and can be manually triggered via `/api/warmup-cache`.
