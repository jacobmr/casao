# /guesty:cancel - Cancel a Guesty Reservation

Cancel an owner reservation in Guesty via the 2-step alteration API.

## Arguments
- `<reservationId>` — The Guesty reservation ID to cancel (24-char hex string) **required**
- If no ID provided, run `/guesty:status` first and ask the user to pick one

## Steps

1. **Login** — From `/data/dev/CasaVistas/scraper/`:
   ```javascript
   const { GUESTY_EMAIL, GUESTY_PASSWORD, GUESTY_PORTAL_API_KEY } = require("./shared");
   // POST https://app.guesty.com/api/owners/auth/login
   // body: { username, password, hostname: "bluezoneexperience.guestyowners.com", apiKey }
   ```

2. **Look up the reservation** — Fetch the reservation report and find the matching ID to show the user what they're about to cancel. Display:
   ```
   Reservation to cancel:
     ID:        69d708df770918458c2fe381
     Dates:     2026-09-20 → 2026-09-22
     Guest:     Jacob Reider
     Status:    confirmed
     Source:    owner
   ```

3. **Confirm with user** — ASK FOR EXPLICIT CONFIRMATION before proceeding.
   **DO NOT cancel without user saying yes.** This is destructive and irreversible.

4. **Step 1: Create alteration** — POST to `https://app.guesty.com/api/reservations-fegw/alterations`:
   ```json
   {
     "reservationId": "<reservationId>",
     "status": "canceled"
   }
   ```
   Save the full response as `alteration`.

5. **Step 2: Confirm cancellation** — POST to `https://app.guesty.com/api/reservations-fegw/alterations/confirm-change`:
   ```json
   {
     ...alteration,
     "inquiryId": "<alteration._id>",
     "reservationId": "<reservationId>"
   }
   ```
   The body is the full alteration object spread, plus `inquiryId` (= alteration `_id`) and `reservationId` added.

6. **Verify** — Check the response has `"status": "canceled"`. Report success or failure.

## Safety
- NEVER cancel a reservation with `source` other than "owner" without triple-confirming with the user — those are real guest bookings.
- Always show reservation details before asking for confirmation.
