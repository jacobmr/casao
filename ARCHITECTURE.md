# Casa Vistas - Technical Architecture & Product Documentation

**Version:** 1.0  
**Last Updated:** November 30, 2025  
**Production URL:** https://www.casavistas.net  
**Staging URL:** https://casao.vercel.app

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Technical Stack](#technical-stack)
3. [Architecture](#architecture)
4. [Key Features](#key-features)
5. [API Endpoints](#api-endpoints)
6. [Data Flow](#data-flow)
7. [Caching Strategy](#caching-strategy)
8. [Deployment](#deployment)
9. [Environment Variables](#environment-variables)
10. [File Structure](#file-structure)
11. [Development Guide](#development-guide)

---

## Product Overview

### Purpose
Casa Vistas is a direct booking website for a luxury vacation rental property in Brasilito, Costa Rica. The site enables guests to:
- View real-time availability and pricing
- Select dates and see live quotes
- Add optional experiences (tours, chef services, etc.)
- Complete bookings through a branded handoff to the property manager's Guesty checkout

### Business Model
- **Property Owner:** Casa O (brand)
- **Property Manager:** Blue Zone Experience (manages Guesty, Stripe, contracts)
- **Booking Flow:** Casa O → Branded Handoff → Blue Zone Guesty Checkout
- **Revenue:** Direct bookings reduce OTA commissions

### Key Differentiators
- ✅ White-label branding (Casa Vistas, not Blue Zone)
- ✅ Real-time availability from Guesty API
- ✅ Per-day pricing display
- ✅ Experience upsells with automatic discounts
- ✅ Seamless handoff to property manager's checkout
- ✅ No GuestyPay credentials needed (PM handles payment)

---

## Technical Stack

### Frontend
- **Framework:** Next.js 16.0.0 (App Router)
- **React:** 19.2.0
- **UI Library:** Radix UI + shadcn/ui components
- **Styling:** Tailwind CSS 4.1.9
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation
- **Carousel:** Embla Carousel

### Backend
- **Runtime:** Node.js (Next.js API Routes)
- **API Integration:** Guesty Booking Engine API
- **Authentication:** OAuth 2.0 (client credentials flow)
- **Caching:** Vercel KV (Redis)
- **Analytics:** Vercel Analytics

### Infrastructure
- **Hosting:** Vercel (serverless)
- **Domain:** casavistas.net (Vercel DNS)
- **SSL:** Automatic (Vercel)
- **CDN:** Vercel Edge Network

### External Services
- **Guesty:** Property management system (availability, pricing, bookings)
- **Blue Zone Guesty:** Checkout page (payment, contracts, confirmation)

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Casa Vistas Website                       │
│                      (casavistas.net)                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─► Home Page (/)
             │   └─► Hero Carousel
             │   └─► Property Highlights
             │   └─► Availability Calendar (modal)
             │   └─► Amenities Grid
             │   └─► Property Details
             │   └─► Trust Signals
             │
             ├─► Booking Page (/booking)
             │   └─► Calendar with visual indicators
             │   └─► Date selection
             │   └─► Pricing display
             │   └─► "Continue to Checkout" button
             │
             ├─► Enhance Page (/enhance)
             │   └─► Experience selection
             │   └─► Discount calculation (2+ = 5% off lodging)
             │   └─► "Continue to Checkout" button
             │
             └─► Handoff Endpoint (/api/handoff)
                 └─► Branded interstitial page
                 └─► UUID tracking
                 └─► Redirect to Blue Zone Guesty
                     └─► https://bluezoneexperience.guestybookings.com/...
                         └─► Payment (Stripe)
                         └─► Contract signing
                         └─► Confirmation email
```

### System Architecture

```
┌──────────────────┐
│   Browser        │
│   (Guest)        │
└────────┬─────────┘
         │
         ├─► Next.js Frontend (React)
         │   └─► Components (UI)
         │   └─► Pages (Routes)
         │
         ├─► Next.js API Routes (Backend)
         │   ├─► /api/calendar (availability)
         │   ├─► /api/quotes (pricing)
         │   ├─► /api/handoff (redirect)
         │   └─► /api/warmup-cache (preload)
         │
         ├─► Vercel KV (Redis Cache)
         │   ├─► Availability data (6 months)
         │   ├─► Pricing data (6 months)
         │   └─► OAuth tokens (24h TTL)
         │
         └─► Guesty Booking Engine API
             ├─► OAuth 2.0 (token endpoint)
             ├─► Calendar API (availability)
             ├─► Quotes API (pricing)
             └─► Reservations API (future)
```

---

## Key Features

### 1. Real-Time Availability Calendar

**Location:** Home page (modal) and `/booking` page

**Features:**
- Fetches 6 months of availability from Guesty
- Visual indicators:
  - **Green border:** Available dates
  - **Pink background:** Booked/unavailable dates
  - **Blue background:** Selected dates
- Date range selection
- Minimum stay validation
- Past date blocking

**Components:**
- `components/availability-calendar.tsx` (home page modal)
- `components/booking-calendar.tsx` (booking page)

**API:**
- `GET /api/calendar?listingId={id}&from={date}&to={date}`
- Returns: Array of `{date, status, minNights}`

---

### 2. Live Pricing Display

**Location:** Calendar modals and booking page

**Features:**
- Per-day pricing on calendar dates
- Total price calculation
- Breakdown: Accommodation + Taxes & Fees
- Nightly average display
- Weekly discount (7+ nights)

**Components:**
- `components/availability-calendar.tsx` (pricing display)
- `components/booking-calendar.tsx` (pricing display)

**API:**
- `POST /api/quotes`
- Body: `{checkIn, checkOut, guests, coupon?}`
- Returns: Quote object with pricing breakdown

---

### 3. Experience Upsells

**Location:** `/enhance` page (between date selection and checkout)

**Features:**
- Curated experiences by category:
  - 🏄 Adventures (surfing, zip-lining, etc.)
  - 🍽️ Dining (private chef, restaurants)
  - 🚗 Transportation (airport pickup, car rental)
  - 💆 Wellness (spa, yoga, massage)
  - 🏖️ Beach & Water (snorkeling, boat tours)
- Automatic discount: 2+ experiences = 5% off lodging
- Multi-select with visual feedback
- Price estimates and descriptions

**Components:**
- `app/enhance/page.tsx`
- `components/experiences/experience-list-item.tsx`
- `components/experiences/discount-banner.tsx`

**Data:**
- `lib/experiences-data.ts` (static data)

---

### 4. Branded Checkout Handoff

**Location:** `/api/handoff` endpoint

**Purpose:** Seamlessly transition from Casa Vistas branding to Blue Zone checkout

**Flow:**
1. Guest clicks "Continue to Checkout"
2. Redirects to `/api/handoff?checkIn=...&checkOut=...&adults=...&experiences=...`
3. Shows branded interstitial page:
   - Casa Vistas logo
   - "You're Almost There!" message
   - Selected experiences summary
   - Discount notification (if applicable)
   - Booking reference UUID
   - "Continue to Secure Checkout →" button
4. Redirects to Blue Zone Guesty:
   - `https://bluezoneexperience.guestybookings.com/en/properties/{id}/checkout?checkIn=...&checkOut=...&adults=...&utm_source=casao&ref={uuid}`

**Benefits:**
- Maintains Casa Vistas branding throughout journey
- Tracks bookings with UUID
- No GuestyPay credentials needed
- PM keeps existing Stripe + contract workflow

**Implementation:**
- `app/api/handoff/route.js`

---

### 5. Redis Cache with Warmup

**Purpose:** Reduce API calls to Guesty and improve performance

**Strategy:**
- **Availability:** Cached for 6 months, refreshed nightly
- **Pricing:** Cached for 6 months, refreshed nightly
- **Tokens:** Cached for 24 hours, auto-refresh

**Cache Keys:**
- `availability:{year}-{month}` → Array of day objects
- `pricing:{year}-{month}` → Object of `{date: price}`
- `guesty:token` → OAuth access token

**Warmup:**
- Manual trigger: `GET /api/warmup-cache`
- Automated: Vercel Cron (nightly at 2 AM UTC)
- Preloads 6 months of data on first request

**Implementation:**
- `lib/kv-cache.js` (cache utilities)
- `lib/token-service-kv.js` (token management)
- `app/api/warmup-cache/route.js` (warmup endpoint)
- `app/api/cron/cache-refresh/route.js` (nightly refresh)

---

## API Endpoints

### Public Endpoints

#### `GET /api/calendar`
Fetch availability for a date range.

**Query Params:**
- `listingId` (optional, defaults to env var)
- `from` (required, YYYY-MM-DD)
- `to` (required, YYYY-MM-DD)
- `skipCache` (optional, boolean)

**Response:**
```json
[
  {
    "date": "2025-11-03",
    "status": "available",
    "minNights": 3,
    "cta": false,
    "ctd": false
  },
  {
    "date": "2025-11-26",
    "status": "booked",
    "minNights": 3,
    "cta": false,
    "ctd": false
  }
]
```

---

#### `POST /api/quotes`
Get pricing quote for a date range.

**Body:**
```json
{
  "checkIn": "2025-11-03",
  "checkOut": "2025-11-07",
  "guests": 2,
  "coupon": "OPTIONAL_CODE"
}
```

**Response:**
```json
{
  "rates": {
    "ratePlans": [{
      "ratePlan": {
        "money": {
          "fareAccommodation": 1800.00,
          "totalTaxes": 234.00,
          "hostPayout": 2034.00
        }
      }
    }]
  }
}
```

---

#### `GET /api/handoff`
Branded checkout handoff page.

**Query Params:**
- `checkIn` (required, YYYY-MM-DD)
- `checkOut` (required, YYYY-MM-DD)
- `adults` (required, number)
- `propertyId` (optional, defaults to env var)
- `experiences` (optional, comma-separated IDs)

**Response:** HTML page with redirect

---

### Internal Endpoints

#### `GET /api/warmup-cache`
Pre-populate cache with 6 months of data.

**Response:**
```json
{
  "success": true,
  "message": "Cache warmup completed",
  "results": [
    {"month": "2025-10", "status": "success", "daysCount": 30, "pricesCount": 0},
    {"month": "2025-11", "status": "success", "daysCount": 31, "pricesCount": 7}
  ]
}
```

---

#### `GET /api/cron/cache-refresh`
Nightly cache refresh (Vercel Cron).

**Trigger:** Automated at 2 AM UTC  
**Auth:** Vercel Cron secret

---

## Data Flow

### Booking Flow (Complete Journey)

```
1. Guest visits casavistas.net
   ↓
2. Views property details and photos
   ↓
3. Clicks "Check Availability" button
   ↓
4. Modal opens with calendar
   ├─► Fetches availability: GET /api/calendar
   ├─► Fetches pricing: GET /api/pricing/monthly-cached
   └─► Displays visual indicators (green/pink)
   ↓
5. Guest selects dates (e.g., Nov 3-7)
   ├─► Validates date range
   └─► Fetches quote: POST /api/quotes
   ↓
6. Pricing displayed in booking summary
   ├─► Accommodation: $1,800
   ├─► Taxes & Fees: $234
   └─► Total: $2,034
   ↓
7. Guest clicks "Book This!"
   ├─► Verifies availability (real-time check)
   └─► Redirects to /enhance?checkIn=...&checkOut=...&guests=2
   ↓
8. Enhance page shows experiences
   ├─► Guest selects 2+ experiences
   └─► 5% discount banner appears
   ↓
9. Guest clicks "Continue to Checkout"
   └─► Redirects to /api/handoff?checkIn=...&checkOut=...&adults=2&experiences=surf,chef
   ↓
10. Handoff page displays
    ├─► Casa Vistas branding
    ├─► Booking reference: UUID
    ├─► Selected experiences summary
    └─► "Continue to Secure Checkout →" button
    ↓
11. Redirects to Blue Zone Guesty
    └─► https://bluezoneexperience.guestybookings.com/en/properties/688a8aae483ff0001243e891/checkout?checkIn=2025-11-03&checkOut=2025-11-07&adults=2&utm_source=casao&ref={uuid}
    ↓
12. Guest completes payment on Blue Zone
    ├─► Stripe payment
    ├─► Contract signing
    └─► Confirmation email
    ↓
13. Booking complete!
```

---

## Caching Strategy

### Why Cache?

**Problem:** Guesty API has rate limits and slow response times  
**Solution:** Redis cache with 6-month preload

### Cache Layers

#### 1. Availability Cache
- **Key:** `availability:{year}-{month}`
- **TTL:** 24 hours (refreshed nightly)
- **Data:** Array of day objects with status
- **Size:** ~30-31 days per month × 6 months = ~180 days

#### 2. Pricing Cache
- **Key:** `pricing:{year}-{month}`
- **TTL:** 24 hours (refreshed nightly)
- **Data:** Object mapping dates to prices
- **Size:** Variable (only available dates have prices)

#### 3. Token Cache
- **Key:** `guesty:token`
- **TTL:** 24 hours (auto-refresh 5 min before expiry)
- **Data:** OAuth access token
- **Rate Limit Protection:** Max 3 token requests per 24h

### Cache Refresh

**Nightly Cron Job:**
- Runs at 2 AM UTC (Vercel Cron)
- Fetches fresh data from Guesty
- Updates Redis cache
- Logs success/failure

**Manual Warmup:**
```bash
curl https://www.casavistas.net/api/warmup-cache
```

---

## Deployment

### Production

**Platform:** Vercel  
**URL:** https://www.casavistas.net  
**Branch:** `main`  
**Build Command:** `npm run build`  
**Output Directory:** `.next`

**Environment Variables:** (see below)

### Staging

**URL:** https://casao.vercel.app  
**Branch:** `main` (same as production)

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Guesty credentials

# Start dev server
npm run dev

# Visit http://localhost:3000
```

### Vercel Cron Setup

**File:** `vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/cache-refresh",
    "schedule": "0 2 * * *"
  }]
}
```

**Schedule:** Daily at 2 AM UTC

---

## Environment Variables

### Required

```bash
# Guesty OAuth
GUESTY_CLIENT_ID=your_client_id
GUESTY_CLIENT_SECRET=your_client_secret
GUESTY_OAUTH_TOKEN_URL=https://your-okta-domain/oauth2/your-auth-server/v1/token
GUESTY_BASE_URL=https://booking.guesty.com/api

# Property
GUESTY_PROPERTY_ID=688a8aae483ff0001243e891

# Vercel KV (auto-configured on Vercel)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### Optional

```bash
# Cron authentication
CRON_SECRET=your_secret_key

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...
```

### Local Development

Create `.env.local`:
```bash
GUESTY_CLIENT_ID=...
GUESTY_CLIENT_SECRET=...
GUESTY_OAUTH_TOKEN_URL=...
GUESTY_BASE_URL=https://booking.guesty.com/api
GUESTY_PROPERTY_ID=688a8aae483ff0001243e891

# For local Redis (optional)
# KV_URL=redis://localhost:6379
```

---

## File Structure

```
casa-vistas/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── calendar/route.js     # Availability endpoint
│   │   ├── quotes/route.js       # Pricing endpoint
│   │   ├── handoff/route.js      # Checkout handoff
│   │   ├── warmup-cache/route.js # Cache preload
│   │   └── cron/
│   │       └── cache-refresh/route.js  # Nightly refresh
│   ├── booking/page.tsx          # Booking page
│   ├── enhance/page.tsx          # Experience selection
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
│
├── components/                   # React Components
│   ├── availability-calendar.tsx # Home page calendar (modal)
│   ├── booking-calendar.tsx      # Booking page calendar
│   ├── hero-carousel.tsx         # Hero image carousel
│   ├── amenities-grid.tsx        # Amenities display
│   ├── property-details.tsx      # Property info
│   ├── trust-signals.tsx         # Social proof
│   ├── footer.tsx                # Footer
│   ├── navigation.tsx            # Header nav
│   ├── experiences/              # Experience components
│   │   ├── experience-list-item.tsx
│   │   └── discount-banner.tsx
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── lib/                          # Utilities
│   ├── kv-cache.js               # Redis cache utilities
│   ├── token-service-kv.js       # OAuth token management
│   ├── pricing-fetcher.js        # Pricing utilities
│   ├── experiences-data.ts       # Experience definitions
│   └── utils.ts                  # Helper functions
│
├── public/                       # Static assets
│   └── images/                   # Property photos
│
├── .env.local                    # Local environment variables (gitignored)
├── .env.example                  # Example environment variables
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
├── next.config.mjs               # Next.js config
├── vercel.json                   # Vercel config (cron jobs)
└── README.md                     # Project documentation
```

---

## Development Guide

### Adding a New Feature

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes:**
   - Add components in `components/`
   - Add pages in `app/`
   - Add API routes in `app/api/`
   - Add utilities in `lib/`

3. **Test locally:**
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add: your feature description"
   git push origin feature/your-feature-name
   ```

5. **Deploy to Vercel:**
   - Merge to `main` branch
   - Vercel auto-deploys

### Common Tasks

#### Trigger Cache Warmup
```bash
curl https://www.casavistas.net/api/warmup-cache
```

#### Clear Redis Cache
```bash
# In Vercel dashboard:
# Storage → KV → Delete keys matching pattern
```

#### Update Experiences
Edit `lib/experiences-data.ts`:
```typescript
export const experiences: Experience[] = [
  {
    id: "new-experience",
    name: "New Experience",
    category: "adventures",
    description: "Description here",
    price: "$100",
    duration: "2 hours",
    highlights: ["Point 1", "Point 2"]
  }
]
```

#### Add New API Endpoint
Create `app/api/your-endpoint/route.js`:
```javascript
import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({ message: "Hello" });
}
```

---

## Future Enhancements

### Planned Features (See ROADMAP.md)

1. **AI Concierge Chatbot**
   - OpenAI/Anthropic integration
   - Context-aware responses
   - Service booking assistance
   - Multi-language support

2. **White-Label Booking**
   - Full booking flow on casavistas.net
   - GuestyPay integration (when credentials available)
   - Instant confirmation
   - Email receipts

3. **Guest Portal**
   - View booking details
   - Add/modify services
   - Access property info
   - Pre-arrival checklist

4. **Analytics Dashboard**
   - Booking conversion rates
   - Popular experiences
   - Revenue tracking
   - Guest demographics

---

## Troubleshooting

### Calendar Not Loading

**Symptom:** Calendar shows "Loading..." indefinitely

**Causes:**
1. Redis cache empty
2. Guesty API down
3. Invalid OAuth token

**Solutions:**
```bash
# 1. Trigger cache warmup
curl https://www.casavistas.net/api/warmup-cache

# 2. Check Vercel logs for errors
# Vercel Dashboard → Deployments → Logs

# 3. Verify environment variables
# Vercel Dashboard → Settings → Environment Variables
```

### Pricing Not Displaying

**Symptom:** Calendar dates show no prices

**Causes:**
1. Monthly pricing cache empty
2. Pricing fetcher error

**Solutions:**
```bash
# Trigger warmup (includes pricing)
curl https://www.casavistas.net/api/warmup-cache

# Check logs for pricing errors
```

### Handoff Redirect Fails

**Symptom:** "Sorry, an error has occurred" on Guesty page

**Causes:**
1. Wrong Guesty URL
2. Invalid property ID
3. Malformed query params

**Solutions:**
- Verify `GUESTY_PROPERTY_ID` in environment variables
- Check handoff URL format in `app/api/handoff/route.js`
- Ensure using Blue Zone URL: `https://bluezoneexperience.guestybookings.com/...`

---

## Support

### Documentation
- **README.md:** Quick start guide
- **ROADMAP.md:** Feature roadmap
- **CasaO-Booking-API-PRD.md:** Product requirements
- **This file:** Complete architecture reference

### Logs
- **Vercel Dashboard:** Real-time logs and errors
- **Browser Console:** Frontend errors
- **Server Logs:** API endpoint logs

### Contact
- **Developer:** [Your contact info]
- **Property Manager:** Blue Zone Experience

---

**Last Updated:** November 30, 2025  
**Version:** 1.0
