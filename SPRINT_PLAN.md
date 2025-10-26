# Sprint Plan: Complete Booking Flow & Deploy

## Goal
Complete the booking flow, clean up the codebase, and deploy v0 to Vercel for UX optimization.

---

## Sprint 1: Fix Calendar & Cleanup (1 hour)

### Task 1.1: Create Calendar API Endpoint
- [ ] Create `/app/api/calendar/route.js`
- [ ] Implement GET handler with Guesty calendar API
- [ ] Test with `curl` or browser
- [ ] Verify returns correct blocked/available dates

### Task 1.2: Update Calendar Component
- [ ] Remove quote-testing availability logic
- [ ] Add `fetchMonthAvailability()` using calendar API
- [ ] Update blocked dates from API response
- [ ] Test calendar shows correct availability

### Task 1.3: Archive Unused Files
- [ ] Move old docs to `/archive/`
- [ ] Remove `HOW_TO_BLOCK_DATES.md` (obsolete)
- [ ] Remove `/app/book/blocked-dates.js` (obsolete)
- [ ] Remove `guesty2.txt` (reference material)
- [ ] Keep only essential docs in `/docs/`

### Task 1.4: Update Documentation
- [ ] Update README.md with current status
- [ ] Keep: PRD, API_TEST_RESULTS, GUESTY_API_ENDPOINTS
- [ ] Keep: BOOKING_ENGINE_API_GUIDE, SPRINT_PLAN
- [ ] Archive: old reference materials

**Deliverable**: Calendar showing real Guesty availability

---

## Sprint 2: Payment Page (2 hours)

### Task 2.1: Create Payment Page ✅ DONE
- [x] Create `/app/book/payment/page.jsx`
- [x] Accept `quoteId` from URL params
- [x] Show booking summary (dates, guests, price)
- [x] Guest information form (firstName, lastName, email, phone)
- [x] Discount code field
- [x] Terms & conditions checkbox
- [x] Update calendar to link to payment page

### Task 2.2: Setup GuestyPay SDK
- [ ] Install GuestyPay SDK: `npm install @guestyorg/tokenization-js`
- [ ] Get payment provider ID from Guesty
- [ ] Initialize GuestyPay SDK in payment page
- [ ] Add credit card form using SDK

### Task 2.3: Payment Tokenization
- [ ] Integrate GuestyPay tokenization
- [ ] Handle card validation
- [ ] Get payment token from SDK
- [ ] Show loading states and errors

**Deliverable**: Complete payment page with GuestyPay integration

---

## Sprint 3: Complete Booking Flow (1 hour)

### Task 3.1: Create Booking API Endpoint
- [ ] Create `/app/api/bookings/route.js`
- [ ] Accept POST with quoteId, ratePlanId, guest, ccToken
- [ ] Call Guesty instant booking endpoint
- [ ] Handle success and error responses
- [ ] Return reservation details

### Task 3.2: Create Confirmation Page
- [ ] Create `/app/book/confirmation/page.jsx`
- [ ] Accept `reservationId` from URL params
- [ ] Display reservation details
- [ ] Show confirmation code
- [ ] Add "Back to Home" button

### Task 3.3: Connect the Flow
- [ ] Calendar → Payment (pass quoteId)
- [ ] Payment → Booking API (create reservation)
- [ ] Booking API → Confirmation (show success)
- [ ] Add error handling throughout

**Deliverable**: End-to-end booking flow working

---

## Sprint 4: Testing & Polish (1 hour)

### Task 4.1: End-to-End Testing
- [ ] Test full booking flow with real dates
- [ ] Test with blocked dates
- [ ] Test with minimum nights validation
- [ ] Test payment form validation
- [ ] Test error scenarios

### Task 4.2: Error Handling
- [ ] Add error boundaries
- [ ] Add user-friendly error messages
- [ ] Add retry logic for API failures
- [ ] Add loading states everywhere

### Task 4.3: UX Polish
- [ ] Ensure consistent styling
- [ ] Add loading spinners
- [ ] Add success animations
- [ ] Mobile responsiveness check
- [ ] Accessibility check

**Deliverable**: Polished, tested booking flow

---

## Sprint 5: Git Cleanup & Deployment (30 min)

### Task 5.1: Git Cleanup
- [ ] Review all changes
- [ ] Stage files: `git add .`
- [ ] Commit: `git commit -m "Complete booking flow with Guesty API integration"`
- [ ] Push to GitHub

### Task 5.2: Vercel Deployment
- [ ] Create Vercel project
- [ ] Connect GitHub repo
- [ ] Add environment variables:
  - `GUESTY_CLIENT_ID`
  - `GUESTY_CLIENT_SECRET`
  - `GUESTY_OAUTH_TOKEN_URL`
  - `GUESTY_PROPERTY_ID`
  - `GUESTY_OAUTH_SCOPE`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Deploy
- [ ] Test on production URL

### Task 5.3: Post-Deployment
- [ ] Test booking flow on Vercel
- [ ] Verify API calls work
- [ ] Check performance
- [ ] Document production URL

**Deliverable**: Live v0 on Vercel

---

## Sprint 6: v0 UX Optimization (Future)

### Areas for Improvement
- [ ] Add property photos/description page
- [ ] Improve calendar UX (multi-month view)
- [ ] Add price calendar (show prices on dates)
- [ ] Add special offers/discounts
- [ ] Email notifications
- [ ] Booking management (view/cancel)
- [ ] SEO optimization
- [ ] Analytics integration

**Deliverable**: Enhanced UX based on user feedback

---

## Files to Archive

Move to `/archive/` folder:
- `guesty.md` (reference material)
- `guesty2.txt` (old conversation)
- `HOW_TO_BLOCK_DATES.md` (obsolete approach)
- `TAILWIND_SETUP_COMPLETE.md` (one-time setup)
- `CALENDAR_SETUP.md` (superseded by BOOKING_ENGINE_API_GUIDE)
- `REFERENCE_PROJECTS.md` (reference only)
- `CALENDAR_PREVIEW.md` (superseded)
- `/app/book/blocked-dates.js` (obsolete)

Keep in root/docs:
- `README.md`
- `SPRINT_PLAN.md` (this file)
- `docs/PRD.md`
- `docs/API_TEST_RESULTS.md`
- `docs/GUESTY_API_ENDPOINTS.md`
- `docs/GUESTY_API_COMPARISON.md`
- `docs/BOOKING_ENGINE_API_GUIDE.md`
- `docs/BOOKING_CALENDAR.md`
- `BOOKING_FLOW_STATUS.md`

---

## Environment Variables Needed

### Development (`.env`)
```bash
GUESTY_BASE_URL=https://booking.guesty.com/api
GUESTY_CLIENT_ID=0oar5x3tmjD6hF3Ay5d7
GUESTY_CLIENT_SECRET=Za1CCofPzDMsOrTuuoU76hwxoYZHNDMpP1-zw7prUuLE8OxTOLhk4Vutea9kYO9J
GUESTY_OAUTH_TOKEN_URL=https://booking.guesty.com/oauth2/token
GUESTY_PROPERTY_ID=688a8aae483ff0001243e891
GUESTY_OAUTH_SCOPE=booking_engine:api
# No Stripe needed - Guesty handles all payments via GuestyPay
```

### Production (Vercel)
Same as above, set in Vercel dashboard

---

## Success Criteria

- [ ] Calendar shows real availability from Guesty
- [ ] Users can select dates and see pricing
- [ ] Users can enter guest information
- [ ] Users can enter payment information
- [ ] Booking creates real reservation in Guesty
- [ ] Confirmation page shows booking details
- [ ] Site deployed and accessible on Vercel
- [ ] All tests pass
- [ ] No console errors
- [ ] Mobile responsive

---

## Timeline

- **Sprint 1**: 1 hour (Calendar fix + cleanup)
- **Sprint 2**: 2 hours (Payment page)
- **Sprint 3**: 1 hour (Booking flow)
- **Sprint 4**: 1 hour (Testing)
- **Sprint 5**: 30 min (Deployment)

**Total**: ~5.5 hours to v0 deployment

---

## Current Status

- ✅ API integration working (token, quotes, instant booking)
- ✅ Calendar component built (needs API fix)
- ✅ Tailwind CSS configured
- ✅ Next.js 16 setup
- 🚧 Calendar using wrong availability method
- 🚧 No payment page
- 🚧 No booking endpoint
- 🚧 No confirmation page

**Next**: Start Sprint 1, Task 1.1 - Create Calendar API Endpoint

Ready to begin?
