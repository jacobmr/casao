# Casa Vistas - Direct Booking Website

Next.js website for Casa Vistas vacation rental with **real-time booking** via Guesty Booking Engine API.

## 🎯 What This Does

Complete direct booking system where guests can:
1. View real availability from Guesty calendar
2. Select dates and see live pricing
3. Enter guest information
4. Pay securely via Stripe
5. Create instant reservation in Guesty

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit booking page
open http://localhost:3002/book
```

## Deploy to Vercel

1) Push this repo to GitHub as `casao` (or let me do it via GitHub CLI).
2) Create a new Vercel project from that repo.
3) Set Environment Variables in Vercel Project Settings:
   - `GUESTY_BASE_URL` – default: https://booking-api.guesty.com/v1
   - `GUESTY_CLIENT_ID` – your Guesty OAuth client id
   - `GUESTY_CLIENT_SECRET` – your Guesty OAuth client secret
   - `GUESTY_OAUTH_TOKEN_URL` – Okta token endpoint for client-credentials
   - `GUESTY_PROPERTY_ID` – optional listing id
   - `GUESTY_BOOKING_URL` – optional direct booking link
4) Build command: `npm run build` (copies images then builds).
5) After deploy, your property page is at `/properties/<slug>`.

## Content Model

- `content/properties/<slug>.md`
  - Frontmatter: `title`, `slug`, `source_url`, `scraped_at`, `images[]`, optional `amenities[]`, `bedrooms`, `bathrooms`, `max_occupancy`, `address`, `house_rules`, `policies`, `booking_url`.
  - Body: Rich description.
- `content/images/<slug>/...` (source) → copied to `public/images/<slug>/...` on build.

## 🔐 Token Management

**IMPORTANT**: All code uses the centralized token service (`lib/token-service.js`).

- ✅ Tokens cached in `.cache/guesty-token.json`
- ✅ Valid for 24 hours
- ✅ Automatic refresh when expired
- ✅ Rate limit protection (max 3 requests per 24 hours)
- ⚠️ **NEVER fetch tokens directly** - always use `getCachedToken()`

```javascript
import { getCachedToken } from './lib/token-service';

const token = await getCachedToken(); // Always use this!
```

## 🔌 Guesty Integration

- **Calendar API**: Real-time availability via `/api/calendar`
- **Quotes API**: Live pricing via `/api/quotes`
- **Booking API**: Instant reservations (coming soon)
- **Token Service**: Centralized OAuth token management

## Scripts

- `npm run dev` – Next dev server
- `npm run build` – copies images then builds
- `npm run start` – Next production server
- `npm run scrape` – scrape a Guesty page into markdown + images
- `npm run sync-images` – copy `content/images` → `public/images`

## Product Requirements (Summary)

- Goal: High-quality site to drive direct bookings, keeping users off the PMS marketplace.
- IA: Home, Property (gallery, description, amenities, location, rules, calendar), Booking (modal or page), About/Contact, Legal.
- Tech: Next.js (App Router), Markdown content, Vercel deploy.
- SEO/Perf: Metadata, JSON‑LD, responsive images, lazy-loading, Lighthouse 90+.
- Milestones: Scraper/content (M1), Next.js scaffold (M2), Guesty booking widget + SEO (M3), polish + prod deploy (M4).

See `docs/PRD.md` for full details.

## Environment

Use `.env` locally or set the same vars in Vercel:

```
GUESTY_BASE_URL=https://booking-api.guesty.com/v1
GUESTY_CLIENT_ID=...your_client_id...
GUESTY_CLIENT_SECRET=...your_client_secret...
GUESTY_OAUTH_TOKEN_URL=...https://<your-okta-domain>/oauth2/<auth-server-id>/v1/token...
GUESTY_PROPERTY_ID=...optional_listing_id...
GUESTY_BOOKING_URL=...optional_booking_link...
```

`.env.example` is included as a reference. Do not commit real secrets.

