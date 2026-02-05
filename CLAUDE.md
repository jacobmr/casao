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

## External Infrastructure

### CASAO Server (172.30.30.196)

Ubuntu server running ancillary services for Casa Vistas.

**Guesty → Google Calendar Scraper:**

- **Purpose:** Syncs commercial Guesty bookings to Google Calendar as `[GUEST]` events
- **Tech:** Puppeteer inside n8n Docker container
- **Schedule:** Daily at 6:00 AM CST (`0 6 * * *`)
- **Script:** `/home/node/scrape-to-gcal.js` (inside n8n container)
- **Runner:** `/home/jacob/run-guesty-scraper.sh`
- **Logs:** `/home/jacob/guesty-scraper.log`

**How it works:**

1. Logs into Guesty Owners portal (bluezoneexperience.guestyowners.com)
2. Scrapes reservation report for Casa Vistas bookings
3. Creates/updates `[GUEST] Guest Name` events in Google Calendar
4. Family Portal reads these events via `lib/google-calendar.ts`

**SSH access:**

```bash
ssh jacob@172.30.30.196
tail -f ~/guesty-scraper.log          # Check logs
~/run-guesty-scraper.sh               # Run manually
docker exec -it n8n node /home/node/scrape-to-gcal.js  # Run in container
```

**⚠️ Scraper Maintenance Note (Updated Feb 2026):**
This scraper is fragile and depends on Guesty's exact reservation report page structure. If Guesty changes their layout, the text parsing will break. Monitor for "0 upcoming" in logs despite bookings existing in dashboard. Last fix: Feb 2026 - Guesty added "CREATION DATE" column.

**Kindred → Guesty Owner Block Sync:**

- **Purpose:** Creates Guesty owner reservations from Kindred home exchange calendar events to prevent double-bookings
- **Tech:** Puppeteer inside n8n Docker container (same as Guesty scraper)
- **Schedule:** Daily at 6:30 AM CST (`30 6 * * *`) - runs after Guesty scraper
- **Script:** `/home/node/kindred-to-guesty.js` (inside n8n container)
- **Runner:** `/home/jacob/run-kindred-sync.sh`
- **Logs:** `/home/jacob/kindred-sync.log`
- **Notifications:** SimplePush (key: `casaVi`)

**How it works:**

1. Reads future `[KINDRED]` events from Google Calendar
2. Filters out already-synced events (checks for `[SYNCED-TO-GUESTY]` in description)
3. Logs into Guesty Owners portal
4. Creates owner reservation for each unsynced Kindred event
5. Marks Google Calendar event with `[SYNCED-TO-GUESTY]` timestamp
6. Sends SimplePush notification on success/failure

**Manual run:**

```bash
ssh jacob@172.30.30.196
~/run-kindred-sync.sh                                    # Via runner
docker exec n8n node /home/node/kindred-to-guesty.js    # Direct in container
tail -f ~/kindred-sync.log                               # Check logs
```

**Source code:** `scripts/kindred-to-guesty.js` (this repo)

### Google Calendar Integration

**Calendar ID:** `c_3d8960421a7c6f85186c09691337e19aea403d7636c58fd36fb7c0278768680f@group.calendar.google.com`

**Event Prefixes:**
| Prefix | Source | Reader |
|--------|--------|--------|
| `[GUEST]` | Guesty scraper on CASAO Server | `getGuestBookings()` |
| `[KINDRED]` | Google Apps Script (`scripts/kindred-calendar-sync.gs`) | `getKindredBookings()` |
| `Pending:` | Family Portal booking requests | `getPendingBookings()` |
| (none) | Confirmed family bookings | `getConfirmedBookings()` |

**Scripts in this repo:**

- `scripts/kindred-calendar-sync.gs` - Apps Script for Kindred invite sync
- `scripts/kindred-to-guesty.js` - Puppeteer script for Kindred → Guesty owner block sync
- `scripts/run-kindred-sync.sh` - Runner script for Kindred sync
- `scripts/KINDRED-SETUP.md` - Setup instructions
- `lib/google-calendar.ts` - TypeScript client for reading calendar events

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
