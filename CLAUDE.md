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

scraper/                       # Runs on 636desk (NOT on any remote server)
├── scrape-to-gcal.js          # Guesty → Google Calendar sync
├── kindred-to-guesty.js       # Kindred → Guesty owner block sync
├── shared.js                  # SOPS decrypt, Google Calendar, Pushover
├── cancel-reservation.js      # Cancel Guesty reservations
└── secrets.env.enc            # SOPS-encrypted secrets
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

## Scraper Scripts (636desk)

All scraper scripts run locally on 636desk from the `scraper/` directory in this repo. Secrets are SOPS-encrypted and decrypted at runtime — no plaintext on disk.

### Guesty → Google Calendar Scraper

- **Purpose:** Syncs commercial Guesty bookings to Google Calendar as `[GUEST]` events
- **Script:** `scraper/scrape-to-gcal.js`
- **Tech:** Direct Guesty Owners Portal API (v2 rewrite), with DOM fallback via Puppeteer
- **Schedule:** Daily at 6:00 AM CST via cron on 636desk
- **Runner:** `scraper/run-scraper.sh`
- **Notifications:** Pushover on success/failure
- **Guard:** 90-day max duration filter rejects bogus reservations from parsing errors

**How it works:**

1. Calls Guesty Owners Portal API for reservation data (no browser needed)
2. Falls back to Puppeteer DOM scraping if API fails
3. Creates/updates/deletes `[GUEST] Guest Name` events in Google Calendar
4. Family Portal reads these events via `lib/google-calendar.ts`

**Manual run:**

```bash
cd /data/dev/CasaVistas/scraper && node scrape-to-gcal.js
```

### Kindred → Guesty Owner Block Sync

- **Purpose:** Creates Guesty owner reservations from Kindred home exchange calendar events to prevent double-bookings
- **Script:** `scraper/kindred-to-guesty.js`
- **Tech:** Guesty Owners Portal API (direct, no Puppeteer)
- **Schedule:** Daily at 6:30 AM CST via cron on 636desk
- **Runner:** `scraper/run-kindred-sync.sh`
- **Notifications:** Pushover on success/failure

**How it works:**

1. Reads future `[KINDRED]` events from Google Calendar
2. Filters out already-synced events (checks for `[SYNCED-TO-GUESTY]` in description)
3. Creates owner reservation via Guesty API for each unsynced Kindred event
4. Marks Google Calendar event with `[SYNCED-TO-GUESTY]` timestamp

**Manual run:**

```bash
cd /data/dev/CasaVistas/scraper && node kindred-to-guesty.js
```

### Scraper Secrets

```bash
# Decrypt and view secrets
cd scraper && sops decrypt --input-type dotenv --output-type dotenv secrets.env.enc

# Check Google SA credentials
sops decrypt google-sa-credentials.enc.json | jq .client_email
```

### Legacy Scripts (deprecated)

The `scripts/` directory contains old versions that previously ran on CASAO Server (172.30.30.196) inside an n8n Docker container. These are **not deployed anywhere** and should not be edited. All active code is in `scraper/`.

### Google Calendar Integration

**Calendar ID:** `c_3d8960421a7c6f85186c09691337e19aea403d7636c58fd36fb7c0278768680f@group.calendar.google.com`

**Event Prefixes:**
| Prefix | Source | Reader |
|--------|--------|--------|
| `[GUEST]` | Guesty scraper on 636desk (`scraper/scrape-to-gcal.js`) | `getGuestBookings()` |
| `[KINDRED]` | Google Apps Script (`scripts/kindred-calendar-sync.gs`) | `getKindredBookings()` |
| `Pending:` | Family Portal booking requests | `getPendingBookings()` |
| (none) | Confirmed family bookings | `getConfirmedBookings()` |

**Active scripts (in `scraper/`):**

- `scraper/scrape-to-gcal.js` - Guesty reservation scraper (v2, API-first)
- `scraper/kindred-to-guesty.js` - Kindred → Guesty owner block sync
- `scraper/shared.js` - Shared utilities (SOPS decrypt, Google Calendar, Pushover)
- `scraper/cancel-reservation.js` - Cancel a Guesty reservation
- `lib/google-calendar.ts` - TypeScript client for reading calendar events

**Google Apps Scripts:**

- `scripts/kindred-calendar-sync.gs` - Apps Script for Kindred invite sync (deployed in Google)

### Family Portal

**Routes:**

- `/family` - Main portal (password: see Redis `family:password`)
- `/family/admin` - Admin view for pending approvals
- `/friends` - Friends & Family booking with promo codes

**Key files:**

- `app/family/` - Portal pages
- `app/api/family/` - API routes
- `lib/google-calendar.ts` - Calendar read/write operations
- `lib/family-kv.js` - Redis storage for family auth
