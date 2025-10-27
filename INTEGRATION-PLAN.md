# Casa O Integration Plan - Add-ons & Roadmap Consolidation

**Date:** October 26, 2025  
**Status:** Planning Phase

---

## 🎯 Overview

This document consolidates the **Add-ons PRD** (Enhance Your Stay experiences page) with the existing **Phase 2 & 3 Roadmap** items to create a unified implementation plan for today.

---

## 📊 Current State

### ✅ What's Already Built
- Calendar with real-time availability
- Per-day pricing display
- Redis cache system (6 months of data)
- Token management (rate limit protected)
- Nightly cache refresh (cron job)
- Production deployment on Vercel
- Custom domain: casavistas.net
- Handoff endpoint (`/api/handoff`) - EXISTS

### 🐛 Known Issues
1. **Calendar pricing display bug** - Pricing works locally but not on production
2. **Hero image loading** - Very slow initial load
3. **Footer content** - Incorrect phone number, needs email/address update

---

## 🎯 Today's Goals - Integrated Approach

We can weave together multiple improvements today by working in this order:

### **Priority 1: Fix Core Issues** (1-2 hours)
1. ✅ Fix calendar pricing display bug
2. ✅ Optimize hero image loading
3. ✅ Update footer content

### **Priority 2: Enhance Booking Flow** (2-3 hours)
4. ✅ Improve calendar UX (modal, visual indicators)
5. ✅ Enhance branded checkout handoff page

### **Priority 3: Add-ons Integration** (3-4 hours)
6. ✅ Design "Enhance Your Stay" page
7. ✅ Implement tours & concierge services selection
8. ✅ Add 5% discount logic for 2+ selections
9. ✅ Integrate with booking flow

### **Priority 4: Planning** (1 hour)
10. ✅ Document chatbot integration approach

---

## 🔧 Technical Implementation Plan

### 1. Fix Calendar Pricing Bug

**Problem:** Warmup only caches availability, not pricing  
**Solution:** Update warmup-cache to also populate monthly pricing cache

**Files to modify:**
- `/app/api/warmup-cache/route.js`
- `/lib/cache-service.js` (if needed)

**Steps:**
```javascript
// In warmup-cache route:
// 1. After caching availability, also fetch pricing
// 2. Cache pricing data for each month
// 3. Verify pricing extraction from availability data
```

---

### 2. Optimize Hero Image Loading

**Current issue:** Hero image loads slowly on initial page load  
**Target:** < 1 second for hero image

**Files to modify:**
- `/components/hero-carousel.tsx`

**Implementation:**
```typescript
// Use Next.js Image component with:
- priority={true} for first image
- placeholder="blur"
- Optimize image size/format (WebP)
- Consider CDN for images
- Lazy load subsequent carousel images
```

---

### 3. Update Footer Content

**Changes needed:**
- ❌ Remove incorrect phone number
- ✅ Update email: info@casavistas.net
- ❌ Remove "Book Now" and "Contact Us" buttons
- ✅ Update address: Brasilito, Costa Rica

**File to modify:**
- `/components/footer.tsx`

---

### 4. Improve Calendar UX

**Enhancements:**
- Modal for availability (instead of pushing content down)
- Smaller calendar size (optimized for modal)
- Better visual indicators:
  - Darker pink for booked dates
  - Green border outline for available dates
  - Improved contrast and readability

**Files to modify:**
- `/components/availability-calendar.tsx`
- `/components/booking-calendar.tsx` (if used)

**Implementation:**
```typescript
// Create modal wrapper
// Adjust calendar size for modal view
// Update color scheme for better visibility
// Add clear legend for date states
```

---

### 5. Enhance Branded Checkout Handoff

**Current:** Basic handoff endpoint exists at `/app/api/handoff`  
**Enhancement:** Create beautiful interstitial page

**Files to create/modify:**
- `/app/checkout/handoff/page.tsx` (new)
- `/app/api/handoff/route.js` (enhance)

**Features:**
```typescript
// Branded interstitial page with:
- Casa O branding
- "Securing your reservation..." message
- Progress indicator
- UUID tracking
- Smooth redirect to Blue Zone Guesty
- Log handoff events
```

**Flow:**
```
Guest clicks "Book This!" 
  ↓
POST /api/handoff (generate UUID, log event)
  ↓
Redirect to /checkout/handoff?uuid=xxx
  ↓
Show branded loading page (2-3 seconds)
  ↓
Auto-redirect to Blue Zone Guesty (pre-filled)
```

---

### 6. Design "Enhance Your Stay" Page

**New route:** `/app/enhance/page.tsx`

**Layout:**
```
┌─────────────────────────────────────┐
│  Enhance Your Stay                  │
│  Make your vacation unforgettable   │
├─────────────────────────────────────┤
│  🏄 Adventures & Tours              │
│  ├─ ATV Tour ☐                      │
│  ├─ Canopy Tour ☐                   │
│  ├─ Horseback Riding ☐              │
│  └─ ... (16 total tours)            │
├─────────────────────────────────────┤
│  🌟 Concierge Services              │
│  ├─ Airport Transfers ☐             │
│  ├─ Private Chef ☐                  │
│  ├─ Massage Services ☐              │
│  └─ ... (13 total services)         │
├─────────────────────────────────────┤
│  💰 Discount Banner                 │
│  "Select 2+ experiences for 5% off" │
├─────────────────────────────────────┤
│  [Continue to Checkout] (sticky)    │
└─────────────────────────────────────┘
```

**UI/UX Features:**
- Long-scroll layout (like "buy a book" landing pages)
- Large, tappable checkboxes
- Icons/thumbnails for each item
- Highlight selected items
- Real-time discount notification
- Sticky CTA button
- Mobile-first responsive design

---

### 7. Implement Tours & Services Data

**Create data file:** `/lib/experiences-data.ts`

```typescript
export const tours = [
  {
    id: 'atv-tour',
    name: 'ATV Tour',
    summary: 'Off-road adventure through forests and beaches',
    duration: '~2 hours',
    inclusions: ['ATV rental', 'guide', 'water'],
    icon: '🏍️',
    category: 'adventure'
  },
  // ... 15 more tours
];

export const conciergeServices = [
  {
    id: 'airport-transfer',
    name: 'Airport Transfers',
    summary: 'Hassle-free pickup from Liberia or Tamarindo',
    icon: '✈️',
    category: 'transportation'
  },
  // ... 12 more services
];
```

---

### 8. Add 5% Discount Logic

**Files to create:**
- `/lib/discount-calculator.ts`
- `/app/api/apply-discount/route.js`

**Logic:**
```typescript
// discount-calculator.ts
export function calculateDiscount(
  selectedExperiences: string[],
  lodgingTotal: number
): {
  discountApplies: boolean;
  discountAmount: number;
  newTotal: number;
} {
  const discountApplies = selectedExperiences.length >= 2;
  const discountAmount = discountApplies ? lodgingTotal * 0.05 : 0;
  const newTotal = lodgingTotal - discountAmount;
  
  return { discountApplies, discountAmount, newTotal };
}
```

**Integration:**
- Store selections in session/state
- Pass to checkout handoff
- Display in booking summary
- Include in handoff URL params (for tracking)

---

### 9. Integrate with Booking Flow

**Updated Flow:**
```
1. Guest selects dates on calendar
   ↓
2. Clicks "Book This!"
   ↓
3. Redirects to /enhance?checkIn=xxx&checkOut=xxx&property=xxx
   ↓
4. Guest selects experiences (optional)
   ↓
5. Clicks "Continue to Checkout"
   ↓
6. POST /api/handoff with:
   - Booking details
   - Selected experiences
   - Discount calculation
   ↓
7. Branded handoff page (/checkout/handoff)
   ↓
8. Redirect to Blue Zone Guesty
   ↓
9. Blue Zone handles payment + contract
```

**Files to modify:**
- `/components/availability-calendar.tsx` - Update "Book This!" button
- `/app/enhance/page.tsx` - New experiences page
- `/app/api/handoff/route.js` - Accept experiences data
- `/app/checkout/handoff/page.tsx` - Display selections

**Data Flow:**
```typescript
// Store in session or URL params
interface BookingData {
  checkIn: string;
  checkOut: string;
  propertyId: string;
  guests: number;
  selectedExperiences: string[];
  discountApplied: boolean;
  discountAmount: number;
}
```

---

### 10. Chatbot Integration Planning

**Approach:** Integrate chatbot with experiences page

**Key Integration Points:**
1. **On Enhance Page:**
   - "Need help choosing?" button
   - Opens chatbot with context about tours/services
   - AI can recommend based on preferences

2. **Post-Booking:**
   - "Add more services" CTA
   - Chatbot helps with additional concierge needs

3. **Context Awareness:**
   - Knows selected experiences
   - Can suggest complementary services
   - Aware of booking dates

**Technical Stack:**
- Vercel AI SDK + React
- OpenAI GPT-4 or Anthropic Claude
- Redis for conversation history
- Email notifications (Resend/SendGrid)

**Future Phase 3 Implementation:**
```typescript
// components/concierge-chat.tsx
- Floating chat button
- Modal interface
- Context injection (experiences, dates, property)
- Smart recommendations
- Email summary of requests
```

---

## 🔄 Implementation Order (Today)

### **Morning Session (3-4 hours)**
1. ✅ Fix calendar pricing bug (30 min)
2. ✅ Optimize hero image loading (30 min)
3. ✅ Update footer content (15 min)
4. ✅ Improve calendar UX - modal & visual indicators (1.5 hours)
5. ✅ Test and verify fixes (30 min)

### **Afternoon Session (4-5 hours)**
6. ✅ Create experiences data file (30 min)
7. ✅ Build "Enhance Your Stay" page UI (2 hours)
8. ✅ Implement discount logic (45 min)
9. ✅ Enhance handoff endpoint & page (1 hour)
10. ✅ Integrate with booking flow (1 hour)
11. ✅ Test end-to-end flow (30 min)

### **Evening Session (1-2 hours)**
12. ✅ Document chatbot integration approach (30 min)
13. ✅ Update ROADMAP.md with progress (15 min)
14. ✅ Deploy to production (30 min)
15. ✅ Final testing on live site (30 min)

---

## 📦 Deliverables

### Code Files
- [x] `/app/api/warmup-cache/route.js` - Fixed pricing cache
- [x] `/components/hero-carousel.tsx` - Optimized images
- [x] `/components/footer.tsx` - Updated content
- [x] `/components/availability-calendar.tsx` - Modal & visual improvements
- [ ] `/lib/experiences-data.ts` - Tours & services data
- [ ] `/app/enhance/page.tsx` - Experiences selection page
- [ ] `/lib/discount-calculator.ts` - Discount logic
- [ ] `/app/api/handoff/route.js` - Enhanced with experiences
- [ ] `/app/checkout/handoff/page.tsx` - Branded interstitial
- [ ] `/components/concierge-chat.tsx` - Chatbot (Phase 3)

### Documentation
- [ ] This integration plan
- [ ] Updated ROADMAP.md
- [ ] Chatbot implementation guide

---

## 🎨 Design Considerations

### Enhance Your Stay Page
- **Visual Style:** Clean, modern, trust-building
- **Color Scheme:** Match Casa O branding
- **Typography:** Clear hierarchy, readable on mobile
- **Icons:** Use Lucide React icons
- **Images:** Optional thumbnails for tours (future enhancement)

### Discount Banner
```
┌─────────────────────────────────────┐
│  🎉 You've selected 2 experiences!  │
│  Save 5% on your lodging ($XXX)     │
└─────────────────────────────────────┘
```

### Handoff Page
```
┌─────────────────────────────────────┐
│        🏡 Casa O                     │
│                                      │
│   Securing Your Reservation...      │
│                                      │
│   ⏳ [Progress spinner]              │
│                                      │
│   Your selections:                   │
│   • 3 nights at Casa Vistas          │
│   • ATV Tour                         │
│   • Private Chef                     │
│   • 5% discount applied              │
│                                      │
│   Redirecting to secure checkout...  │
└─────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Calendar Fixes
- [ ] Pricing displays correctly on production
- [ ] Hero image loads in < 1 second
- [ ] Footer shows correct contact info
- [ ] Calendar opens in modal
- [ ] Visual indicators are clear

### Enhance Your Stay
- [ ] All 16 tours display correctly
- [ ] All 13 services display correctly
- [ ] Checkboxes work on mobile
- [ ] Discount banner appears at 2+ selections
- [ ] Discount calculates correctly
- [ ] Selections persist through flow

### Booking Flow
- [ ] Calendar → Enhance page works
- [ ] Enhance → Handoff works
- [ ] Handoff → Blue Zone works
- [ ] UUID tracking logs correctly
- [ ] Discount applies in summary

### Responsive Design
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1440px width)

---

## 📊 Success Metrics

### Immediate (Today)
- ✅ All bugs fixed
- ✅ Enhance page deployed
- ✅ Booking flow integrated
- ✅ 5% discount working

### Short-term (This Week)
- 📈 Track experience selection rate
- 📈 Monitor average selections per booking
- 📈 Measure discount redemption rate
- 📈 Collect user feedback

### Long-term (Phase 3)
- 🤖 Chatbot integration
- 📧 Email notifications
- 📊 Analytics dashboard
- 🌐 Multi-language support

---

## 🚀 Deployment Strategy

### Staging
1. Deploy to Vercel preview branch
2. Test all features
3. Verify pricing calculations
4. Check mobile responsiveness

### Production
1. Merge to main branch
2. Vercel auto-deploys
3. Verify on casavistas.net
4. Monitor for errors
5. Test booking flow end-to-end

---

## 💡 Future Enhancements

### Phase 3 (Next Week)
- AI Concierge Chatbot
- Smart recommendations
- Email summaries
- Vendor database

### Phase 4 (Future)
- Full white-label booking (when GuestyPay available)
- Pricing display for experiences
- Payment collection for add-ons
- Guest portal

### Nice-to-Have
- Photo gallery for tours
- Reviews/testimonials
- Virtual tours
- Weather forecast integration
- Packing list generator

---

## 📝 Notes

### Key Decisions
1. **Add-ons are interest capture only** - No payment processing yet
2. **5% discount applies to lodging only** - Not to experiences
3. **Blue Zone handles final payment** - We just pass selections
4. **UUID tracking** - For analytics and follow-up

### Dependencies
- ✅ Redis cache (already set up)
- ✅ Guesty API (already integrated)
- ✅ Vercel deployment (already configured)
- ⏳ GuestyPay credentials (future - for full white-label)

### Risks & Mitigations
- **Risk:** Discount logic errors
  - **Mitigation:** Thorough testing, clear calculations
- **Risk:** Mobile UX issues
  - **Mitigation:** Mobile-first design, extensive testing
- **Risk:** Performance degradation
  - **Mitigation:** Lazy loading, code splitting, caching

---

## 🤝 Collaboration Points

### With Property Manager (Blue Zone)
- Confirm experience list is complete
- Verify discount policy (5% on lodging)
- Coordinate on follow-up process for selections
- Share UUID tracking data

### With Guests
- Clear communication about "interest capture"
- Set expectations on pricing/availability confirmation
- Provide excellent concierge follow-up

---

## ✅ Definition of Done

Today's work is complete when:
- [x] All Phase 2 bugs are fixed
- [ ] Enhance Your Stay page is live
- [ ] 5% discount logic works correctly
- [ ] Booking flow is seamless
- [ ] Mobile experience is excellent
- [ ] Production deployment is successful
- [ ] End-to-end testing passes
- [ ] Documentation is updated

---

**Let's build an amazing guest experience! 🌴**
