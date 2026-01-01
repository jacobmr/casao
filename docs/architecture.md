# Casa Vistas - Architecture Documentation

## Executive Summary

Casa Vistas is a direct booking website for a luxury vacation rental property in Costa Rica. The application provides real-time availability checking, dynamic pricing, and a seamless checkout experience by integrating with the Guesty Booking Engine API.

**Production URL:** https://www.casavistas.net
**Staging URL:** https://casao.vercel.app

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | Next.js | 16.0.7 | Full-stack React framework with App Router |
| Runtime | React | 19.2.0 | UI component library |
| Language | TypeScript | 5.x | Type-safe JavaScript |
| UI Components | Radix UI | Various | Accessible component primitives |
| UI System | shadcn/ui | Latest | Pre-built component library |
| Styling | Tailwind CSS | 4.x | Utility-first CSS framework |
| Cache | Vercel KV | 3.0.0 | Redis-compatible key-value store |
| Cache (Alt) | Redis | 5.9.0 | Direct Redis client |
| Date Handling | date-fns | 4.1.0 | Date manipulation utilities |
| Form Handling | react-hook-form | 7.60.0 | Form state management |
| Validation | Zod | 3.25.76 | Schema validation |
| Analytics | Vercel Analytics | Latest | Web analytics |
| Email | Resend | 6.6.0 | Transactional email |
| Notifications | Pushover | API | Push notifications |

## Architecture Pattern

**Pattern:** Server-Side Rendered (SSR) Web Application with API Routes

The application follows a **component-based architecture** using Next.js App Router:

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    App Router                        │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │    │
│  │  │  Home Page  │ │Booking Page │ │Enhance Page │   │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    API Routes                        │    │
│  │  /api/calendar  /api/quotes  /api/handoff  /api/... │    │
│  └─────────────────────┬───────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     Backend Services                         │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   Vercel KV     │  │   Guesty API    │                   │
│  │   (Redis)       │  │  (Booking Engine)│                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Page Components

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Property showcase with hero carousel, amenities, and calendar modal |
| Booking | `/booking` | Full-page calendar with pricing summary |
| Enhance | `/enhance` | Experience upsells with 5% discount incentive |
| Friends | `/friends` | Special discount landing page |
| Seasonal | `/seasonal/*` | Seasonal promotion flows |

### 2. API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/availability` | GET | Fetch availability for date range |
| `/api/calendar` | GET | Monthly calendar data with caching |
| `/api/quotes` | POST | Get pricing quote for dates/guests |
| `/api/handoff` | GET | Checkout handoff with lead capture |
| `/api/warmup-cache` | GET | Preload 6 months of availability/pricing |
| `/api/cron/cache-refresh` | GET | Nightly cache refresh (Vercel Cron) |
| `/api/pricing/monthly` | GET | Monthly pricing data |
| `/api/pricing/monthly-cached` | GET | Cached monthly pricing |
| `/api/experience-inquiry` | POST | Experience interest capture |
| `/api/seasonal-*` | Various | Seasonal promotion endpoints |

### 3. Library Modules

| Module | Purpose |
|--------|---------|
| `lib/guesty.ts` | Guesty API client with OAuth token handling |
| `lib/token-service-kv.js` | Centralized OAuth token management with caching |
| `lib/kv-cache.js` | Redis cache utilities for availability/pricing/tokens |
| `lib/pricing-fetcher.js` | Batch pricing fetcher for monthly data |
| `lib/experiences-data.ts` | Static experience catalog and categories |
| `lib/promo-codes.ts` | Promo code definitions |
| `lib/utils.ts` | Common utility functions |

## Data Flow

### Booking Flow

```
1. Guest lands on Home Page
   └─► HeroCarousel + PropertyHighlights + AvailabilityCalendar

2. Guest selects dates in calendar modal
   └─► Fetches /api/calendar (cached availability)
   └─► Displays available dates with pricing

3. Guest clicks "Book Now"
   └─► Redirects to /booking with dates in URL params

4. Booking page shows full calendar + pricing
   └─► Fetches /api/quotes for selected dates
   └─► Shows pricing breakdown in sticky sidebar

5. Guest clicks "Continue" (minimum 3 nights)
   └─► Redirects to /enhance for experience upsells

6. Enhance page shows experience options
   └─► 2+ experiences = 5% lodging discount
   └─► Guest makes selections

7. Guest clicks "Continue to Checkout"
   └─► Hits /api/handoff endpoint

8. Handoff flow:
   a. If no name/email → Show lead capture form
   b. Capture lead → Send Pushover notification
   c. Show branded interstitial with promo code (if applicable)
   d. Redirect to Blue Zone Guesty checkout portal
```

### Caching Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    Cache Layers                               │
├──────────────────────────────────────────────────────────────┤
│ Layer 1: In-Memory (per serverless instance)                 │
│   - OAuth tokens (fastest, ~55 min TTL)                      │
├──────────────────────────────────────────────────────────────┤
│ Layer 2: Vercel KV (Redis)                                   │
│   - availability:{year}-{month} (15 min TTL)                 │
│   - pricing:{checkIn}_{checkOut}_{guests} (24h TTL)          │
│   - monthly_pricing:{year}-{month} (24h TTL)                 │
│   - guesty:token (24h TTL, refresh 60s before expiry)        │
│   - seasonal:{code} (30 day TTL)                             │
├──────────────────────────────────────────────────────────────┤
│ Cache Refresh: Vercel Cron at 2 AM UTC daily                 │
│   - Preloads 6 months of availability/pricing                │
└──────────────────────────────────────────────────────────────┘
```

## External Integrations

### Guesty Booking Engine API

- **Authentication:** OAuth 2.0 Client Credentials
- **Token URL:** Configured via `GUESTY_OAUTH_TOKEN_URL`
- **Base URL:** `https://booking.guesty.com/api`
- **Rate Limit:** 3 token requests per 24 hours (critical constraint)
- **Property ID:** Single property (`GUESTY_PROPERTY_ID`)

**Key Endpoints Used:**
- `GET /listings/{id}/availability` - Calendar availability
- `POST /reservations/quotes` - Pricing quotes
- `GET /listings/{id}` - Property details

### Checkout Handoff

The application does NOT process payments directly. Instead, it hands off to Blue Zone Experience's Guesty portal:

```
https://bluezoneexperience.guestybookings.com/en/properties/{propertyId}
  ?minOccupancy={guests}
  &checkIn={date}
  &checkOut={date}
```

### Notification Services

- **Pushover:** Push notifications for new bookings
- **Resend:** Transactional email (available, not heavily used)

### Analytics

- **Vercel Analytics:** Page views and web vitals
- **Meta Pixel:** Facebook conversion tracking
- **Google Analytics:** GA4 tracking

## Security Considerations

1. **OAuth Token Protection:** Tokens cached with TTL, never exposed to client
2. **Environment Variables:** All secrets in `.env.local` or Vercel dashboard
3. **No Direct Payment Processing:** Checkout handled by Guesty/Stripe via handoff
4. **CORS:** Next.js default CORS handling for API routes
5. **Rate Limiting:** Token service respects Guesty's 3 requests/24h limit

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Edge Network                        │  │
│  │  - Static assets (images, CSS, JS)                    │  │
│  │  - ISR pages                                          │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                 Serverless Functions                   │  │
│  │  - API routes (Node.js runtime)                       │  │
│  │  - SSR pages                                          │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                    Vercel KV                           │  │
│  │  - Redis-compatible storage                           │  │
│  │  - Automatic provisioning                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Cron Jobs:**
- `cache-refresh`: Daily at 2 AM UTC (`vercel.json`)

## Directory Structure

See [Source Tree Analysis](./source-tree-analysis.md) for detailed directory breakdown.

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/page.tsx` | Home page composition |
| `app/layout.tsx` | Root layout with providers |
| `app/booking/page.tsx` | Booking calendar page |
| `app/enhance/page.tsx` | Experience selection page |
| `app/api/handoff/route.js` | Checkout handoff with lead capture |
| `lib/token-service-kv.js` | Critical: OAuth token management |
| `lib/kv-cache.js` | Redis cache utilities |
| `components/availability-calendar.tsx` | Home page calendar modal |
| `components/booking-calendar.tsx` | Full booking calendar |
| `next.config.mjs` | Next.js configuration |
| `vercel.json` | Vercel deployment config |
