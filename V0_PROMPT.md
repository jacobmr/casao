# v0 Design Prompt for Casa Vistas

## Project Overview
Casa Vistas is a luxury vacation rental direct booking website in Costa Rica. We need a beautiful, modern, conversion-optimized design that makes guests want to book immediately.

## Current Tech Stack
- Next.js 16 (App Router)
- Tailwind CSS
- React components
- Guesty API integration (working)

## Pages to Redesign

### 1. Home/Property Showcase Page (`/`)
**Goal**: Wow visitors and drive them to book

**Elements Needed**:
- **Hero Section**: Full-screen image carousel with 39 property photos
  - Images at: `/images/en-properties-688a8aae483ff0001243e891/001.jpg` through `039.jpg`
  - Overlay text: "Casa Vistas - Your Costa Rica Paradise"
  - Prominent "Check Availability" CTA button
  
- **Quick Stats Bar**: 
  - 4 Bedrooms | 3 Bathrooms | Sleeps 8 | Ocean Views
  - Use icons (lucide-react)
  
- **Amenities Grid**: Modern card layout
  - Pool, Hot Tub, Ocean View, WiFi, Kitchen, BBQ, etc.
  - Icons + short descriptions
  
- **Photo Gallery**: Masonry or grid layout
  - Click to open lightbox
  - Show all 39 photos
  
- **Location Section**: 
  - Map embed (placeholder)
  - Nearby attractions
  
- **Sticky Booking Widget**: 
  - Always visible on scroll
  - Shows price, dates, "Book Now" button
  - Links to `/book`

**Design Style**:
- Luxury vacation rental aesthetic
- Warm, inviting colors (blues, whites, natural tones)
- High-quality image presentation
- Trust signals (reviews, verified, secure booking)

---

### 2. Booking Calendar Page (`/book`)
**Goal**: Make date selection intuitive and show real-time availability

**Current Issues**:
- Calendar looks basic
- Not mobile-friendly
- Needs better visual hierarchy

**Improvements Needed**:
- **Modern Calendar UI**:
  - Larger, touch-friendly date cells
  - Clear visual distinction between available/blocked dates
  - Smooth animations on hover
  - Show prices on available dates
  - Multi-month view on desktop
  
- **Booking Summary Card**:
  - Sticky on scroll
  - Shows selected dates, nights, guests
  - Live price calculation
  - Clear "Continue to Payment" CTA
  
- **Guest Selector**:
  - Dropdown with +/- buttons
  - Show max occupancy (8 guests)
  
- **Minimum Stay Notice**:
  - Prominent but not intrusive
  - "3-night minimum stay"

**Design Style**:
- Clean, modern booking interface
- Similar to Airbnb/VRBO but unique
- Mobile-first design
- Clear loading states

---

### 3. Payment Page (`/book/payment`)
**Goal**: Professional checkout that builds trust and converts

**Current Issues**:
- Basic form layout
- No visual hierarchy
- Needs trust signals

**Improvements Needed**:
- **Two-Column Layout** (desktop):
  - Left: Forms (guest info, payment, discount)
  - Right: Sticky booking summary
  
- **Guest Information Section**:
  - Clean form fields
  - Inline validation
  - Icons for each field
  
- **Discount Code Section**:
  - Prominent but not pushy
  - "Have a discount code?" expandable
  - Success state when applied
  
- **Payment Section** (placeholder for GuestyPay):
  - Professional card input mockup
  - Security badges (PCI, SSL)
  - "Secure payment" messaging
  
- **Booking Summary**:
  - Property photo
  - Dates, nights, guests
  - Price breakdown (clear itemization)
  - Total in large, bold text
  - "Complete Booking" button (prominent)
  
- **Trust Signals**:
  - "Secure checkout" badge
  - "Instant confirmation" message
  - Cancellation policy link
  - Customer support contact

**Design Style**:
- Professional, trustworthy
- Similar to high-end e-commerce checkout
- Clear visual hierarchy
- Minimal distractions

---

## Design Requirements

### Colors
- **Primary**: Ocean blue (#0EA5E9 or similar)
- **Secondary**: Warm sand/beige
- **Accent**: Coral/sunset orange for CTAs
- **Neutral**: Grays for text, whites for backgrounds
- **Success**: Green for confirmations
- **Error**: Red for validation

### Typography
- **Headings**: Bold, modern sans-serif (Inter, Poppins)
- **Body**: Clean, readable (Inter, System UI)
- **Sizes**: Clear hierarchy (h1: 3xl, h2: 2xl, body: base)

### Components to Use
- Tailwind CSS utilities
- lucide-react icons
- Smooth transitions and animations
- Loading skeletons
- Toast notifications (for errors/success)

### Mobile Responsiveness
- Mobile-first approach
- Touch-friendly buttons (min 44px)
- Collapsible sections on mobile
- Sticky CTAs on mobile
- Optimized images

### Conversion Optimization
- **Clear CTAs**: Large, contrasting buttons
- **Urgency**: "Only 3 dates left this month"
- **Social Proof**: "Booked 12 times this year"
- **Trust**: Security badges, reviews
- **Simplicity**: Remove friction, clear steps

---

## Technical Constraints

- Must use Next.js App Router (`'use client'` for interactive components)
- Must use Tailwind CSS (no custom CSS files)
- Must work with existing API structure:
  - Calendar data from `/api/calendar`
  - Quotes from `/api/quotes`
  - Booking to `/api/bookings`
- Must preserve existing functionality
- Images already in `/public/images/` folder

---

## Success Metrics

A successful v0 design will:
1. ✅ Look like a premium vacation rental site
2. ✅ Make users want to book immediately
3. ✅ Work perfectly on mobile and desktop
4. ✅ Build trust and reduce booking anxiety
5. ✅ Have smooth, delightful interactions
6. ✅ Show real availability and pricing clearly

---

## Reference Sites (for inspiration)
- Airbnb Luxe (premium listings)
- VRBO (vacation rentals)
- Booking.com (calendar and checkout)
- Stripe checkout (payment trust)

---

## Deliverables Needed

1. **Home page** with hero, gallery, amenities
2. **Booking calendar** with modern date picker
3. **Payment page** with professional checkout

All using Tailwind CSS, Next.js App Router, and working with our existing Guesty API integration.

---

## Additional Notes

- We have 39 high-quality property photos to showcase
- Property is in Costa Rica (tropical, luxury, ocean views)
- Target audience: Families, groups, luxury travelers
- Price point: ~$3,000/week (premium)
- Unique selling points: Ocean views, private pool, modern amenities

Make it beautiful, trustworthy, and conversion-focused! 🏝️
