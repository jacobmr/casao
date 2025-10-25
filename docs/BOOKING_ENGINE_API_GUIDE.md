# Guesty Booking Engine API - Complete Implementation Guide

**Official Docs**: https://booking-api-docs.guesty.com/

## The Three Phases (Per Guesty's Recommended Flow)

### Phase 1: Search & Evaluation
**Goal**: User finds properties and sees basic info

**Endpoints**:
- `GET /api/listings` - Get all listings
- `GET /api/listings/cities` - Get available cities (optional)

**For Casa Vistas**: We skip this (single property site)

---

### Phase 2: Selection ⭐ **WHERE WE ARE NOW**
**Goal**: User browses property details, sees calendar, gets pricing

**Endpoints**:
1. **Get Calendar** - Show availability
   ```
   GET /api/listings/{listingId}/calendar?from=2025-11-01&to=2026-01-31
   ```
   
   Response:
   ```json
   [
     {
       "date": "2025-11-01",
       "status": "available",  // or "booked"
       "minNights": 3,
       "cta": false,
       "ctd": false
     }
   ]
   ```

2. **Get Quote** - Calculate final price
   ```
   POST /api/reservations/quotes
   {
     "listingId": "...",
     "checkInDateLocalized": "2025-12-10",
     "checkOutDateLocalized": "2025-12-17",
     "adults": 2,
     "children": 0,
     "currency": "USD"
   }
   ```
   
   Response:
   ```json
   {
     "_id": "quote_id",
     "money": {
       "totalPrice": 1450.00,
       "hostPayout": 1200.00,
       "breakdown": [...]
     },
     "rates": {
       "ratePlans": [
         {
           "ratePlan": {
             "_id": "rateplan_id",
             "name": "Standard"
           }
         }
       ]
     }
   }
   ```

---

### Phase 3: Checkout 🚧 **NEED TO BUILD**
**Goal**: Collect guest info, payment, create reservation

**Steps**:
1. Input guest details (name, email, phone, address)
2. Input payment details (Stripe tokenization)
3. Confirm reservation

**Endpoint**:
```
POST /api/reservations/quotes/{quoteId}/instant
{
  "ratePlanId": "rateplan_id",  // from quote response
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "ccToken": "pm_...",  // Stripe payment method token
  "policy": {
    "agreedToTerms": true
  }
}
```

Response:
```json
{
  "_id": "reservation_id",
  "status": "confirmed",
  "confirmationCode": "ABC123",
  "platform": "direct",
  "createdAt": "..."
}
```

---

## Our Implementation

### ✅ Phase 2 - What We Have

**Calendar Component** (`/app/components/BookingCalendar.jsx`):
- ✅ Visual date picker
- ✅ Quote fetching
- ✅ Price display
- 🔧 **NEEDS FIX**: Use calendar API instead of quote testing

**API Routes**:
- ✅ `/api/quotes` - Working
- 🚧 `/api/calendar` - Need to create

### 🚧 Phase 3 - What We Need

**Payment Page** (`/app/book/payment/page.jsx`):
- Guest information form
- Stripe Elements integration
- Terms & conditions checkbox

**API Route** (`/app/api/bookings/route.js`):
- Accept quote ID, guest info, payment token
- Call Guesty instant booking endpoint
- Return confirmation

**Confirmation Page** (`/app/book/confirmation/page.jsx`):
- Show reservation details
- Confirmation code
- Email sent notice

---

## Complete User Flow

```
1. User visits /book
   ↓
2. Calendar loads → GET /api/calendar
   Shows available/blocked dates
   ↓
3. User selects dates
   ↓
4. System fetches quote → POST /api/quotes
   Shows pricing breakdown
   ↓
5. User clicks "Continue to Booking"
   ↓
6. Redirect to /book/payment?quoteId=xxx
   ↓
7. User fills guest form + payment
   ↓
8. Submit → POST /api/bookings
   ↓
9. API calls Guesty instant booking
   ↓
10. Redirect to /book/confirmation?reservationId=xxx
    ↓
11. Show confirmation + send email
```

---

## API Endpoints We Need

### 1. Calendar Endpoint (Need to Create)

**File**: `/app/api/calendar/route.js`

```javascript
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  const token = await getAccessToken();
  
  const response = await fetch(
    `https://booking.guesty.com/api/listings/${listingId}/calendar?from=${from}&to=${to}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return Response.json(data);
}
```

### 2. Quotes Endpoint (Already Have)

**File**: `/app/api/quotes/route.js` ✅

Already working!

### 3. Bookings Endpoint (Need to Create)

**File**: `/app/api/bookings/route.js`

```javascript
export async function POST(request) {
  const body = await request.json();
  const { quoteId, ratePlanId, guest, ccToken } = body;
  
  const token = await getAccessToken();
  
  const response = await fetch(
    `https://booking.guesty.com/api/reservations/quotes/${quoteId}/instant`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ratePlanId,
        guest,
        ccToken,
        policy: { agreedToTerms: true }
      })
    }
  );
  
  const data = await response.json();
  return Response.json(data);
}
```

---

## Payment Integration (Stripe)

### Setup
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Frontend (Payment Page)
```javascript
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_...');

function PaymentForm({ quoteId, ratePlanId }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });
    
    if (!error) {
      // Submit to our API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          ratePlanId,
          guest: { /* form data */ },
          ccToken: paymentMethod.id  // This is the pm_... token
        })
      });
      
      const reservation = await response.json();
      // Redirect to confirmation
      window.location.href = `/book/confirmation?id=${reservation._id}`;
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit">Complete Booking</button>
    </form>
  );
}
```

---

## Next Steps (Priority Order)

### 1. Fix Calendar (30 min)
- [ ] Create `/app/api/calendar/route.js`
- [ ] Update `BookingCalendar.jsx` to use calendar API
- [ ] Test with real availability data

### 2. Build Payment Page (2 hours)
- [ ] Create `/app/book/payment/page.jsx`
- [ ] Add guest information form
- [ ] Integrate Stripe Elements
- [ ] Add terms & conditions

### 3. Create Booking Endpoint (30 min)
- [ ] Create `/app/api/bookings/route.js`
- [ ] Call Guesty instant booking
- [ ] Handle errors

### 4. Build Confirmation Page (30 min)
- [ ] Create `/app/book/confirmation/page.jsx`
- [ ] Display reservation details
- [ ] Show confirmation code

### 5. Testing & Polish (1 hour)
- [ ] End-to-end booking test
- [ ] Error handling
- [ ] Loading states
- [ ] Email notifications (optional)

---

## Total Time Estimate: 4-5 hours to complete booking flow

Ready to start with #1 (Fix Calendar)?
