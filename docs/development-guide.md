# Casa Vistas - Development Guide

## Prerequisites

- **Node.js:** v18+ (v20 recommended)
- **Package Manager:** pnpm (preferred) or npm
- **Git:** For version control
- **Vercel CLI:** Optional, for local KV testing

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url> CasaVistas
cd CasaVistas
pnpm install
```

### 2. Environment Setup

Create `.env.local` with required variables:

```env
# Guesty OAuth (Required)
GUESTY_CLIENT_ID=your_client_id
GUESTY_CLIENT_SECRET=your_client_secret
GUESTY_OAUTH_TOKEN_URL=https://booking.guesty.com/oauth2/token
GUESTY_BASE_URL=https://booking.guesty.com/api
GUESTY_PROPERTY_ID=688a8aae483ff0001243e891

# Redis/KV (Required for caching)
REDIS_URL=redis://localhost:6379
# OR use Vercel KV env vars (auto-configured on Vercel)

# Push Notifications (Optional)
PUSHOVER_USER_KEY=your_user_key
PUSHOVER_API_TOKEN=your_api_token

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id
```

### 3. Run Development Server

```bash
pnpm dev
# Opens at http://localhost:3000
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

### Cache Operations

```bash
# Warm up cache (6 months of availability/pricing)
curl http://localhost:3000/api/warmup-cache

# Force cache refresh with URL param
# Visit: http://localhost:3000?cache_JMR
```

---

## Project Structure

```
app/           # Next.js App Router (pages + API)
components/    # React components
lib/           # Utilities and services
public/        # Static assets
docs/          # Documentation (you are here)
```

See [Source Tree Analysis](./source-tree-analysis.md) for detailed breakdown.

---

## Key Development Patterns

### 1. Token Management

**CRITICAL:** Always use the centralized token service:

```javascript
// ✅ CORRECT
import { getCachedToken } from '@/lib/token-service-kv';
const token = await getCachedToken();

// ❌ WRONG - Never fetch tokens directly
const response = await fetch(tokenUrl, { ... });
```

Guesty has a **3 requests per 24 hours** rate limit on token requests. The token service handles caching automatically.

### 2. API Route Pattern

```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server';
import { getCachedToken } from '@/lib/token-service-kv';

export async function GET(request) {
  try {
    const token = await getCachedToken();
    // ... make Guesty API call
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

### 3. Client Components

Mark interactive components with `"use client"`:

```tsx
"use client"

import { useState, useEffect } from "react"

export function InteractiveComponent() {
  const [state, setState] = useState(null)

  useEffect(() => {
    // Fetch data client-side
  }, [])

  return <div>...</div>
}
```

### 4. Import Aliases

Use `@/*` for project root imports:

```typescript
// ✅ Good
import { Button } from "@/components/ui/button"
import { getCachedToken } from "@/lib/token-service-kv"

// ❌ Avoid relative paths
import { Button } from "../../../components/ui/button"
```

### 5. Styling

Use Tailwind utility classes with the `cn()` helper:

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)}>
```

---

## Testing Locally

### Test Availability Calendar

1. Start dev server: `pnpm dev`
2. Open http://localhost:3000
3. Click "Check Availability" on home page
4. Calendar should show availability with pricing

### Test Booking Flow

1. Select dates in calendar (minimum 3 nights)
2. Click "Check Availability"
3. Should redirect to /enhance
4. Select experiences (optional)
5. Click "Continue to Checkout"
6. Should show lead capture form
7. Enter name/email
8. Should show interstitial and redirect to Blue Zone

### Test Cache

```bash
# Warm cache
curl http://localhost:3000/api/warmup-cache

# Check a quote
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{"checkIn":"2025-02-01","checkOut":"2025-02-05","guests":2}'
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

Vercel automatically:
- Provisions KV storage
- Sets up cron jobs (from `vercel.json`)
- Handles SSL and CDN

### Environment Variables on Vercel

Required:
- `GUESTY_CLIENT_ID`
- `GUESTY_CLIENT_SECRET`
- `GUESTY_OAUTH_TOKEN_URL`
- `GUESTY_BASE_URL`
- `GUESTY_PROPERTY_ID`

Auto-configured by Vercel KV:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

---

## Common Issues

### Token Rate Limit Hit

**Symptom:** 429 errors from Guesty OAuth endpoint

**Fix:**
1. Wait 24 hours for rate limit reset
2. Check token-service-kv.js is being used everywhere
3. Ensure Redis/KV is properly connected

### Calendar Not Loading

**Symptom:** Spinner forever on calendar

**Fix:**
1. Check browser console for errors
2. Verify `/api/calendar` returns data
3. Check Guesty credentials in `.env.local`
4. Warm cache: `curl localhost:3000/api/warmup-cache`

### Prices Not Showing

**Symptom:** Calendar shows dates but no prices

**Fix:**
1. Ensure minimum 3-night stay is selected
2. Check `/api/quotes` endpoint directly
3. Warm pricing cache

---

## Code Quality

### Build Errors

Build is configured to ignore ESLint and TypeScript errors (`next.config.mjs`). However, you should still:

1. Run `pnpm lint` before committing
2. Fix TypeScript errors in IDE
3. Use strict mode for new code

### Commit Guidelines

Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `chore:` Maintenance

---

## Useful Links

- **Production:** https://www.casavistas.net
- **Staging:** https://casao.vercel.app
- **Guesty Docs:** https://docs.guesty.com/
- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui:** https://ui.shadcn.com/
