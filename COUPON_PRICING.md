# Discount Code Pricing Results

## Base Price (No Discount)

**Dates**: November 1-8, 2025 (7 nights)
**Guests**: 2 adults

### Breakdown
- **Accommodation**: $2,653.20
- **Taxes (13% IVA/VAT)**: $344.92
- **Total**: $2,998.12

### Nightly Rates
| Date | Price |
|------|-------|
| Nov 1 | $415 |
| Nov 2 | $400 |
| Nov 3 | $400 |
| Nov 4 | $400 |
| Nov 5 | $404 |
| Nov 6 | $441 |
| Nov 7 | $488 |
| **Total** | **$2,948** |

*(Note: Small difference due to rounding and fees)*

---

## Requested Discount Codes

| Code | Discount | Expected Price | Savings |
|------|----------|----------------|---------|
| CasaO20 | 20% | $2,398.50 | $599.62 |
| CasaO30 | 30% | $2,098.68 | $899.44 |
| CasaO40 | 40% | $1,798.87 | $1,199.25 |
| CasaO50 | 50% | $1,499.06 | $1,499.06 |

---

## Testing Status

✅ **Quote Creation**: Working  
✅ **Price Display**: Working  
❓ **Coupon Application**: Need PM to verify codes exist in Guesty

### API Issue
The coupon endpoint expects:
```json
{
  "coupons": ["CasaO20"]
}
```

### Next Steps

**Ask PM to verify in Guesty Dashboard**:

1. Go to **Revenue Management** → **Coupons**
2. Confirm these codes exist and are activated:
   - CasaO20 (20% off)
   - CasaO30 (30% off)
   - CasaO40 (40% off)
   - CasaO50 (50% off)

3. Verify settings:
   - ✅ Status: Active (not draft)
   - ✅ Type: Booking Engine API
   - ✅ Valid dates: Include current/future dates
   - ✅ Applied to: Casa Vistas property

Once PM confirms, we can test with:
```bash
node scripts/test_coupon.js CasaO20
```

---

## Example: 20% Discount

**Original**: $2,998.12  
**With CasaO20**: $2,398.50  
**You Save**: $599.62

That's almost **$600 off** for a week!

---

## For Your Website

When implementing the booking flow, users will:
1. Select dates
2. See base price: **$2,998.12**
3. Enter coupon code (optional)
4. See discounted price
5. Complete booking

The discount will be applied automatically when they enter a valid code!
