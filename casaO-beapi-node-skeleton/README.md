# Casa O — Booking Engine API (Node Skeleton)

This skeleton implements a clean server-side proxy over **Guesty Booking Engine API** using **GuestyPay** tokens for payment.

## Quick Start
```bash
cp .env.example .env
npm install
npm run dev
# in another shell:
curl 'http://localhost:3000/api/availability?checkIn=2025-12-20&checkOut=2025-12-27&adults=2'
```

## Environment
See `.env.example`.

## Endpoints
- `GET /api/availability` → BE `/api/search`
- `POST /api/quote` → BE `/api/reservations/quotes`
- `POST /api/book` → BE `/api/reservations/instant` (expects `payment.method="guestyPayToken"` and `payment.token`)
- `POST /api/inquiry` → BE `/api/reservations/inquiry`

## Notes
- Caches BE token in `.cache/token.json` and refreshes ~5 minutes before expiry.
- Do **not** pass `client_secret` to the browser.
- Handle 429 with `Retry-After` backoff; see `src/guesty.js`.
