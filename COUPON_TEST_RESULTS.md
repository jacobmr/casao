# Discount Code Test Results

## Requested Codes

| Code | Discount | Status |
|------|----------|--------|
| CasaO20 | 20% | ❓ Unable to test |
| CasaO30 | 30% | ❓ Unable to test |
| CasaO40 | 40% | ❓ Unable to test |
| CasaO50 | 50% | ❓ Unable to test |

## Issue

The quote API response doesn't include the `money` object with pricing information in the expected format. The response structure is:

```json
{
  "_id": "quote_id",
  "rates": {
    "ratePlans": [...]
  }
}
```

But we expected:

```json
{
  "_id": "quote_id",
  "money": {
    "totalPrice": 1450.00,
    "hostPayout": 1200.00
  }
}
```

## Next Steps

**Ask your PM to verify in Guesty dashboard:**

1. Go to **Revenue Management** → **Coupons**
2. Check if these codes exist:
   - CasaO20
   - CasaO30
   - CasaO40
   - CasaO50

3. Verify each coupon is:
   - ✅ **Activated** (not draft)
   - ✅ **Type**: Booking Engine API (NOT Reservations V1)
   - ✅ **Discount**: Correct percentage
   - ✅ **Valid dates**: Current/future dates
   - ✅ **Applied to**: Your property

## Alternative: Test in Guesty Dashboard

1. Go to Guesty dashboard
2. Create a test reservation
3. Try applying each coupon code
4. Verify discount is applied

## API Documentation

- **Coupon docs**: https://booking-api-docs.guesty.com/docs/coupons
- **Apply coupon**: `POST /api/reservations/quotes/{quoteId}/coupons`
- **Configuration**: Must be in Revenue Management (not BE Instance settings)

## Test Script

Once PM confirms codes are activated, we can test with:

```bash
node scripts/test_coupon.js CasaO20
```

The script will:
1. Create a test quote
2. Apply the coupon
3. Show price comparison
4. Report if coupon is valid
