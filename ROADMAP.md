# Casa O - Product Roadmap

## ✅ COMPLETED (Tonight - Oct 25/26, 2025)

### Core Booking System
- [x] Calendar with real-time availability
- [x] Per-day pricing display
- [x] Booking redirect to PM's Guesty page
- [x] Redis cache (6 months of data)
- [x] Token management (rate limit protected)
- [x] Nightly cache refresh (cron job)
- [x] Production deployment on Vercel
- [x] Comprehensive documentation

**Status:** 🚀 LIVE at https://casao.vercel.app

---

## 📋 PHASE 2: Branding & Polish (Tomorrow - Oct 26)

### 🔧 BUG FIX: Calendar Pricing (PRIORITY)
- [ ] Fix per-day pricing display on production
- [ ] Update warmup to cache monthly pricing
- [ ] Extract pricing from availability data
- [ ] Test on production site

**Issue:** Pricing worked locally but not on production
**Root cause:** Warmup only caches availability, not pricing
**Fix:** Update warmup-cache to also populate monthly pricing cache

### 📝 Content Updates: Footer & Contact Info
- [ ] **Remove incorrect phone number**
- [ ] **Update email:** info@casavistas.net
- [ ] **Remove:** "Book Now" and "Contact Us" buttons
- [ ] **Update address:** Brasilito, Costa Rica
- [ ] Clean up footer layout

**File to update:** `/components/footer.tsx` or similar

### ⚡ Performance: Hero Image Loading
- [ ] **Optimize first image load** - Currently very slow
- [ ] Implement image optimization strategies:
  - [ ] Use Next.js Image component with priority
  - [ ] Add blur placeholder
  - [ ] Optimize image size/format (WebP)
  - [ ] Consider CDN for images
  - [ ] Lazy load other images

**Current issue:** Hero image loads slowly on initial page load
**Target:** < 1 second for hero image

### 🎨 UX Improvements: Calendar & Booking Flow
- [ ] **Modal for availability** - Calendar opens in modal instead of pushing content down
- [ ] **Smaller calendar** - Reduce size since it's in a modal
- [ ] **Better visual indicators:**
  - [ ] Darker pink for booked dates (more obvious)
  - [ ] Green border outline for available dates (clearer availability)
  - [ ] Improve contrast and readability

**Benefits:**
- Cleaner page layout (property info stays visible)
- Better mobile experience
- More professional booking flow
- Easier to see availability at a glance

### Domain Setup
- [ ] Purchase/configure custom domain (e.g., casao.com)
- [ ] Update Vercel project with custom domain
- [ ] Configure DNS records
- [ ] SSL certificate (automatic via Vercel)
- [ ] Update booking redirect URLs

### Favicon & Branding
- [ ] Design/source favicon (16x16, 32x32, 180x180)
- [ ] Create `app/favicon.ico`
- [ ] Add Apple touch icons
- [ ] Update `<title>` and meta tags
- [ ] Add Open Graph images for social sharing

**Files to update:**
- `/app/favicon.ico`
- `/app/apple-icon.png`
- `/app/layout.tsx` (metadata)

---

## 🤖 PHASE 3: AI Concierge Chatbot

### Chatbot Features

#### Core Functionality
- [ ] Chat interface (floating button + modal)
- [ ] AI-powered responses (OpenAI/Anthropic)
- [ ] Context-aware (knows property details, availability, pricing)
- [ ] Multi-language support (English, Spanish)

#### Concierge Services
- [ ] **Chef Services**
  - Private chef booking
  - Meal preferences
  - Dietary restrictions
  - Pricing information
  
- [ ] **Transportation**
  - Airport pickup/dropoff
  - Car rental recommendations
  - Local transportation tips
  - Driving directions
  
- [ ] **Spa & Wellness**
  - In-villa massage booking
  - Spa recommendations
  - Yoga instructors
  - Wellness activities
  
- [ ] **Dining**
  - Restaurant reservations
  - Local favorites
  - Delivery services
  - Special occasion planning
  
- [ ] **Grocery Stocking**
  - Pre-arrival grocery delivery
  - Shopping list creation
  - Local market recommendations
  - Specialty items
  
- [ ] **Activities**
  - Beach recommendations
  - Water sports
  - Tours and excursions
  - Local attractions

#### Smart Features
- [ ] Booking date awareness (knows guest's dates)
- [ ] Pricing estimates for services
- [ ] Vendor contact information
- [ ] Booking confirmation tracking
- [ ] Email summary of conversation

### Technical Implementation

#### Frontend
```typescript
// components/concierge-chat.tsx
- Floating chat button (bottom right)
- Modal/drawer interface
- Message history
- Typing indicators
- Quick action buttons
```

#### Backend
```javascript
// app/api/chat/route.js
- OpenAI/Anthropic integration
- Context injection (property info, dates, pricing)
- Rate limiting
- Conversation history
- Email notifications
```

#### AI Context
```
System prompt includes:
- Property details (Casa Vistas at Mar Vista)
- Available services and vendors
- Pricing information
- Local knowledge
- Booking policies
```

### Chatbot UI/UX

**Entry Points:**
1. Floating button (always visible)
2. "Need help planning?" CTA on calendar
3. Post-booking confirmation page

**Conversation Flow:**
```
Bot: "Hi! I'm your Casa O concierge. How can I help you plan an amazing stay?"

User: "I want to book a chef for my anniversary"

Bot: "Wonderful! I can help arrange a private chef. 
     When are you staying? [Shows their booking dates if known]
     
     Our partner chefs offer:
     - Romantic dinner for 2: $300-500
     - Family-style meals: $400-700
     - Full-day service: $800-1200
     
     Would you like me to connect you with our preferred chef?"

[Yes] → Collects details → Sends email to you + guest
[Tell me more] → More info about chef services
```

### Data Structure

```javascript
// Vendor database
const vendors = {
  chefs: [
    {
      name: "Chef Maria",
      specialty: "Mexican fine dining",
      pricing: "$300-500 per meal",
      contact: "chef@example.com",
      availability: "Year-round"
    }
  ],
  transportation: [...],
  spa: [...],
  restaurants: [...]
}
```

### Integration Points

**With Booking System:**
- Access to guest's booking dates
- Knows property availability
- Can suggest dates if not booked yet

**With Email:**
- Send concierge requests to you
- Send confirmation to guest
- Include conversation summary

**With Calendar:**
- "Add concierge services" button after booking
- Pre-fill guest info from booking

---

## 🎯 PHASE 4: White-Label Booking (Future)

### When GuestyPay Access Available
- [ ] Full booking flow on casao.com
- [ ] Payment collection (GuestyPay)
- [ ] Instant confirmation
- [ ] Email receipts
- [ ] Calendar invites

**Depends on:** PM providing GuestyPay credentials

---

## 📊 Success Metrics

### Phase 2 (Branding)
- Custom domain live
- Professional favicon
- Improved SEO

### Phase 3 (Chatbot)
- 50%+ of guests use chatbot
- Average 3+ services per booking
- Positive guest feedback
- Reduced manual concierge work

### Phase 4 (White-Label)
- 100% bookings on casao.com
- Zero Blue Zone branding
- Instant confirmations

---

## 🛠️ Technical Stack for Chatbot

### Recommended:
- **AI:** OpenAI GPT-4 or Anthropic Claude
- **UI:** Vercel AI SDK + React
- **Storage:** Redis (conversation history)
- **Email:** Resend or SendGrid
- **Analytics:** Track popular requests

### Cost Estimate:
- OpenAI API: ~$0.01-0.05 per conversation
- Redis: Already have it
- Email: ~$0.001 per email
- **Total:** ~$20-50/month for 500 conversations

---

## 📅 Timeline

**Tomorrow (Oct 26):**
- Morning: Domain setup
- Afternoon: Favicon & branding
- Evening: Plan chatbot features

**Next Week:**
- Chatbot design & mockups
- AI prompt engineering
- Vendor database creation
- Frontend implementation

**Week After:**
- Backend API
- Testing & refinement
- Soft launch to test guests

---

## 💡 Future Ideas

- [ ] Guest portal (view booking, add services)
- [ ] Photo gallery with AI descriptions
- [ ] Virtual tour integration
- [ ] Weather forecast for stay dates
- [ ] Packing list generator
- [ ] Local events calendar
- [ ] Loyalty program
- [ ] Referral system

---

## 📝 Notes

**Chatbot Personality:**
- Warm and helpful
- Knowledgeable about local area
- Professional but friendly
- Proactive with suggestions
- Respects guest privacy

**Key Differentiator:**
Unlike generic chatbots, this knows:
- Your specific property
- Real availability and pricing
- Actual local vendors
- Guest's booking details
- Your preferences and policies

---

**Let's build an amazing guest experience! 🌴**
