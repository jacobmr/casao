# Casa Vistas - Source Tree Analysis

## Project Root Structure

```
CasaVistas/
├── .bmad/                    # BMAD configuration (project documentation)
│   └── bmm/
│       └── config.yaml       # BMAD module configuration
├── .cache/                   # Local file cache (gitignored)
├── .claude/                  # Claude Code commands
│   └── commands/
│       └── bmad/             # BMAD slash commands
├── .vercel/                  # Vercel deployment config
├── app/                      # Next.js App Router pages and API routes
├── archive/                  # Archived/deprecated code
├── casaO-beapi-node-skeleton/ # Legacy booking engine skeleton (unused)
├── components/               # React components
├── content/                  # Static content and images
├── docs/                     # Project documentation (you are here)
├── lib/                      # Utility libraries and services
├── public/                   # Static assets served at root
├── scripts/                  # Build and utility scripts
├── styles/                   # Global CSS (if any outside app/)
├── .env.local               # Environment variables (gitignored)
├── .gitignore
├── CLAUDE.md                 # AI assistant instructions
├── README.md                 # Project readme
├── next.config.mjs          # Next.js configuration
├── package.json             # Dependencies and scripts
├── postcss.config.mjs       # PostCSS configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── vercel.json              # Vercel deployment settings
```

---

## App Directory (Next.js App Router)

```
app/
├── api/                          # API Routes
│   ├── availability/
│   │   └── route.ts             # GET - Raw Guesty availability
│   ├── booking/
│   │   └── route.ts             # Booking creation (limited use)
│   ├── calendar/
│   │   └── route.js             # GET - Cached calendar data
│   ├── cron/
│   │   └── cache-refresh/
│   │       └── route.js         # Vercel Cron - nightly cache refresh
│   ├── experience-inquiry/
│   │   └── route.ts             # POST - Experience interest capture
│   ├── handoff/
│   │   └── route.js             # GET - Checkout handoff + lead capture ⭐
│   ├── pricing/
│   │   ├── monthly/
│   │   │   └── route.js         # GET - Monthly pricing data
│   │   ├── monthly-cached/
│   │   │   └── route.js         # GET - Cached monthly pricing
│   │   └── route.ts             # Base pricing endpoint
│   ├── quotes/
│   │   └── route.js             # POST - Pricing quotes ⭐
│   ├── seasonal-approve/
│   │   └── route.ts             # POST - Admin approval
│   ├── seasonal-inquiry/
│   │   └── route.ts             # POST - Create seasonal inquiry
│   ├── seasonal-use/
│   │   └── route.ts             # POST - Mark code as used
│   ├── seasonal-verify/
│   │   └── route.ts             # GET - Verify discount code
│   ├── seed-token/              # Token seeding (dev only)
│   └── warmup-cache/
│       └── route.js             # GET - Manual cache warmup ⭐
│
├── booking/
│   └── page.tsx                 # /booking - Full calendar page ⭐
├── checkout/
│   └── page.tsx                 # /checkout - (if exists)
├── enhance/
│   └── page.tsx                 # /enhance - Experience upsells ⭐
├── experiences/
│   └── page.tsx                 # /experiences - Experience listing
├── friends/
│   └── page.tsx                 # /friends - Special discount landing
├── seasonal/
│   └── [code]/
│       └── page.tsx             # /seasonal/[code] - Dynamic seasonal pages
│
├── globals.css                  # Global Tailwind styles
├── layout.tsx                   # Root layout with providers ⭐
└── page.tsx                     # Home page ⭐
```

**⭐ = Critical files**

---

## Components Directory

```
components/
├── experiences/                 # Experience-related components
│   ├── discount-banner.tsx      # 5% discount notification
│   ├── experience-card.tsx      # Experience display card
│   └── experience-list-item.tsx # Selectable experience item
│
├── ui/                          # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   └── ...                      # Other UI components
│
├── amenities-grid.tsx          # Property amenities display
├── availability-calendar.tsx   # Home page calendar modal ⭐
├── booking-calendar.tsx        # Booking page calendar ⭐
├── booking-summary.tsx         # Booking details card
├── booking-widget.tsx          # Compact date selector
├── cache-refresher.tsx         # Cache warmup trigger
├── checkout-form.tsx           # Guest info form
├── footer.tsx                  # Site footer
├── google-analytics.tsx        # GA4 integration
├── hero-carousel.tsx           # Hero image carousel ⭐
├── meta-pixel.tsx              # Facebook Pixel
├── navigation.tsx              # Site header/nav
├── order-summary.tsx           # Order breakdown
├── payment-methods.tsx         # Payment options display
├── pricing-card.tsx            # Price display card
├── promo-provider.tsx          # Promo code context
├── property-details.tsx        # Property description
├── property-highlights.tsx     # Key property features
├── theme-provider.tsx          # Dark/light mode
└── trust-signals.tsx           # Trust badges
```

---

## Library Directory

```
lib/
├── availability-cache.js       # Availability caching utilities
├── cache-warmup.js             # Cache preloading logic
├── experiences-data.ts         # Static experience catalog ⭐
├── guesty.ts                   # Guesty API client ⭐
├── kv-cache.js                 # Redis/KV cache utilities ⭐
├── pricing-cache.js            # Pricing cache utilities
├── pricing-fetcher.js          # Batch pricing fetcher
├── promo-codes.ts              # Promo code definitions
├── token-service-kv.js         # OAuth token management ⭐⭐
├── token-service.js            # Legacy token service (file-based)
└── utils.ts                    # Common utilities (cn, etc.)
```

**⭐⭐ = Critical: ALL code must use token-service-kv.js for Guesty auth**

---

## Public Directory

```
public/
└── images/
    ├── discount-code-hint.png  # Coupon entry instruction image
    ├── hero-1.jpg              # Hero carousel images
    ├── hero-2.jpg
    ├── hero-3.jpg
    ├── hero-4.jpg
    └── ...                     # Property photos
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js config (images unoptimized, build errors ignored) |
| `tsconfig.json` | TypeScript config with `@/*` path alias |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `postcss.config.mjs` | PostCSS with Tailwind plugin |
| `vercel.json` | Vercel cron jobs and deployment settings |
| `package.json` | Dependencies and npm scripts |

---

## Entry Points

| Entry Point | Description |
|-------------|-------------|
| `app/layout.tsx` | Root layout - wraps all pages |
| `app/page.tsx` | Home page - main entry for users |
| `app/api/*/route.(ts\|js)` | API route handlers |
| `lib/token-service-kv.js` | Token management entry point |

---

## Critical Paths

### Booking Flow Path
```
app/page.tsx (Home)
  └─► components/availability-calendar.tsx
      └─► app/api/calendar/route.js
      └─► app/api/quotes/route.js
  └─► app/enhance/page.tsx
      └─► components/experiences/experience-list-item.tsx
  └─► app/api/handoff/route.js (Lead Capture + Redirect)
```

### Cache Management Path
```
lib/token-service-kv.js (Token caching)
  └─► lib/kv-cache.js (Redis operations)
      └─► app/api/warmup-cache/route.js (Manual warmup)
      └─► app/api/cron/cache-refresh/route.js (Scheduled refresh)
```

### Guesty Integration Path
```
lib/guesty.ts (API client)
  └─► lib/token-service-kv.js (Authentication)
      └─► lib/kv-cache.js (Token storage)
```
