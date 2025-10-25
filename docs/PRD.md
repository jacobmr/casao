# Casa Vistas Website – Product Requirements Document (PRD)

## 1. Overview
Build a standalone marketing and booking website for Casa Vistas (vacation home) that showcases the property with a high‑quality UX, enables direct bookings via Guesty (without sending traffic to the property manager’s marketplace), and supports basic content management via Markdown files stored in the repo.

## 2. Goals
- Present compelling visuals and details that drive direct bookings.
- Integrate Guesty for availability, pricing, and checkout.
- Maintain full control of brand, SEO, and user journey (no marketplace leakage).
- Keep content maintenance simple (Markdown for content, image folder for assets).

## 3. Non‑Goals
- Multi‑property marketplace or PMS features (beyond what Guesty provides).
- Complex CMS backend (headless CMS is out of scope for v1).
- Complex personalization or A/B testing for v1.

## 4. Users & Use Cases
- Prospective guests researching the property (photos, amenities, location, rules).
- Returning guests seeking quick booking.
- Owner/manager updating content (copy, images, seasonal notes).

## 5. Success Metrics
- Primary: Direct booking conversion rate, completed checkouts.
- Secondary: Time on page, image gallery interactions, booking CTA clicks.
- Operational: PageSpeed score, Core Web Vitals, SEO impressions/clicks.

## 6. Information Architecture
- Home: Hero, highlights, gallery teaser, CTA to Book Now.
- Property: Full gallery, description, amenities, location map, house rules, FAQs, calendar/availability, pricing snippet, Book Now CTA.
- Booking: Guesty booking modal or dedicated booking page embedded via Guesty.
- About/Contact: Owner story, contact form/email, policies.
- Legal: Terms, Privacy, Refund policy.

## 7. Content Model (Markdown-first)
- `content/properties/<slug>.md`
  - Frontmatter: `title`, `slug`, `source_url`, `scraped_at`, `images[]`, optional `amenities[]`, `bedrooms`, `bathrooms`, `max_occupancy`, `address`, `house_rules`, `policies`.
  - Body: Rich description, details, and notes.
- `content/images/<slug>/...`: Optimized images (and originals if desired).

## 8. Integrations
- Guesty
  - Booking Engine: Embed availability, pricing, and checkout.
  - API Endpoints (if needed for advanced UX): pull availability calendar, base price, fees, and restrictions.
  - Auth: API key/secret stored as environment variables (Vercel project envs).
- Maps
  - Static map (privacy‑first) or interactive map (Mapbox/Leaflet/Google) for location context.
- Analytics
  - Plausible (privacy‑friendly) or Google Analytics 4; cookie banner only if required.

## 9. Booking Flow
- From property pages, user clicks Book Now.
- Display an inline booking widget or modal powered by Guesty (preferred: modal to keep context). Alternative: dedicated `/book` page to embed Guesty checkout.
- Prepopulate dates if selected from calendar; validate min nights/occupancy.
- Confirm booking and show success page with summary.

## 10. SEO & Content
- Descriptive meta tags, Open Graph/Twitter cards.
- Canonical URLs, human‑readable slugs, sitemap, robots meta (allow indexing).
- Structured data (JSON‑LD: LodgingBusiness/Hotel/Accommodation) with key attributes.
- Image optimization (WebP/AVIF, responsive sizes, lazy‑loading, blur‑up).

## 11. Performance & Accessibility
- Lighthouse 90+ targets on mobile.
- CLS‑safe image sizing, preloaded hero image, HTTP caching.
- Semantic HTML, keyboard navigation, color contrast compliance.

## 12. Tech Stack
- Framework: Next.js (App Router) deployed on Vercel.
- Styling: Tailwind CSS or Vercel design system.
- Data: Markdown/MDX from `content/` folder. Static generation with incremental revalidation.
- Media: Next.js `<Image>` with local images; optional on‑demand optimization.

## 13. Configuration & Environments
- Local: `.env.local` with Guesty API keys (not committed).
- Vercel: Environment variables for Guesty; preview and production deployments.
- Secrets never stored in repo.

## 14. Admin & Content Workflow
- Edit Markdown and images in repo; create PRs for review.
- On merge to `main`, Vercel builds and deploys.
- Optional: add simple CMS UI later (e.g., Netlify CMS/Decap or Contentlayer + GitHub UI).

## 15. Privacy & Legal
- Transparent privacy policy; if GA used, honor consent where required.
- No PII stored locally; bookings handled by Guesty.

## 16. Milestones
- M1: Scraper baseline + content scaffold (current task).
- M2: Next.js scaffold with static content pages and image gallery.
- M3: Guesty booking embed + calendar, SEO basics, analytics.
- M4: Polish (copy, design, responsiveness, performance), production deploy.

## 17. Risks & Mitigations
- Guesty embed changes: abstract integration to a component and version pin docs.
- Content completeness from scraping: manual curation pass post‑scrape.
- Image licensing/rights: confirmed owner rights to reuse.

## 18. Open Questions
- Preferred booking UI: inline calendar + modal, or full page?
- Exact brand choices (logo, palette) when moving to design phase.
- Payment/fees display granularity from Guesty (line items?).
