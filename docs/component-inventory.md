# Casa Vistas - Component Inventory

## Overview

Casa Vistas uses a component-based architecture with Radix UI primitives enhanced by shadcn/ui styling. Components are organized into feature components and UI primitives.

## Feature Components

Located in `components/`

### Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| Navigation | `navigation.tsx` | Site header with logo and navigation links |
| Footer | `footer.tsx` | Site footer with contact info and links |

### Hero & Showcase

| Component | File | Purpose |
|-----------|------|---------|
| HeroCarousel | `hero-carousel.tsx` | Full-width image carousel with property photos |

### Property Information

| Component | File | Purpose |
|-----------|------|---------|
| PropertyHighlights | `property-highlights.tsx` | Key property features (bedrooms, pool, view) |
| PropertyDetails | `property-details.tsx` | Detailed property description and specs |
| AmenitiesGrid | `amenities-grid.tsx` | Grid of amenity icons and labels |
| TrustSignals | `trust-signals.tsx` | Trust badges (verified, reviews, etc.) |

### Booking Components

| Component | File | Purpose |
|-----------|------|---------|
| AvailabilityCalendar | `availability-calendar.tsx` | Home page calendar modal with date selection |
| BookingCalendar | `booking-calendar.tsx` | Full booking page calendar component |
| BookingSummary | `booking-summary.tsx` | Booking details summary card |
| BookingWidget | `booking-widget.tsx` | Compact booking date selector |
| PricingCard | `pricing-card.tsx` | Price breakdown display |

### Checkout Components

| Component | File | Purpose |
|-----------|------|---------|
| CheckoutForm | `checkout-form.tsx` | Guest information form |
| OrderSummary | `order-summary.tsx` | Order total with itemized breakdown |
| PaymentMethods | `payment-methods.tsx` | Payment option display |

### Experience Components

Located in `components/experiences/`

| Component | File | Purpose |
|-----------|------|---------|
| ExperienceListItem | `experience-list-item.tsx` | Selectable experience card |
| DiscountBanner | `discount-banner.tsx` | 5% discount indicator |

### Provider Components

| Component | File | Purpose |
|-----------|------|---------|
| ThemeProvider | `theme-provider.tsx` | Dark/light mode provider |
| PromoProvider | `promo-provider.tsx` | Promo code context + banner |

### Analytics Components

| Component | File | Purpose |
|-----------|------|---------|
| GoogleAnalytics | `google-analytics.tsx` | GA4 script injection |
| MetaPixel | `meta-pixel.tsx` | Facebook Pixel tracking |

### Utility Components

| Component | File | Purpose |
|-----------|------|---------|
| CacheRefresher | `cache-refresher.tsx` | Triggers cache warmup on page load |

---

## UI Primitives (shadcn/ui)

Located in `components/ui/`

These are pre-styled Radix UI primitives from shadcn/ui:

| Component | Description |
|-----------|-------------|
| Button | Action buttons with variants |
| Card | Container cards with header/content/footer |
| Dialog | Modal dialogs |
| Select | Dropdown select menus |
| Tabs | Tabbed content navigation |
| Toast | Toast notifications |
| Tooltip | Hover tooltips |
| Calendar | Date picker calendar |

---

## Component Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                      Page Components                         │
│  (app/page.tsx, app/booking/page.tsx, app/enhance/page.tsx) │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Feature Components                        │
│  - HeroCarousel                                              │
│  - AvailabilityCalendar ──► uses BookingCalendar logic      │
│  - PropertyHighlights                                        │
│  - AmenitiesGrid                                             │
│  - ExperienceListItem                                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    UI Primitives (shadcn/ui)                 │
│  - Button, Card, Dialog, Select, Tabs, Toast, etc.          │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Radix UI Primitives                       │
│  - @radix-ui/react-dialog, @radix-ui/react-select, etc.     │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Component Details

### AvailabilityCalendar (`availability-calendar.tsx`)

**Lines:** ~800+
**Purpose:** Main calendar modal on home page

**Features:**
- 2-month view (mobile-responsive to 1 month)
- Real-time availability fetching
- Per-day pricing display
- Date range selection (check-in/check-out)
- Minimum 3-night validation
- Pricing summary calculation
- "Check Availability" → redirects to /enhance

**State:**
- `checkIn`, `checkOut` - selected dates
- `availability` - map of date statuses
- `pricing` - map of per-day prices
- `isLoading`, `isLoadingPrice` - loading states

**API Calls:**
- `/api/calendar?year={}&month={}` - availability
- `/api/quotes` - pricing quote

---

### BookingCalendar (`booking-calendar.tsx`)

**Lines:** ~350
**Purpose:** Full-page calendar on /booking

**Features:**
- Date range selection
- Availability display
- Uses react-day-picker with custom styling
- Callbacks for date change events

---

### HeroCarousel (`hero-carousel.tsx`)

**Lines:** ~400
**Purpose:** Full-width hero image carousel

**Features:**
- Embla Carousel integration
- Auto-play with pause on hover
- Touch/swipe support
- Navigation dots
- Responsive image loading

---

### ExperienceListItem (`experience-list-item.tsx`)

**Purpose:** Selectable experience card for /enhance page

**Features:**
- Toggle selection
- Price display
- Duration/availability info
- Checkbox visual indicator

---

## Component Patterns

### Client vs Server Components

- **Client Components:** Calendar, forms, interactive elements (marked with `"use client"`)
- **Server Components:** Layout, static content

### Data Fetching Patterns

1. **useEffect + fetch:** Calendar components fetch on mount/date change
2. **URL Params:** Booking state passed via URL search params
3. **Context:** Promo codes via PromoProvider

### Styling Patterns

- Tailwind utility classes throughout
- `cn()` helper for conditional classes
- CSS variables for theming
- Responsive breakpoints: `sm:`, `md:`, `lg:`
