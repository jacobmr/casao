# Casa Vistas (casao)

Vercel-ready Next.js site for a single property with direct bookings via Guesty. Content is Markdown-first; images live in `content/images` and are synced to `public/` for serving.

## Quick Start

- Install: `npm install`
- Import images (already done here) or run `node scripts/import_images.js --src "/path/to/images" --slug <slug>`
- Sync to public: `npm run sync-images`
- Dev: `npm run dev` then open http://localhost:3000

## Deploy to Vercel

1) Push this repo to GitHub as `casao` (or let me do it via GitHub CLI).
2) Create a new Vercel project from that repo.
3) Set Environment Variables in Vercel Project Settings:
   - `GUESTY_API_KEY` – your Guesty API key
   - `GUESTY_API_SECRET` – your Guesty API secret
   - `GUESTY_PROPERTY_ID` – optional, for availability/price lookups
   - `GUESTY_BOOKING_URL` – optional, direct booking link
4) Build command: `npm run build` (copies images then builds).
5) After deploy, your property page is at `/properties/<slug>`.

## Content Model

- `content/properties/<slug>.md`
  - Frontmatter: `title`, `slug`, `source_url`, `scraped_at`, `images[]`, optional `amenities[]`, `bedrooms`, `bathrooms`, `max_occupancy`, `address`, `house_rules`, `policies`, `booking_url`.
  - Body: Rich description.
- `content/images/<slug>/...` (source) → copied to `public/images/<slug>/...` on build.

## Guesty Integration

- Booking CTA: Uses `booking_url` from frontmatter or falls back to `source_url`.
- API Stub: `app/api/availability/route.js` reads Vercel env (`GUESTY_API_*`) and returns a placeholder until wired to Guesty.
- To finalize: implement `fetchAvailability()` in `lib/guesty.js` to call Guesty APIs with proper authentication.

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
GUESTY_API_KEY=...
GUESTY_API_SECRET=...
GUESTY_PROPERTY_ID=...
GUESTY_BOOKING_URL=...
```

`.env.example` is included as a reference. Do not commit real secrets.

