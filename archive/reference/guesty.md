Here’s a tight markdown your engineer can use to quickly verify the key, auth flow, and whether the instance is “inquiries only” vs instant-book—using cURL or a tiny Python script.

⸻

Guesty Booking Engine API — Smoke Test (Auth + Booking Mode)

0) What we’re testing
	•	Auth works with our Client ID/Secret → token from booking.guesty.com/oauth2/token.
	•	Quotes can be created (works in any mode).
	•	Instant reservation from a quote:
	•	✅ success ⇒ Instant (or Both) is enabled
	•	❌ error like WRONG_PAYMENT_CONFIG ⇒ Inquiry-only mode
Docs: auth & flow, and mode-related errors.  ￼

⸻

1) Get an access token (cURL)

# NEVER run from the browser. Do this server-side.
curl -s -X POST 'https://booking.guesty.com/oauth2/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials' \
  -d 'scope=booking_engine:api' \
  -d 'client_id=YOUR_CLIENT_ID' \
  -d 'client_secret=YOUR_CLIENT_SECRET'

Expected:

{ "access_token": "eyJhbGciOi...", "token_type": "Bearer", "expires_in": 86400 }

Use the token for all subsequent calls via Authorization: Bearer <token>.  ￼

⸻

2) Quick read test (search availability)

ACCESS_TOKEN=... # paste from step 1

curl -s 'https://booking-api.guesty.com/v1/search?checkIn=2025-12-10&checkOut=2025-12-12&adults=2' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"

If you get JSON results, auth is good and BE API is reachable.  ￼

⸻

3) Create a quote (works in any mode)

You need a listingId that belongs to the account. Pick a real one that is bookable.
Endpoint per BE API:
POST https://booking.guesty.com/api/reservations/quotes  ￼

curl -s -X POST 'https://booking.guesty.com/api/reservations/quotes' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "listingId": "YOUR_LISTING_ID",
    "checkInDate": "2025-12-10",
    "checkOutDate": "2025-12-12",
    "adults": 2,
    "children": 0,
    "currency": "USD"
  }'

Expected: JSON including a quote ID and allowed rate plans. Save quote.id.  ￼

⸻

4) Mode check: Try instant and inquiry from the same quote

4a) Instant reservation from quote (will fail if inquiry-only)

QUOTE_ID=... # from step 3

curl -s -X POST 'https://booking-api.guesty.com/v1/reservations/instant' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"quoteId\": \"$QUOTE_ID\",
    \"guest\": {
      \"firstName\": \"Test\",
      \"lastName\": \"Guest\",
      \"email\": \"test@example.com\",
      \"phone\": \"+11234567890\"
    },
    \"payment\": {
      \"method\": \"guestyPayToken\",
      \"token\": \"FAKE_OR_TEST_TOKEN\"
    }
  }"

Interpretation
	•	✅ 2xx ⇒ Instant or Both is enabled (and payment path ok).
	•	❌ 4xx with text like WRONG_PAYMENT_CONFIG ⇒ account is Inquiry-only (or the BE instance booking option blocks instant).  ￼

Note: Payment objects vary by processor (GuestyPay tokenization, Stripe Checkout handoff, etc.). For a pure mode probe, you’ll usually get the config error before deep payment validation. Payment/tokenization docs:  ￼

4b) Inquiry reservation from quote (should succeed if inquiry is allowed)

curl -s -X POST 'https://booking-api.guesty.com/v1/reservations/inquiry' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"quoteId\": \"$QUOTE_ID\",
    \"guest\": {
      \"firstName\": \"Test\",
      \"lastName\": \"Guest\",
      \"email\": \"test@example.com\",
      \"phone\": \"+11234567890\"
    },
    \"message\": \"Just testing inquiry flow.\"
  }"

Interpretation
	•	✅ 2xx here but 4xx on instant ⇒ Inquiry-only.
	•	✅ Both 2xx ⇒ Both is enabled.
	•	❌ Both fail ⇒ check BE activation / listing settings or run a manual direct test booking in UI to “activate” BE reservations.  ￼

⸻

5) Same test in a tiny Python script

import os, time, requests

CLIENT_ID = os.getenv("GUESTY_CLIENT_ID")
CLIENT_SECRET = os.getenv("GUESTY_CLIENT_SECRET")
LISTING_ID = os.getenv("GUESTY_LISTING_ID")

def get_token():
    r = requests.post(
        "https://booking.guesty.com/oauth2/token",
        headers={"Content-Type":"application/x-www-form-urlencoded"},
        data={
            "grant_type":"client_credentials",
            "scope":"booking_engine:api",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET
        }
    )
    r.raise_for_status()
    j = r.json()
    return j["access_token"], int(time.time()) + j.get("expires_in", 3600)

def be_get(url, token):
    return requests.get(url, headers={"Authorization": f"Bearer {token}"})

def be_post(url, token, body):
    return requests.post(url, json=body, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type":"application/json"
    })

if __name__ == "__main__":
    token, _ = get_token()
    # 1) sanity GET
    print("Search status:", be_get(
        "https://booking-api.guesty.com/v1/search?checkIn=2025-12-10&checkOut=2025-12-12&adults=2",
        token
    ).status_code)

    # 2) create quote
    q = be_post("https://booking.guesty.com/api/reservations/quotes", token, {
        "listingId": LISTING_ID,
        "checkInDate": "2025-12-10",
        "checkOutDate": "2025-12-12",
        "adults": 2,
        "children": 0,
        "currency": "USD"
    })
    print("Quote status:", q.status_code)
    q.raise_for_status()
    quote_id = q.json()["id"]

    # 3) try instant
    inst = be_post("https://booking-api.guesty.com/v1/reservations/instant", token, {
        "quoteId": quote_id,
        "guest": {
            "firstName":"Test","lastName":"Guest",
            "email":"test@example.com","phone":"+11234567890"
        },
        "payment": {"method":"guestyPayToken","token":"TEST_OR_FAKE_TOKEN"}
    })
    print("Instant status:", inst.status_code, inst.text[:300])

    # 4) try inquiry
    inq = be_post("https://booking-api.guesty.com/v1/reservations/inquiry", token, {
        "quoteId": quote_id,
        "guest": {
            "firstName":"Test","lastName":"Guest",
            "email":"test@example.com","phone":"+11234567890"
        },
        "message":"Testing inquiry flow"
    })
    print("Inquiry status:", inq.status_code, inq.text[:300])

Readout logic
	•	Instant=2xx & Inquiry=2xx → Both
	•	Instant=4xx & Inquiry=2xx (e.g., WRONG_PAYMENT_CONFIG) → Inquiry-only
	•	Both 4xx → check BE activation, listing, payment config, or rate plan; the docs note initial “activation” may require a one-time manual direct booking in UI.  ￼

⸻

6) If the PM needs to change the mode

In Guesty dashboard: Growth → Distribution → Booking Engine API → Edit API key → Booking options: “Requests to book”, “Instant bookings”, or “Both”.  ￼

⸻

7) Common pitfalls
	•	Hitting Okta URLs or doing GET in a browser: token endpoint requires POST x-www-form-urlencoded to booking.guesty.com/oauth2/token.  ￼
	•	Using legacy reservation endpoints: prefer the Reservation Quote Flow.  ￼
	•	No payment tokenization when testing instant: you’ll get payment validation errors; for pure mode detection you’ll usually see a config error first. Payment/tokenization refs.  ￼

⸻

If you want, I can plug in a real listingId and tailor the POST bodies to your payment setup (GuestyPay token vs Stripe Checkout handoff) so this runs cleanly end-to-end.