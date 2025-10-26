🧾 Product Requirements Document

Project: Casa O White-Label Booking System
Purpose: Integrate directly with the Guesty Booking Engine API to enable availability, pricing, and booking for Casa O without exposing the PM’s Guesty domain or branding.

⸻

1. 🎯 Goals
	•	Provide guests with a fast, simple, mobile-friendly booking experience under Casa O branding.
	•	Preserve Guesty as the system of record for inventory, rates, and reservations.
	•	Avoid exposing any Blue Zone Experience assets, headers, or marketing elements.
	•	Maintain PCI compliance and secure data exchange.
	•	Support direct checkout and confirmation entirely within Casa O’s website domain.

⸻

2. 👩‍💻 User Experience (UX) Overview

Entry points
	•	“Book Now” buttons from home page and property detail .
	•	Deep links (e.g., casao.com/book?checkIn=2025-12-20&checkOut=2025-12-27).

Steps
	1.	Search / Availability
	•	Guest selects dates, number of adults/children.
	•	Front-end calls /api/search → displays available listings and total price.
	2.	Select Property
	•	User views property photos, amenities, nightly rate breakdown.
	3.	Guest Details
	•	Simple form: name, email, phone, optional special requests.
	4.	Payment
	5.	Review & Confirm
	•	Confirmation screen → create reservation via /api/reservations/instant (or /inquiry fallback).
	6.	Post-Booking
	•	Display confirmation ID, send email receipt (webhook or Guesty auto-response).
	•	Optional: offer “Add to Calendar” and “Share via WhatsApp” actions.

Visual Design
	•	Minimalist white-label layout consistent with Casa O brand.
	•	Steps visible as a progress bar.
	•	Loading animations between API calls (no hard page reloads).

⸻

3. ⚙️ Functional Requirements

Area	Requirement
Authentication	Obtain OAuth2 token (client_credentials grant) from https://booking.guesty.com/oauth2/token. Cache for 24 h.
Availability	GET /api/search with check-in/out + occupancy. Show total price and taxes.
Quote creation	POST /api/reservations/quotes before checkout to lock rate.
Booking	POST /api/reservations/instant with quoteId + guest + payment token.
Inquiry fallback	If instant booking rejected (e.g., mode = inquiry-only), call /reservations/inquiry and display “We’ll confirm shortly.”
Confirmation	Display confirmation code + details returned by API. Trigger email via Casa O mail system or Guesty webhook.
Error Handling	Gracefully show friendly messages for API 4xx/5xx with retry/backoff.
Localization	Default English; JSON translation map for Spanish/French later.
Accessibility	WCAG 2.1 AA compliance.
Analytics	Google Tag Manager or Plausible event tracking for search, quote, book.


⸻

4. 🔒 Security & Privacy
	•	All server-side API calls (Node/Express or Python FastAPI).
	•	No exposure of client_secret or tokens to browser.
	•	Tokens cached in encrypted storage or Redis; refreshed daily.
	•	HTTPS enforced end-to-end.
	•	Payment tokens handled only through PCI-compliant processor.
	•	No marketing email opt-ins without explicit user consent.

⸻

5. 🧱 Technical Architecture

Browser (React/Vue UI)
      ↓
Casa O API Server (Node/Python)
      ↓  (Bearer token)
Guesty Booking Engine API
      ↓
Guesty Core Platform (PM’s backend)

Server responsibilities
	•	Manage token lifecycle (GET/refresh).
	•	Validate input & sanitize payloads.
	•	Proxy only necessary data fields to client.
	•	Log requests & responses (masked).

Front-end responsibilities
	•	Collect UI inputs.
	•	Display state changes (loading, success, error).
	•	Post JSON to Casa O server endpoints /availability, /quote, /book.

⸻

6. 🔁 API Endpoints (Casa O Server Layer)

Endpoint	Method	Purpose	Guesty Call
/api/availability	GET	Date/rate search	/api/search
/api/quote	POST	Create quote	/api/reservations/quotes
/api/book	POST	Finalize booking	/api/reservations/instant
/api/inquiry	POST	Inquiry fallback	/api/reservations/inquiry
/api/webhook/guesty	POST	Receive Guesty reservation updates	n/a


⸻

7. 🧠 Business Rules
	•	Minimum stay and occupancy enforced by data returned from Guesty.
	•	Rates, taxes, and fees displayed exactly as provided—no client-side math.
	•	Allow partial payments only if Guesty listing supports it.
	•	If payment fails, allow retry with same quoteId within 10 min.
	•	Disable browser caching of personal data.

⸻

8. 🧩 Error & Edge-Case Handling

Scenario	Expected Behavior
Token expired	Server silently refreshes and retries once.
429 rate limit	Respect Retry-After, exponential backoff.
Quote expired	Prompt user to re-select dates.
API down	“Service temporarily unavailable; please call us.”
Payment declined	Stay on checkout screen, highlight error.


⸻

9. 🧰 Implementation Notes
	•	Libraries: Axios (requests), React Query or SWR (client caching), Express or FastAPI backend.
	•	Deployment: Vercel/Netlify for front-end; Cloudflare Worker or small VPS for API proxy.
	•	Monitoring: Sentry for errors; Cloudflare analytics for latency.
	•	Token cache: Redis or local JSON file with expiry timestamp.

⸻

10. 🧪 Testing Plan
	1.	Sandbox mode: Use test property in Guesty.
	2.	Unit tests: Mock token + API responses.
	3.	End-to-end: Simulate full booking on staging domain.
	4.	Load testing: Ensure < 2 s response under 20 concurrent users.
	5.	Regression: Verify quote → book flow after token refresh.

⸻

11. 🧩 Future Enhancements
	•	Multi-property search and filters.
	•	Loyalty or promo code support (via query param to quote endpoint).
	•	“Add-ons” (airport transfer, chef service) as upsell items.
	•	Multi-language and currency support.
	•	Admin dashboard for manual booking creation and guest lookup.

⸻

12. 📜 Deliverables

Item	Owner	Target
API proxy service (Node/Python)	Backend Engineer	Week 1
Front-end booking UI	Web Developer	Week 2–3
End-to-end test & QA	QA Engineer	Week 4
Production deploy	Lead Engineer	Week 5


⸻

✅ Success Metrics
	•	100 % of bookings completed without leaving Casa O domain.
	•	< 3 s average page load.
	•	< 2 % booking drop-off after payment screen.
	•	No exposed Blue Zone branding in HTML or headers.

⸻

Would you like me to produce a technical appendix (endpoint-by-endpoint payloads and example JSON responses) next? That makes it easier for your engineers to start coding directly.

---

# Casa O Booking — Product Requirements (BE API + GuestyPay)

**Purpose:** Implement a fully white‑label booking flow on casao.com using the **Guesty Booking Engine API** for availability/quotes/reservations and **GuestyPay** for payment tokenization. No Blue Zone branding or Guesty-hosted headers/footers are exposed. All server calls occur on Casa O infrastructure.

---

## Goals
- Seamless, mobile‑first booking UX with Casa O branding.
- Guesty remains the system of record for rates/availability/reservations.
- Payments are processed **in the PM’s Guesty tenant via GuestyPay**.
- PCI scope minimized: Casa O never stores card PANs; only uses GuestyPay tokens.
- Avoid rate-limit pitfalls: cache BE API token for ~24h; respect `Retry-After`.

## User Flow
1. **Search**: dates + guests → display available inventory & total price.
2. **Review**: photos, amenities, price breakdown, policies.
3. **Guest details**: name, email, phone.
4. **Payment (GuestyPay)**: secure card collection → tokenization → returns **payment token**.
5. **Confirm**: server calls **/reservations/instant** with `payment.method="guestyPayToken"` and the token. If instant not allowed, fallback to **/reservations/inquiry**.
6. **Done**: confirmation page, email receipt, optional calendar file.

## Functional Requirements
- **Auth**: `POST https://booking.guesty.com/oauth2/token` (client_credentials). Cache `access_token` until expiry (`expires_in`≈86400s).
- **Search**: GET `https://booking.guesty.com/api/search?checkIn&checkOut&adults&children`.
- **Quote**: POST `https://booking.guesty.com/api/reservations/quotes` → returns `quote.id`.
- **Payment**: Client obtains **GuestyPay token** (GuestyPay widget/SDK or tokenization endpoint).
- **Book (instant)**: POST `https://booking.guesty.com/api/reservations/instant` with:
  ```json
  {
    "quoteId": "QUOTE_ID",
    "guest": {
      "firstName": "Test", "lastName": "Guest",
      "email": "test@example.com", "phone": "+11234567890"
    },
    "payment": {
      "method": "guestyPayToken",
      "token": "TOKEN_FROM_GUESTYPAY"
    }
  }
  ```
- **Inquiry fallback**: POST `https://booking.guesty.com/api/reservations/inquiry` when instant not allowed.
- **Webhooks (optional)**: receive reservation updates on Casa O endpoint to sync email receipts, CRM, analytics.

## Non‑Functional
- **Security**: no secrets in browser; HTTPS everywhere; mask PII in logs.
- **Performance**: < 2s server responses; prefetch images; compress JSON.
- **Accessibility**: WCAG 2.1 AA.
- **Analytics**: track steps: search → quote → payment token → confirmed.

## Error Handling
- **429**: obey `Retry‑After`; exponential backoff.
- **401/403**: refresh BE token once; if fails, surface friendly error.
- **Quote expired**: request a new quote and prompt user to reconfirm.
- **Payment decline**: remain on checkout; show processor error; allow retry with the same `quoteId`.
- **Mode mismatch**: if instant returns a config error (e.g., inquiry‑only), automatically call `/reservations/inquiry` and show “We’ll confirm shortly.”

## Architecture
```
Browser (Casa O UI)
  ↳ GuestyPay tokenize (client-side; returns token)
Server (Casa O API) — Node/Express
  ↳ Token cache (Redis or file) for BE API
  ↳ Calls Guesty BE API (search/quote/book/inquiry)
Guesty Booking Engine API
  ↳ Guesty (PM tenant): reservation + payment settlement
```
**Important**: Never expose `client_secret` or BE tokens to the browser.

## Server Endpoints (Casa O)
- `GET /api/availability` → proxy to BE `/api/search`.
- `POST /api/quote` → proxy to BE `/api/reservations/quotes`.
- `POST /api/book` → proxy to BE `/api/reservations/instant` with `guestyPayToken`.
- `POST /api/inquiry` → proxy to BE `/api/reservations/inquiry`.
- `POST /api/webhooks/guesty` (optional).

## Environment & Config
```
GUESTY_CLIENT_ID=...
GUESTY_CLIENT_SECRET=...
GUESTY_OAUTH_URL=https://booking.guesty.com/oauth2/token
GUESTY_API_BASE=https://booking.guesty.com/api
PORT=3000
TOKEN_CACHE_FILE=.cache/token.json
```
- Cache token for 24h; refresh 5 minutes before expiry.

## Acceptance Criteria
- Full instant booking with GuestyPay token succeeds in staging.
- Inquiry fallback path functions when instant is disabled.
- Payment settles and is visible in PM’s Guesty tenant.
- No Blue Zone branding/headers/opt-ins on Casa O pages.
- No card data stored on Casa O systems; only tokens and reservation IDs.

## Future
- Promo codes/upsells via quote line-items.
- Multi-property search, filters, and multi-currency.
- i18n (Spanish) and ICS calendar attachments.
