# /guesty:block - Create Owner Block in Guesty

Create an owner reservation (blocked dates) in Guesty to prevent double-bookings.

## Arguments
- `<checkIn>` — Check-in date (YYYY-MM-DD) **required**
- `<checkOut>` — Check-out date (YYYY-MM-DD) **required**
- `[note]` — Optional note (default: "Owner block")

Example: `/guesty:block 2026-07-01 2026-07-05 "Family visit - Reiders"`

## Steps

1. **Parse arguments** — Extract checkIn, checkOut, and optional note from the user's input.

2. **Confirm with user** — Display the planned block and ASK FOR CONFIRMATION before proceeding:
   ```
   Creating owner block:
     Check-in:  2026-07-01
     Check-out: 2026-07-05
     Note:      Family visit - Reiders
   
   Proceed? (yes/no)
   ```
   **DO NOT proceed without explicit user confirmation.**

3. **Login** — From `/data/dev/CasaVistas/scraper/`:
   ```javascript
   const { GUESTY_EMAIL, GUESTY_PASSWORD, GUESTY_PORTAL_API_KEY } = require("./shared");
   // POST https://app.guesty.com/api/owners/auth/login
   // body: { username: GUESTY_EMAIL, password: GUESTY_PASSWORD,
   //         hostname: "bluezoneexperience.guestyowners.com", apiKey: GUESTY_PORTAL_API_KEY }
   ```

4. **Create inquiry** — POST to `https://app.guesty.com/api/reservations-fegw/inquiries/owner`:
   ```json
   {
     "unitTypeId": "688a8aae483ff0001243e891",
     "checkInDateLocalized": "<checkIn>",
     "checkOutDateLocalized": "<checkOut>",
     "guestsCount": 1,
     "numberOfGuests": { "numberOfAdults": 1, "numberOfChildren": 0, "numberOfInfants": 0 },
     "source": "owner",
     "unitId": "688a8aae483ff0001243e891"
   }
   ```
   If response includes "not availability" or "already blocked", tell the user those dates are already blocked.

5. **Confirm reservation** — POST to `https://app.guesty.com/api/reservations-fegw/reservations/owner/confirmed`:
   ```json
   {
     "inquiryId": "<inquiry._id>",
     "booker": { "_id": "68e6b8de4263082eeb8a3a98", "firstName": "Jacob", "lastName": "Reider", "fullName": "Jacob Reider" },
     "ratePlanId": "default-rateplan-id",
     "source": "owner",
     "unitId": "688a8aae483ff0001243e891",
     "notes": { "other": "<note>" },
     "plannedArrival": "15:00",
     "plannedDeparture": "10:00",
     "creationInfo": {
       "owner": { "_id": "68bf79b9c9127f17641517ea", "fullName": "Jacob Reider", "email": "<GUESTY_EMAIL>", "locale": "en-US" }
     }
   }
   ```

6. **Report result** — Show the reservation ID, confirmation code, and status.
