# /guesty:edit - Edit a Guesty Reservation

Alter dates, notes, or other details on an existing Guesty owner reservation.

## Arguments
- `<reservationId>` — The Guesty reservation ID to edit (24-char hex string) **required**
- If no ID provided, run `/guesty:status` first and ask the user to pick one

## Steps

1. **Login** — From `/data/dev/CasaVistas/scraper/`:
   ```javascript
   const { GUESTY_EMAIL, GUESTY_PASSWORD, GUESTY_PORTAL_API_KEY } = require("./shared");
   // POST https://app.guesty.com/api/owners/auth/login
   // body: { username, password, hostname: "bluezoneexperience.guestyowners.com", apiKey }
   ```

2. **Look up current reservation** — Fetch the reservation report and find the matching ID. Display current details:
   ```
   Current reservation:
     ID:        69d708df770918458c2fe381
     Dates:     2026-09-20 → 2026-09-22
     Guest:     Jacob Reider
     Status:    confirmed
     Source:    owner
     Note:      Kindred Exchange - Smith Family
   ```

3. **Ask what to change** — Present the editable fields and ask the user what they want to modify:
   - Check-in date
   - Check-out date
   - Notes/description

4. **Confirm with user** — Show a before/after summary and ASK FOR EXPLICIT CONFIRMATION.
   **DO NOT proceed without user saying yes.**

5. **Create alteration** — POST to `https://app.guesty.com/api/reservations-fegw/alterations`:

   For **date changes** (dates MUST be nested inside a `dates` object):
   ```json
   {
     "reservationId": "<reservationId>",
     "dates": {
       "checkInDateLocalized": "<newCheckIn>",
       "checkOutDateLocalized": "<newCheckOut>"
     },
     "guestsCount": 1,
     "numberOfGuests": { "numberOfAdults": 1, "numberOfChildren": 0, "numberOfInfants": 0 }
   }
   ```

   For **status changes** (e.g., cancel — use `/guesty:cancel` instead):
   ```json
   {
     "reservationId": "<reservationId>",
     "status": "canceled"
   }
   ```

   Save the full response as `alteration`.

6. **Confirm alteration** — POST to `https://app.guesty.com/api/reservations-fegw/alterations/confirm-change`:
   ```json
   {
     ...alteration,
     "inquiryId": "<alteration._id>",
     "reservationId": "<reservationId>"
   }
   ```

7. **Verify** — Check the response shows updated values. Report success or failure.

## Notes on the alteration API
- The alteration API uses a 2-step commit pattern: create alteration → confirm change
- The alteration expires after 24 hours if not confirmed
- **Date changes** require the `dates` wrapper object — flat date fields are rejected
- For note changes only (no date changes), the alteration API may not support it directly. In that case, suggest cancel + recreate with new notes, or update via the Guesty Owners Portal web UI.

## Safety
- NEVER edit a reservation with `source` other than "owner" without triple-confirming — those are real guest bookings managed by the property manager.
- Always show before/after comparison before confirming.
