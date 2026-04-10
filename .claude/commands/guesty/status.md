# /guesty:status - Show Guesty Reservations

Show all upcoming reservations for Casa Vistas from the Guesty Owners Portal API.

## Steps

1. **Login** — Run this Node.js snippet from `/data/dev/CasaVistas/scraper/`:

```javascript
const {
  GUESTY_EMAIL,
  GUESTY_PASSWORD,
  GUESTY_PORTAL_API_KEY,
} = require("./shared");
const loginRes = await fetch("https://app.guesty.com/api/owners/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: GUESTY_EMAIL,
    password: GUESTY_PASSWORD,
    hostname: "bluezoneexperience.guestyowners.com",
    apiKey: GUESTY_PORTAL_API_KEY,
  }),
});
const { token } = await loginRes.json();
```

2. **Fetch reservations** — GET with Bearer token:

```
GET https://app.guesty.com/api/reservations-reports/owner-portal
  ?smartView=true
  &columns=checkIn+checkOut+listing+guest+status+source
  &viewId=6901358070cda2b4e288cc4b
  &skip=0&limit=100&sort=-checkIn
```

3. **Parse the response** — Each record has nested values:
   - `r.checkIn.value` → date string like "2026-09-20 03:00 PM"
   - `r.checkOut.value` → date string
   - `r.guest.name` → guest name
   - `r.status.children` → "confirmed", "canceled", "inquiry"
   - `r.source.children` → "owner", "Direct", "airbnb2", "manual", etc.

4. **Filter** — Show only future, non-canceled reservations for Casa Vistas.

5. **Display as table**:

```
| Check-in   | Check-out  | Guest            | Status    | Source  | ID                       |
|------------|------------|------------------|-----------|---------|--------------------------|
| 2026-04-15 | 2026-04-20 | John Smith       | confirmed | Direct  | 69abc123...              |
```

6. **Summary** — Show totals: X guest bookings, Y owner blocks, Z inquiries.

7. **Flag issues** — Note any overlapping dates, stale inquiries, or anomalies.
