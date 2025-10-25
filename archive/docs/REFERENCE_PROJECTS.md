# Reference Projects Analysis

## Overview
Two GitHub projects that could inform our Casa Vistas booking implementation.

---

## 1. Reserve-Guesty (⭐ HIGHLY RELEVANT)

**Repository**: https://github.com/gettingalex/Reserve-Guesty

### What It Does
- Python/Flask web app for checking availability and taking bookings
- Integrates with **legacy Guesty API** (not Booking Engine API)
- Stripe payment integration
- Availability checking with date picker
- Price calculation for selected dates

### Tech Stack
- **Backend**: Python + Flask
- **Frontend**: HTML + Bootstrap
- **APIs**: Legacy Guesty API + Stripe
- **Deployment**: Vagrant + VirtualBox

### Key Features We Can Learn From

#### 1. **Availability Checking Pattern**
```python
# They fetch calendar data for date range
url = "https://api.guesty.com/api/v2/listings/{unit}/calendar?from={fromDate}&to={toDate}"
# Check if ALL dates in range are available
allFree = all(listing['status'] == 'available' for listing in listings)
```

**For us**: We should implement similar logic after getting a quote:
- Create quote for date range
- If quote succeeds → dates available
- If quote fails with `LISTING_IS_NOT_AVAILABLE` → dates blocked

#### 2. **Price Calculation**
```python
# Sum up nightly prices for total
prices = []
for i in listings:
    prices.append(i['price'])
subTotal = sum(prices)
avgNight = subTotal/len(prices)
```

**For us**: The quote response already includes total pricing, so we don't need to calculate manually. Just extract from quote:
```javascript
const total = quote.money.totalPrice;
const breakdown = quote.money.breakdown; // fees, taxes, etc.
```

#### 3. **Stripe Integration Flow**
```python
# 1. Create customer with email and token
customer = stripe.Customer.create(
    email=request.form['stripeEmail'], 
    source=request.form['stripeToken']
)

# 2. Create charge
charge = stripe.Charge.create(
    customer=customer.id,
    amount=stripeSubTotal,
    currency='usd',
    description='Reservation - Hebergement'
)
```

**For us**: We need similar flow but adapted for Guesty Booking Engine:
1. Frontend: Collect payment info, create Stripe token (`pm_...`)
2. Backend: Pass token to Guesty instant booking endpoint as `ccToken`
3. Guesty handles the actual charge through their payment processor

### ⚠️ Important Differences

| Reserve-Guesty | Our Project (Casa Vistas) |
|----------------|---------------------------|
| Uses **Legacy Guesty API** | Uses **Booking Engine API** |
| Basic Auth (user/password) | OAuth 2.0 (client credentials) |
| `/api/v2/listings/{id}/calendar` | `/api/reservations/quotes` |
| Manual availability checking | Quote-based availability |
| Creates Stripe charge directly | Passes token to Guesty |
| **Does NOT post reservation to Guesty** | **Creates actual Guesty reservation** |

### What We Should Borrow

✅ **UI/UX Flow**:
- Date picker for check-in/check-out
- Listing selection (if we add more properties later)
- Availability feedback messages
- Price display with breakdown

✅ **Stripe Integration Pattern**:
- Frontend token collection
- Backend charge processing
- Success/error handling

✅ **Form Validation**:
- Date range validation
- Guest count validation
- Payment info validation

### What We Should NOT Copy

❌ **API Implementation**: They use legacy API with Basic Auth - we need OAuth + Booking Engine API

❌ **Availability Logic**: They check calendar status - we use quote creation

❌ **Payment Flow**: They charge directly - we pass token to Guesty

❌ **Tech Stack**: Python/Flask/Vagrant - we're using Next.js/Vercel

---

## 2. Advanced Booking Calendar

**Repository**: https://github.com/advanced-booking-calendar/advanced-booking-calendar

### Assessment
- Very minimal (1 star, 0 forks, 0 watchers)
- No clear documentation
- GPL-2.0 license
- Appears to be a generic calendar component
- **NOT Guesty-specific**

### Verdict
❌ **Not useful for our project** - too generic, no Guesty integration, minimal activity

---

## Recommendations for Casa Vistas

### Phase 1: Core Booking Flow (Current)
Based on our successful API tests, implement:

1. **Quote Creation**
   ```javascript
   POST /api/reservations/quotes
   {
     listingId, checkInDateLocalized, checkOutDateLocalized,
     adults, children, currency
   }
   ```

2. **Display Quote**
   - Total price
   - Nightly rate
   - Fees and taxes breakdown
   - Availability confirmation

3. **Stripe Payment Collection** (learn from Reserve-Guesty)
   - Use Stripe Elements for card input
   - Generate `pm_...` token on frontend
   - Never send card details to our backend

4. **Instant Booking**
   ```javascript
   POST /api/reservations/quotes/{quoteId}/instant
   {
     ratePlanId, guest, ccToken
   }
   ```

### Phase 2: Enhanced UX (Inspired by Reserve-Guesty)

1. **Availability Calendar**
   - Visual calendar showing blocked/available dates
   - Could use quote API to check date ranges
   - Highlight minimum night requirements

2. **Price Calculator**
   - Live price updates as dates change
   - Show nightly rate vs total
   - Display cleaning fees, taxes separately

3. **Multi-step Booking Form**
   - Step 1: Dates + Guests
   - Step 2: Review + Price
   - Step 3: Guest Info + Payment
   - Step 4: Confirmation

### Phase 3: Advanced Features

1. **Inquiry Mode** (if needed)
   - Toggle between instant/inquiry
   - Handle inquiry workflow

2. **Multi-property Support**
   - If you add more properties
   - Listing selection dropdown (like Reserve-Guesty)

3. **Booking Management**
   - View existing reservations
   - Modification/cancellation

---

## Code Snippets to Adapt

### From Reserve-Guesty: Date Validation

```python
# Check if all dates in range have same status
allBooked = all(listing['status'] == 'booked' for listing in listings)
allFree = all(listing['status'] == 'available' for listing in listings)

if allBooked:
    flash('Selected dates are not available.')
elif allFree:
    # Proceed to payment
elif not allBooked and not allFree:
    flash('Some selected dates are not available.')
```

**Adapt for Next.js**:
```javascript
// In our case, quote creation handles this
try {
  const quote = await createQuote(listingId, checkIn, checkOut, guests);
  // If we get here, dates are available
  return { available: true, quote };
} catch (error) {
  if (error.code === 'LISTING_IS_NOT_AVAILABLE') {
    return { available: false, reason: error.message };
  }
  throw error;
}
```

### From Reserve-Guesty: Stripe Frontend

```html
<!-- Stripe Checkout Button -->
<form action="/pay/{{ stripeSubTotal }}/" method="POST">
  <script
    src="https://checkout.stripe.com/checkout.js"
    class="stripe-button"
    data-key="{{ pub_key }}"
    data-amount="{{ stripeSubTotal }}"
    data-name="Reservation"
    data-description="Hebergement"
    data-currency="usd">
  </script>
</form>
```

**Adapt for Next.js** (use Stripe Elements instead):
```javascript
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const handleSubmit = async (e) => {
  e.preventDefault();
  const stripe = useStripe();
  const elements = useElements();
  
  // Create payment method
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: elements.getElement(CardElement),
  });
  
  if (!error) {
    // Pass paymentMethod.id as ccToken to Guesty
    await createInstantBooking(quoteId, ratePlanId, guestInfo, paymentMethod.id);
  }
};
```

---

## Next Steps

1. ✅ **Clone Reserve-Guesty locally** for reference
   ```bash
   git clone https://github.com/gettingalex/Reserve-Guesty.git ~/reference/Reserve-Guesty
   ```

2. ✅ **Study their UI/UX flow**
   - Run their app locally (if needed)
   - Screenshot the booking flow
   - Note the user experience patterns

3. ✅ **Adapt Stripe integration**
   - Use their payment flow as inspiration
   - Modernize for Stripe Elements + SCA compliance
   - Integrate with Guesty Booking Engine API

4. ✅ **Implement booking form**
   - Date picker component
   - Guest count selector
   - Price display
   - Payment form

5. ✅ **Test end-to-end**
   - Create quote
   - Collect payment
   - Create reservation
   - Show confirmation

---

## License Considerations

**Reserve-Guesty**: No explicit license in repo
- Can reference for learning
- Should not copy code directly without permission
- Use as inspiration for patterns and UX

**Advanced Booking Calendar**: GPL-2.0
- Would require our project to be GPL-2.0 if we use it
- Not relevant since it's not Guesty-specific

**Our approach**: Implement from scratch using:
- Official Guesty API docs
- Stripe official docs
- Reserve-Guesty as UX/pattern reference only
