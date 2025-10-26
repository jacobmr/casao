# UAT Test Plan - Casa Vistas

## Test Environment
- **URL:** https://www.casavistas.net
- **Tool:** Puppeteer MCP
- **Date:** October 26, 2025

## Tests to Execute

### 1. Hero Image Performance ✅
- [ ] Page loads
- [ ] Hero image appears
- [ ] Only 3 images initially loaded (not 39)
- [ ] Image carousel works
- [ ] Load time < 3 seconds

### 2. Favicon & SEO ✅
- [ ] Palm tree favicon visible in browser tab
- [ ] Page title correct: "Casa Vistas at Mar Vista | Luxury Ocean-View Rental in Brasilito, Costa Rica"
- [ ] Meta description present

### 3. Footer Updates ✅
- [ ] Email shows: info@casavistas.net
- [ ] Location shows: Brasilito, Costa Rica
- [ ] No phone number displayed
- [ ] "Book Now" link removed
- [ ] "Contact Us" link removed
- [ ] "Availability" link present

### 4. Calendar Availability ✅
- [ ] Calendar section visible
- [ ] Calendar loads without errors
- [ ] Dates are displayed
- [ ] Can navigate months

### 5. Calendar Visual Indicators ✅
- [ ] Available dates have green border
- [ ] Booked dates have red/pink background
- [ ] Legend shows correct colors
- [ ] Visual distinction is clear

### 6. Calendar Pricing ✅ (CRITICAL)
- [ ] Per-day pricing displays on available dates
- [ ] Pricing shows as "$XXX" format
- [ ] Pricing is accurate (not $0 or undefined)

### 7. Date Selection Flow ✅
- [ ] Can click available date
- [ ] Can select check-in date
- [ ] Can select check-out date
- [ ] Selected dates highlight
- [ ] Cannot select booked dates

### 8. Quote Calculation ✅
- [ ] After selecting dates, quote appears
- [ ] Total price displayed
- [ ] Breakdown shows (subtotal, taxes, total)
- [ ] "Book This!" button appears

### 9. Branded Handoff ✅ (NEW FEATURE)
- [ ] Click "Book This!" button
- [ ] Redirects to /api/handoff
- [ ] Casa O branded page appears
- [ ] Shows "You're Almost There!" message
- [ ] Shows booking reference UUID
- [ ] "Continue to Secure Checkout" button present
- [ ] URL contains checkIn, checkOut, adults parameters

### 10. Mobile Responsiveness
- [ ] Test on mobile viewport (375x667)
- [ ] Calendar is usable
- [ ] Footer is readable
- [ ] Handoff page is mobile-friendly

## Success Criteria

### Must Pass:
1. ✅ Hero loads quickly (< 3s)
2. ✅ Favicon visible
3. ✅ Footer has correct info
4. ✅ Calendar shows availability
5. ✅ **Pricing displays on calendar** (CRITICAL FIX)
6. ✅ Can select dates
7. ✅ Quote calculates
8. ✅ Branded handoff works

### Nice to Have:
- Green borders clearly visible
- Smooth animations
- No console errors
- Fast page load

## Test Execution Steps

1. Navigate to https://www.casavistas.net
2. Wait for page load
3. Verify hero and favicon
4. Scroll to footer, verify content
5. Scroll to calendar section
6. Verify calendar visual indicators
7. **Check for pricing on available dates**
8. Select check-in date
9. Select check-out date
10. Verify quote appears
11. Click "Book This!"
12. Verify handoff page
13. Take screenshots of key steps

## Expected Results

### Calendar Pricing (Most Important)
```
Available dates should show:
┌─────────────┐
│     15      │
│   $450      │ ← PRICING MUST SHOW
└─────────────┘
```

### Handoff Page
```
Should display:
- Casa Vistas logo
- "You're Almost There!" heading
- Blue Zone mention
- UUID reference
- Continue button
```

## Failure Scenarios

If pricing doesn't show:
- Check Redis cache
- Check warmup logs
- Verify pricing-fetcher ran
- Check browser console

If handoff fails:
- Check URL parameters
- Verify endpoint exists
- Check console errors
