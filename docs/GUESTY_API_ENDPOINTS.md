# Guesty Booking Engine API - Official Endpoints

**Documentation**: https://booking-api-docs.guesty.com/

## Base URL

- **All endpoints**: `https://booking.guesty.com/api/`

**IMPORTANT**: The official documentation references `booking-api.guesty.com` but this domain **does not exist** (NXDOMAIN). All endpoints are actually under `booking.guesty.com/api/`.

## Authentication

**Endpoint**: `POST https://booking.guesty.com/oauth2/token`

**Headers**:
```
Content-Type: application/x-www-form-urlencoded
```

**Body** (form-urlencoded):
```
grant_type=client_credentials
scope=booking_engine:api
client_id=YOUR_CLIENT_ID
client_secret=YOUR_CLIENT_SECRET
```

**Response**:
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

**Token Details**:
- Expires after 24 hours
- Can be renewed up to 3 times within the 24-hour period
- Use in all requests: `Authorization: Bearer {access_token}`

## Search / Listings

**Endpoint**: `GET https://booking.guesty.com/api/v1/search`

**Query Parameters**:
- `checkIn` (YYYY-MM-DD)
- `checkOut` (YYYY-MM-DD)
- `adults` (number)
- `children` (number, optional)
- `location` (optional)

**Example**:
```bash
curl --location GET 'https://booking.guesty.com/api/v1/search?checkIn=2025-12-10&checkOut=2025-12-12&adults=2' \
  --header 'Authorization: Bearer {YOUR_ACCESS_TOKEN}' \
  --header 'Content-Type: application/json'
```

## Create Quote

**Endpoint**: `POST https://booking.guesty.com/api/reservations/quotes`

**Body**:
```json
{
  "listingId": "YOUR_LISTING_ID",
  "checkInDate": "2025-12-10",
  "checkOutDate": "2025-12-12",
  "adults": 2,
  "children": 0,
  "currency": "USD"
}
```

**Response**:
```json
{
  "id": "quote_id_here",
  "money": { ... },
  "ratePlans": [ ... ]
}
```

## Create Instant Reservation

**Endpoint**: `POST https://booking.guesty.com/api/reservations/quotes/:quoteId/instant`

**Body**:
```json
{
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+11234567890"
  },
  "payment": {
    "method": "guestyPayToken",
    "token": "pm_..."
  }
}
```

**Response**:
```json
{
  "_id": "reservation_id",
  "status": "confirmed",
  "platform": "direct",
  "confirmationCode": "ABC123",
  "createdAt": "11/7/2021, 3:57:29 PM",
  "guestId": "guest_id"
}
```

## Create Inquiry Reservation

**Endpoint**: `POST https://booking.guesty.com/api/reservations/quotes/:quoteId/inquiry`

**Body**:
```json
{
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+11234567890"
  },
  "message": "Optional inquiry message"
}
```

**Response**:
```json
{
  "_id": "reservation_id",
  "status": "reserved",
  "platform": "direct",
  "createdAt": "11/7/2021, 3:57:29 PM",
  "guestId": "guest_id"
}
```

## Rate Limits

- Token can be renewed up to 3 times per 24-hour period
- Implement exponential backoff for 429 errors
- Cache tokens to avoid unnecessary requests

## Important Notes

1. **Activation Required**: Before using reservation endpoints, you must:
   - Create a manual booking in Guesty dashboard
   - Create your first reservation via the API to activate the BE API source

2. **Payment Tokens**: 
   - Pre-SCA Stripe tokens (`tok_...`) are NOT supported
   - Only SCA tokens (`pm_...`) are supported

3. **Booking Modes**: Configure in Guesty dashboard:
   - Only request to book (inquiry only)
   - Only instant booking
   - Both request to book and instant book

## Environment Variables

```bash
GUESTY_BASE_URL=https://booking.guesty.com/api
GUESTY_CLIENT_ID=your_client_id
GUESTY_CLIENT_SECRET=your_client_secret
GUESTY_OAUTH_TOKEN_URL=https://booking.guesty.com/oauth2/token
GUESTY_OAUTH_SCOPE=booking_engine:api
GUESTY_PROPERTY_ID=your_listing_id
```
