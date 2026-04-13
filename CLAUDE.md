# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Casa Vistas is a direct booking website for a luxury vacation rental in Costa Rica. It integrates with Guesty Booking Engine API for real-time availability and pricing, with checkout handled via a branded handoff to Blue Zone Experience's Guesty portal.

**Production:** https://www.casavistas.net
**Staging:** https://casao.vercel.app

### Repo Structure

This is a single repo with two components:

| Component           | Directory                     | Runs on              | Deployed via                  |
| ------------------- | ----------------------------- | -------------------- | ----------------------------- |
| **Next.js app**     | `app/`, `components/`, `lib/` | Vercel               | Git push → Vercel auto-deploy |
| **Scraper scripts** | `scraper/`                    | 636desk (local cron) | Git pull on 636desk (manual)  |

Both live in the same repo for convenience. The `scraper/` directory has its own `package.json` and `node_modules`. Vercel ignores it — it just builds the Next.js app from the root. The `scripts/` directory is legacy (gitignored, not deployed anywhere).

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

### Booking Flow — Casa Vistas → Guesty Handoff

This is the direct-booking flow and is the **most valuable channel** because it captures guest contact info (name + email + phone via Guesty's side) before Blue Zone ever sees the lead. All other channels either anonymize contact (Airbnb) or give us only partial info after the fact.

**The handoff endpoint** (`app/api/handoff/route.js`) is a three-stage flow behind a single URL:

1. **Guest picks dates on casavistas.net** (home page modal, `/booking` page, or `/enhance` page with experiences).
2. **Client redirects to `/api/handoff?checkIn=&checkOut=&adults=[&experiences=&promo=]`** (no `name`/`email` yet).
3. **Stage A — Lead capture form.** Endpoint detects missing `name`/`email` and serves `renderLeadCaptureForm()`: a branded HTML page asking for full name + email. Form submission re-hits `/api/handoff` with `name`/`email` appended.
4. **Stage B — Branded interstitial + Pushover.** With `name`/`email` now present, the endpoint:
   - Generates a UUID booking reference (for user display, not persisted).
   - Sends a Pushover notification to the owner with `name (email)`, dates, nights, guest count, and any promo code.
   - Console-logs the full handoff payload.
   - Renders the branded "You're Almost There!" interstitial. If a promo code is set, shows a copy-to-clipboard box and a screenshot hint of where to paste it on the Guesty side. If experiences are selected with 2+ count, shows a 5% discount badge.
5. **Stage C — Redirect to Blue Zone Guesty.** The interstitial's "Continue to Secure Checkout →" button links to `https://bluezoneexperience.guestybookings.com/en/properties/{GUESTY_PROPERTY_ID}?minOccupancy={adults}&checkIn={checkIn}&checkOut={checkOut}`. Guest completes payment and contract on Blue Zone's Guesty.
6. **Scraper picks up the confirmed booking** next morning (6 AM CST cron on 636desk) as a Guesty reservation with `source: "website"` or `source: "BE-API"`, and writes it to Google Calendar as `[GUEST] {name}`.

**Validation / constraints:**

- 3-night minimum enforced in handoff before rendering interstitial.
- `GUESTY_PROPERTY_ID` must be set in env (`688a8aae483ff0001243e891`).
- `PUSHOVER_USER_KEY` / `PUSHOVER_API_TOKEN` optional — handoff still completes if Pushover fails.

**Known gaps (non-blocking but worth fixing):**

- **Lead info is not persisted anywhere.** Stage B only writes to Pushover + console.log. If the guest bails between the interstitial and completing payment on Blue Zone's Guesty page, the lead is lost — there's no queryable record for follow-up email. A future fix should KV-store lead captures keyed by UUID with a TTL so we can surface abandoned-cart leads in the admin UI.
- **Name/email are NOT passed through to the Blue Zone Guesty URL.** The guest has to re-enter them on Guesty's side. In practice Guesty still captures them (100% on `source: "website"` reservations have email and phone per the 2026-04 audit), but we're asking the guest to type their name/email twice. Investigate whether Guesty's booking page accepts `guestFirstName=`/`guestLastName=`/`guestEmail=` query params to pre-fill.

**Source attribution in Guesty (useful for understanding where leads come from):**

| Guesty `source`         | Meaning                              | Contact info                               |
| ----------------------- | ------------------------------------ | ------------------------------------------ |
| `Direct`                | Blue Zone direct website             | 100% email, rare phone                     |
| `website` / `BE-API`    | Casa Vistas handoff (this flow)      | 100% email AND phone                       |
| `manual`                | PM hand-entered (phone/email/walkup) | ~90% email, partial phone                  |
| `Booking.com`           | Booking.com                          | 100% email                                 |
| `VRBO`                  | VRBO                                 | ~95% email, ~55% phone                     |
| `airbnb2`               | Airbnb                               | ~22% email (masked forwarding), ~39% phone |
| `owner` / `owner-guest` | Owner stays or owner-invited guests  | Owner's own contact                        |

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
- **Guards:**
  - 90-day max duration filter rejects bogus reservations from parsing errors
  - **Inquiries are skipped** (status: "inquiry") — Guesty doesn't hold dates for inquiries so writing them would create phantom blocks. Prior to 2026-04-12 the scraper wrote inquiries as `[GUEST]` events, which caused 37.5% phantom-rate in the calendar.

**How it works:**

1. Calls Guesty Owners Portal API for reservation data (no browser needed)
2. Falls back to Puppeteer DOM scraping if API fails
3. Creates/updates/deletes `[GUEST] Guest Name` events in Google Calendar
4. Family Portal reads these events via `lib/google-calendar.ts`

**Event descriptions are machine-readable.** Every `[GUEST]` event the scraper writes carries a structured description with the source, confirmation code, status, last-synced timestamp, and Guesty reservation ID:

```
Source: Direct
Confirmation: 87892073
Status: confirmed
Synced: 2026-04-12T23:07:14.460Z
─────
guesty_reservation_id: 68e8724db25f11d7aad2b609
```

The `guesty_reservation_id:` line is the matching key — the scraper uses it to update/delete events on subsequent runs, so name collisions and ±7-day fuzzy matches no longer cause ghost duplicates. Events created before this marker existed are handled by a legacy fallback path (name + ±7-day window) that re-stamps them on their next sync.

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
