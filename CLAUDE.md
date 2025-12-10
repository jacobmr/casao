# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Casa Vistas is a direct booking website for a luxury vacation rental in Costa Rica. It integrates with Guesty Booking Engine API for real-time availability and pricing, with checkout handled via a branded handoff to Blue Zone Experience's Guesty portal.

**Production:** https://www.casavistas.net
**Staging:** https://casao.vercel.app

## Commands

```bash
# Development
pnpm install          # Install dependencies
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint

# Cache Operations
curl localhost:3000/api/warmup-cache  # Preload 6 months of availability/pricing
```

## Architecture

### Tech Stack
- **Framework:** Next.js 16 with App Router, React 19, TypeScript
- **UI:** Radix UI + shadcn/ui components, Tailwind CSS 4
- **Cache:** Vercel KV (Redis) for availability/pricing/tokens
- **External API:** Guesty Booking Engine (OAuth 2.0 client credentials)

### Key Directories
```
app/
├── api/                    # API routes
│   ├── calendar/           # Availability endpoint (GET)
│   ├── quotes/             # Pricing quotes (POST)
│   ├── handoff/            # Checkout redirect with interstitial
│   ├── warmup-cache/       # Cache preloader
│   └── cron/cache-refresh/ # Nightly cache refresh (2 AM UTC)
├── booking/                # Date selection page
├── enhance/                # Experience upsells (2+ = 5% lodging discount)
└── page.tsx                # Home page with modal calendar

components/
├── availability-calendar.tsx  # Home page calendar modal
├── booking-calendar.tsx       # Booking page calendar
├── experiences/               # Experience selection components
└── ui/                        # shadcn/ui primitives

lib/
├── guesty.ts              # Guesty API client (TypeScript)
├── kv-cache.js            # Redis cache utilities
├── token-service-kv.js    # OAuth token management with KV
├── pricing-fetcher.js     # Pricing utilities
└── experiences-data.ts    # Static experience definitions
```

### Booking Flow
1. Guest selects dates on home page or `/booking`
2. Optional: Add experiences on `/enhance` page
3. Click "Continue to Checkout" → `/api/handoff`
4. Handoff shows branded interstitial with booking summary
5. Redirect to Blue Zone Guesty checkout with UTM tracking

### Caching Strategy
- **Availability:** `availability:{year}-{month}` - 24h TTL, 6 months preloaded
- **Pricing:** `pricing:{year}-{month}` - 24h TTL
- **OAuth Tokens:** `guesty:token` - 24h TTL, auto-refresh 5 min before expiry

Cache is refreshed nightly at 2 AM UTC via Vercel Cron (`vercel.json`).

## Environment Variables

Required (set in `.env.local` or Vercel):
```
GUESTY_CLIENT_ID
GUESTY_CLIENT_SECRET
GUESTY_OAUTH_TOKEN_URL
GUESTY_BASE_URL=https://booking.guesty.com/api
GUESTY_PROPERTY_ID=688a8aae483ff0001243e891
```

Vercel KV variables are auto-configured on Vercel deployment.

## Important Notes

- **Token Service:** Always use `lib/token-service-kv.js` for Guesty auth - handles caching and rate limiting
- **Import Alias:** Use `@/*` for project root imports (configured in tsconfig)
- **Build Config:** ESLint and TypeScript errors are ignored during builds (`next.config.mjs`)
- **Images:** Unoptimized in Next.js config; property photos in `public/images/`
