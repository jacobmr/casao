# Discount Code Implementation Plan

## 🎯 Objective

Add discount code support to Casa Vistas booking flow while maintaining seamless handoff to Blue Zone Guesty checkout.

---

## 📋 Requirements

### User Experience

1. Guest enters discount code on Casa Vistas site
2. System validates code via Guesty API
3. Shows discounted price immediately
4. Passes discount to Blue Zone checkout
5. Guest doesn't need to re-enter code

### Technical Requirements

1. Validate codes using Guesty Quote API
2. Display original + discounted prices
3. Handle invalid codes gracefully
4. Pass coupon to handoff endpoint
5. Ensure Blue Zone receives the coupon

---

## 🔍 Research Findings

### Guesty Quote API with Coupons

**Endpoint:** `POST https://booking.guesty.com/api/reservations/quotes`

**Request with Coupon:**

```json
{
  "checkInDateLocalized": "2025-11-01",
  "checkOutDateLocalized": "2025-11-04",
  "listingId": "688a8aae483ff0001243e891",
  "adults": 2,
  "coupons": "SUMMER25,WELCOME10" // ← Comma-separated codes
}
```

**Response:**

```json
{
  "_id": "quote_123",
  "coupons": [
    {
      "name": "Summer Special",
      "type": "percentage",
      "code": "SUMMER25",
      "adjustment": -250 // ← Discount amount
    }
  ],
  "rates": {
    "ratePlans": [
      {
        "money": {
          "fareAccommodation": 1200,
          "fareAccommodationAdjusted": 950, // ← After discount
          "totalPrice": 1100
        }
      }
    ]
  }
}
```

### Key Points

- ✅ Coupons validated automatically by Guesty
- ✅ Invalid codes are silently ignored (no error)
- ✅ Multiple codes can be applied (comma-separated)
- ✅ Response shows original + adjusted prices
- ⚠️ **CRITICAL ISSUE**: How to pass coupon to Blue Zone URL?

---

## 🚧 The Blue Zone Handoff Challenge

### Current Flow

```
Casa Vistas → /api/handoff → Blue Zone Guesty Checkout
```

### Current URL Format

```
https://bluezoneexperience.guestybookings.com/en/properties/688a8aae483ff0001243e891/checkout
  ?checkIn=2025-11-01
  &checkOut=2025-11-04
  &adults=2
```

### Problem

**We don't know if Blue Zone's Guesty booking page supports coupon URL parameters!**

Possible URL parameters to try:

- `&coupon=SUMMER25`
- `&couponCode=SUMMER25`
- `&promo=SUMMER25`
- `&discount=SUMMER25`

### Research Needed

1. Test Blue Zone URL with coupon parameters
2. Check if Guesty booking pages support coupon in URL
3. Contact Blue Zone to ask about coupon passing
4. Check Guesty documentation for booking page URL params

---

## 💡 Implementation Options

### Option 1: URL Parameter (Ideal)

**IF** Blue Zone supports coupon in URL:

```
https://bluezoneexperience.guestybookings.com/.../checkout
  ?checkIn=2025-11-01
  &checkOut=2025-11-04
  &adults=2
  &coupon=SUMMER25  ← Pass it here
```

**Pros:**

- ✅ Seamless - guest doesn't re-enter code
- ✅ Simple implementation
- ✅ No PM changes needed

**Cons:**

- ❌ Requires Blue Zone URL to support it
- ❌ Unknown if this works

---

### Option 2: Quote ID Handoff (Recommended)

Create quote with coupon, pass quote ID to Blue Zone:

```
1. Casa Vistas: Create quote with coupon via API
2. Get quote ID: "quote_abc123"
3. Pass to Blue Zone: ?quoteId=quote_abc123
4. Blue Zone: Retrieve quote and use it
```

**Pros:**

- ✅ Quote locks in the price with discount
- ✅ More reliable than URL params
- ✅ Guesty designed for this flow

**Cons:**

- ❌ Requires Blue Zone to support quote ID parameter
- ❌ Still unknown if Blue Zone URL supports it

---

### Option 3: Display Warning (Fallback)

Show discount on Casa Vistas, but warn guest to re-enter:

```
✅ Your discount code SUMMER25 saves you $250!

⚠️ Important: Please enter code "SUMMER25" again
   on the checkout page to apply your discount.
```

**Pros:**

- ✅ Works without Blue Zone changes
- ✅ Guest sees discount upfront
- ✅ Simple to implement

**Cons:**

- ❌ Poor UX - guest must re-enter code
- ❌ Risk of guest forgetting
- ❌ Looks unprofessional

---

### Option 4: Full Casa Vistas Checkout (Future)

Build complete checkout on Casa Vistas, create reservation via API:

**Pros:**

- ✅ Complete control
- ✅ Perfect UX
- ✅ No handoff issues

**Cons:**

- ❌ Requires Stripe integration
- ❌ Requires contract signing
- ❌ Major development effort
- ❌ PM wants to keep Blue Zone checkout

---

## 🎯 Recommended Approach

### Phase 1: Research & Test (NOW)

1. **Test Blue Zone URL parameters:**

   ```bash
   # Try these URLs manually:
   https://bluezoneexperience.guestybookings.com/en/properties/688a8aae483ff0001243e891/checkout?checkIn=2025-11-01&checkOut=2025-11-04&adults=2&coupon=TESTCODE

   https://bluezoneexperience.guestybookings.com/en/properties/688a8aae483ff0001243e891/checkout?checkIn=2025-11-01&checkOut=2025-11-04&adults=2&couponCode=TESTCODE

   https://bluezoneexperience.guestybookings.com/en/properties/688a8aae483ff0001243e891/checkout?checkIn=2025-11-01&checkOut=2025-11-04&adults=2&promo=TESTCODE
   ```

2. **Contact Blue Zone:**
   - Ask: "How do we pass discount codes via URL to your Guesty booking page?"
   - Ask: "Do you support quote ID in URL parameters?"

3. **Check Guesty Docs:**
   - Search for "booking page URL parameters"
   - Look for coupon/promo code passing

### Phase 2: Implement UI (Can Start Now)

Even without knowing the handoff solution, we can:

1. ✅ Add discount code input field
2. ✅ Validate via Quote API
3. ✅ Show discounted price
4. ✅ Store code in state
5. ⏸️ Pass to handoff (pending research)

### Phase 3: Handoff Integration (After Research)

Based on research findings:

- **Best case**: Add `&coupon=CODE` to URL
- **Good case**: Create quote, pass quote ID
- **Fallback**: Show warning to re-enter

---

## 🛠️ Technical Implementation

### 1. Update Quote API Endpoint

**File:** `/app/api/quotes/route.js`

Add coupon parameter:

```javascript
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const coupon = searchParams.get("coupon"); // ← NEW

  const body = {
    listingId,
    checkInDateLocalized: checkIn,
    checkOutDateLocalized: checkOut,
    adults: parseInt(guests),
    children: 0,
    currency: "USD",
  };

  // Add coupon if provided
  if (coupon && coupon.trim()) {
    body.coupons = coupon.trim();
  }

  // ... rest of code
}
```

### 2. Update Frontend Calendar Component

**File:** `/components/availability-calendar.tsx`

Add discount code UI:

```tsx
const [discountCode, setDiscountCode] = useState('')
const [appliedDiscount, setAppliedDiscount] = useState(null)

// In the booking summary section:
<div className="space-y-4">
  <div>
    <label>Discount Code (Optional)</label>
    <Input
      value={discountCode}
      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
      placeholder="Enter code"
    />
  </div>

  {appliedDiscount && (
    <div className="bg-green-50 p-3 rounded">
      ✅ {appliedDiscount.name} applied!
      <div className="text-lg font-bold text-green-600">
        -${appliedDiscount.adjustment}
      </div>
    </div>
  )}
</div>
```

### 3. Fetch Quote with Coupon

```tsx
const fetchQuote = async () => {
  const url = `/api/quotes?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}${
    discountCode ? `&coupon=${discountCode}` : ""
  }`;

  const response = await fetch(url);
  const data = await response.json();

  // Check if coupon was applied
  if (data.coupons && data.coupons.length > 0) {
    setAppliedDiscount(data.coupons[0]);
  } else if (discountCode) {
    // Code was entered but not applied (invalid)
    setAppliedDiscount(null);
    // Show error message
  }
};
```

### 4. Update Handoff Endpoint

**File:** `/app/api/handoff/route.js`

```javascript
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const coupon = searchParams.get("coupon"); // ← NEW

  // Build Blue Zone URL
  let guestyUrl = `https://bluezoneexperience.guestybookings.com/...?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`;

  // ⚠️ PENDING RESEARCH: How to pass coupon?
  if (coupon) {
    // Option 1: URL parameter (if supported)
    guestyUrl += `&coupon=${encodeURIComponent(coupon)}`;

    // Option 2: Quote ID (if supported)
    // const quote = await createQuoteWithCoupon(...)
    // guestyUrl += `&quoteId=${quote._id}`
  }
}
```

---

## 🧪 Testing Plan

### Test Cases

1. ✅ Valid coupon code → Shows discount
2. ✅ Invalid coupon code → Shows error
3. ✅ Empty code → Normal pricing
4. ✅ Multiple codes → Applies all valid ones
5. ✅ Coupon passes to Blue Zone → Discount applies
6. ❌ Coupon doesn't pass → Guest must re-enter

### Manual Testing

```bash
# Test valid code
curl "https://www.casavistas.net/api/quotes?checkIn=2025-11-01&checkOut=2025-11-04&guests=2&coupon=VALIDCODE"

# Test invalid code
curl "https://www.casavistas.net/api/quotes?checkIn=2025-11-01&checkOut=2025-11-04&guests=2&coupon=INVALID"

# Test Blue Zone URL
# Open in browser and check if discount applies:
https://bluezoneexperience.guestybookings.com/en/properties/688a8aae483ff0001243e891/checkout?checkIn=2025-11-01&checkOut=2025-11-04&adults=2&coupon=VALIDCODE
```

---

## 📝 Next Steps

### Immediate Actions

1. ⏸️ **RESEARCH**: Test Blue Zone URL with coupon parameters
2. ⏸️ **CONTACT**: Email Blue Zone about coupon passing
3. ⏸️ **DOCUMENT**: Record findings in this file
4. ✅ **IMPLEMENT**: Add discount code UI (can start now)
5. ⏸️ **INTEGRATE**: Connect handoff (after research)

### Questions to Answer

- ❓ Does Blue Zone URL support `&coupon=CODE` parameter?
- ❓ Does Blue Zone URL support `&quoteId=ID` parameter?
- ❓ What coupon codes are currently active in Guesty?
- ❓ Are coupons configured in Revenue Management (not Booking Engine API)?

---

## 🎨 UI Mockup

```
┌─────────────────────────────────────┐
│ Booking Summary                     │
├─────────────────────────────────────┤
│ Check-in: Nov 1, 2025              │
│ Check-out: Nov 4, 2025             │
│ Guests: 2                          │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Discount Code (Optional)        ││
│ │ [SUMMER25____________] [Apply]  ││
│ └─────────────────────────────────┘│
│                                     │
│ ✅ Summer Special applied!          │
│    Save $250                        │
│                                     │
│ Subtotal:        $1,200            │
│ Discount:         -$250            │
│ ─────────────────────────            │
│ Total:          $950               │
│                                     │
│ [Book This!]                       │
└─────────────────────────────────────┘
```

---

## 🔒 Security Considerations

1. ✅ Validation happens server-side (Guesty API)
2. ✅ Can't fake discounts (Guesty controls pricing)
3. ✅ Coupon codes are case-insensitive
4. ✅ No sensitive data in URL (codes are public)
5. ⚠️ Log coupon usage for analytics

---

## 📊 Success Metrics

- Discount code usage rate
- Conversion rate with vs without discount
- Average discount amount
- Most popular coupon codes
- Coupon validation errors

---

**Status:** 🟡 Research Phase  
**Next:** Test Blue Zone URL parameters  
**Blocker:** Unknown if Blue Zone supports coupon in URL
