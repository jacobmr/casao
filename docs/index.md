# Casa Vistas - Project Documentation Index

> **Generated:** 2025-12-30 | **Scan Level:** Exhaustive | **BMad Method**

## Project Overview

**Casa Vistas** is a direct booking website for a luxury vacation rental property in Brasilito, Costa Rica. The application integrates with Guesty Booking Engine API for real-time availability and pricing, with checkout handled via a branded handoff to Blue Zone Experience's Guesty portal.

| Attribute | Value |
|-----------|-------|
| **Type** | Monolith Web Application |
| **Primary Language** | TypeScript/JavaScript |
| **Framework** | Next.js 16 with App Router |
| **Architecture** | Component-based SSR with API routes |
| **Production URL** | https://www.casavistas.net |
| **Staging URL** | https://casao.vercel.app |

---

## Quick Reference

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16, React 19 |
| **UI Components** | Radix UI + shadcn/ui |
| **Styling** | Tailwind CSS 4 |
| **Cache** | Vercel KV (Redis) |
| **External API** | Guesty Booking Engine (OAuth 2.0) |
| **Deployment** | Vercel |
| **Analytics** | Vercel Analytics, GA4, Meta Pixel |

---

## Generated Documentation

### Core Documentation

- [Architecture](./architecture.md) - System architecture, data flow, integrations
- [API Contracts](./api-contracts.md) - All API endpoints with request/response formats
- [Component Inventory](./component-inventory.md) - React component catalog
- [Source Tree Analysis](./source-tree-analysis.md) - Directory structure and critical paths
- [Development Guide](./development-guide.md) - Setup, commands, patterns, deployment

### Technical Reference

| Document | Description |
|----------|-------------|
| [architecture.md](./architecture.md) | Complete architecture documentation |
| [api-contracts.md](./api-contracts.md) | API endpoint specifications |
| [component-inventory.md](./component-inventory.md) | Component catalog and dependencies |
| [source-tree-analysis.md](./source-tree-analysis.md) | File structure and critical paths |
| [development-guide.md](./development-guide.md) | Developer onboarding and workflows |

### Feature Planning

| Document | Description |
|----------|-------------|
| [prd-family-portal.md](./prd-family-portal.md) | PRD for `/family` route - friends/family booking portal |

---

## Existing Documentation

| Document | Location | Description |
|----------|----------|-------------|
| [README.md](../README.md) | Project root | Original project readme |
| [CLAUDE.md](../CLAUDE.md) | Project root | AI assistant instructions |

---

## Getting Started

### For Development

```bash
# Clone and install
git clone <repo-url> CasaVistas
cd CasaVistas
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with Guesty credentials

# Start development
pnpm dev
# Visit http://localhost:3000
```

### For Code Understanding

1. Start with [Architecture](./architecture.md) for system overview
2. Review [Source Tree Analysis](./source-tree-analysis.md) for file locations
3. Check [API Contracts](./api-contracts.md) for endpoint details
4. Browse [Component Inventory](./component-inventory.md) for UI components

### For Feature Development

1. Read the relevant architecture section
2. Identify components to modify in the component inventory
3. Follow patterns in [Development Guide](./development-guide.md)
4. Test locally before deploying

---

## Key Entry Points

| Purpose | File(s) |
|---------|---------|
| **Home Page** | `app/page.tsx` |
| **Booking Flow** | `app/booking/page.tsx` → `app/enhance/page.tsx` → `app/api/handoff/route.js` |
| **Availability API** | `app/api/calendar/route.js` |
| **Pricing API** | `app/api/quotes/route.js` |
| **Token Management** | `lib/token-service-kv.js` (CRITICAL - always use this) |
| **Cache Operations** | `lib/kv-cache.js` |
| **Main Calendar** | `components/availability-calendar.tsx` |

---

## Critical Notes

1. **Token Rate Limit:** Guesty OAuth has a 3 requests/24h limit. Always use `lib/token-service-kv.js`
2. **Minimum Stay:** 3-night minimum enforced throughout the booking flow
3. **Checkout:** Does NOT process payments - hands off to Blue Zone Guesty portal
4. **Cache:** Refreshed nightly at 2 AM UTC via Vercel Cron

---

## BMad Method Context

This documentation was generated using the **BMad Method document-project workflow** with an exhaustive scan. It serves as the foundation for AI-assisted development and brownfield PRD creation.

**State File:** [project-scan-report.json](./project-scan-report.json)

When planning new features:
1. Reference this index as the primary documentation entry point
2. Use architecture.md for technical context
3. Use api-contracts.md for integration details
4. Use component-inventory.md for UI patterns
