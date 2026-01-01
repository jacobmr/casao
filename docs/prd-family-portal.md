# Product Requirements Document: Family Portal

> **Version:** 1.1
> **Status:** Approved
> **Created:** 2025-12-31
> **Author:** BMad Team Analysis
> **Project:** Casa Vistas

---

## Executive Summary

Build a `/family` route on casavistas.net to replace the external Salundo calendar system. This portal allows close friends and family to view availability, see who has booked, and request dates at the vacation property. The solution uses simple password protection ("JR's middle name") and integrates with the existing Guesty-powered availability system.

### Key Objectives
1. Consolidate family scheduling under casavistas.net domain
2. Provide visibility into who has booked (not just that dates are blocked)
3. Enable friends/family to request dates without Guesty's 50% discount limitation
4. Maintain owner control over final approvals and Guesty blocking

---

## Background & Context

### Current State
- **Main Booking Site:** casavistas.net uses Guesty Booking Engine API for paying guests
- **Family Scheduling:** Separate PHP app at Salundo domain using Google Calendar + AI chatbot
- **Owner Workflow:** Manual login to Guesty dashboard to block dates or view reservations
- **Pain Points:**
  - Two separate systems to manage
  - No visibility into who booked without logging into Guesty
  - Friends can't easily see availability
  - Guesty limits discounts to 50% (can't do free family stays via Guesty)

### Target State
- Unified domain: casavistas.net/family
- Color-coded calendar showing owner blocks, friend stays, and paying guests
- Simple request workflow for friends/family
- Owner notification and manual Guesty blocking (with automated reminders)

---

## User Personas

### Primary: Family & Friends (Requesters)
- **Profile:** Close friends and extended family of the property owner (JR)
- **Technical Comfort:** Varied (mobile-first assumed)
- **Goals:** Check availability, see who else is visiting, request dates
- **Constraints:** Not paying guests; need simplified booking flow

### Secondary: Property Owner (JR)
- **Profile:** Property owner managing both paying guests and family access
- **Goals:** Single view of all bookings, control over approvals, easy blocking workflow
- **Constraints:** Limited time; needs automated reminders for manual tasks

---

## Functional Requirements

### FR1: Password Protection
| ID | Requirement | Priority |
|----|-------------|----------|
| FR1.1 | Portal protected by simple password prompt | P0 |
| FR1.2 | Password prompt: "What's JR's middle name?" | P0 |
| FR1.3 | Answer: "michael" (case-insensitive) | P0 |
| FR1.4 | Session persists for 30 days via httpOnly cookie | P1 |
| FR1.5 | Progressive hints on failed attempts | P2 |

> **Security Note (Intentional Design Decision):** The simple password approach is a deliberate trade-off. This portal is for close friends/family who already know JR personally - the question serves as a gentle gate, not enterprise-grade security. The portal only exposes calendar availability (not financial or PII data). Server-side validation with bcrypt hashing prevents brute-force attacks. Password is stored as `FAMILY_PORTAL_PASSWORD` env var (bcrypt hash) - rotation requires env var update in Vercel dashboard.

### FR2: Unified Calendar View
| ID | Requirement | Priority |
|----|-------------|----------|
| FR2.1 | Display calendar with 6-month lookahead | P0 |
| FR2.2 | Color-coded date cells: Available (green), Family/Friend (blue), Owner (gray), Paying Guest (light gray) | P0 |
| FR2.3 | Merge data from Vercel KV (family bookings) + Guesty API (paying guests/blocks) | P0 |
| FR2.4 | Show guest name/initials on family booking dates | P0 |
| FR2.5 | Click family booking to see details (name, dates, guest count, notes) | P1 |
| FR2.6 | Upcoming Stays sidebar showing chronological list | P1 |
| FR2.7 | Mobile-optimized with swipe navigation | P0 |

### FR3: Booking Request Flow
| ID | Requirement | Priority |
|----|-------------|----------|
| FR3.1 | Date range selection from calendar | P0 |
| FR3.2 | Request form fields: Name (required), Guests (1-12), Notes (optional) | P0 |
| FR3.3 | Validate dates not conflicting with existing approved bookings | P0 |
| FR3.4 | Store request in Vercel KV with `status: "pending"` | P0 |
| FR3.5 | Confirmation screen: "Request sent - awaiting JR's approval" | P0 |
| FR3.6 | Push notification to owner on new request | P0 |
| FR3.7 | **Pending requests do NOT appear on calendar** (only owner sees in admin) | P0 |
| FR3.8 | Owner approves → status changes to "approved" → appears on calendar | P0 |
| FR3.9 | Owner rejects → status changes to "rejected" → optionally notify requester | P1 |

### FR4: Owner Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR4.1 | Admin view at `/family/admin` (owner only) | P0 |
| FR4.2 | List pending requests with Approve/Reject actions | P0 |
| FR4.3 | List all approved family bookings with status | P1 |
| FR4.4 | Toggle "Guesty Blocked" status when manually blocked | P1 |
| FR4.5 | Delete or edit existing bookings | P1 |
| FR4.6 | Daily push notification for approved bookings without Guesty block | P1 |

> **Note:** Owner blocks are created directly in Guesty dashboard, not through this portal.

---

## Non-Functional Requirements

### Performance
- Calendar loads < 2 seconds on 4G connection
- KV reads cached at edge for < 100ms latency

### Availability
- 99.9% uptime (inherited from Vercel platform)

### Security
- Password hashed with bcrypt in environment variable
- All routes behind middleware authentication
- No PII stored except guest names (friends/family context)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for calendar
- Screen reader support

---

## Technical Architecture

### Recommended Approach: Option D (Dual-Write with Manual Sync)

**Rationale:**
1. **Fastest implementation:** 1-2 days to production
2. **Low risk:** No brittle browser automation
3. **Fits existing stack:** Uses current Vercel KV + Guesty Booking API (read-only)
4. **Acceptable workflow:** Manual Guesty blocking matches current process

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Family Portal (/family)                   │
│                     Next.js App Router                       │
├─────────────────────────────────────────────────────────────┤
│  /family              → Password gate (middleware)          │
│  /family/availability → Calendar view                        │
│  /family/request      → Booking request form                 │
│  /family/admin        → Owner management (future)            │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
             ▼                           ▼
   ┌─────────────────┐         ┌─────────────────┐
   │   Vercel KV     │         │  Guesty Booking │
   │   (Redis)       │         │      API        │
   │                 │         │                 │
   │ family:bookings │         │ /calendar       │
   │ family:password │         │ (read-only)     │
   └─────────────────┘         └─────────────────┘
             │                           │
             └───────────┬───────────────┘
                         ▼
                ┌─────────────────┐
                │ Unified Calendar │
                │      View        │
                └─────────────────┘
```

### Data Schema

```typescript
interface FamilyBooking {
  id: string;                          // UUID
  checkIn: string;                     // YYYY-MM-DD
  checkOut: string;                    // YYYY-MM-DD
  guestName: string;                   // Who's staying
  guestEmail?: string;                 // Optional contact
  guestCount: number;                  // 1-12
  notes?: string;                      // "Mom's 60th birthday"
  status: "pending" | "approved" | "rejected";  // Approval workflow
  guestyBlocked: boolean;              // Owner marks after manual block
  createdAt: number;                   // Unix timestamp
  updatedAt: number;                   // Unix timestamp
}
```

### KV Key Structure

```
family:bookings:list     → string[]           // Array of UUIDs
family:bookings:{uuid}   → FamilyBooking      // Individual booking
family:password:hash     → string             // bcrypt hash of "michael"
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/family/auth` | Validate password, set session cookie |
| GET | `/api/family/availability` | Merged calendar (KV approved + Guesty) |
| GET | `/api/family/bookings` | List approved family bookings |
| POST | `/api/family/bookings` | Create new booking request (status: pending) |
| GET | `/api/family/admin/pending` | List pending requests (admin only) |
| POST | `/api/family/admin/approve/{id}` | Approve request (admin) |
| POST | `/api/family/admin/reject/{id}` | Reject request (admin) |
| PUT | `/api/family/bookings/{id}` | Update booking (admin) |
| DELETE | `/api/family/bookings/{id}` | Delete booking (admin) |

---

## UX Design

### Screen 1: Password Gate (`/family`)

**Layout:** Full-height centered, narrow content column (max 420px)

**Elements:**
- Heading: "Welcome to Casa Vistas Family Portal"
- Subheading: "This space is reserved for JR's close friends and family"
- Password prompt: "Quick check - what's JR's middle name?"
- Input field (auto-lowercase)
- Button: "Come on in"
- Error state: Gentle shake + progressive hints

**Tone:** Warm welcome mat, not a locked door

---

### Screen 2: Family Calendar View (`/family/availability`)

**Desktop Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Header: Logo | "Hi there!" | Sign Out               │
├────────────────────────────────┬─────────────────────┤
│                                │  UPCOMING STAYS     │
│      CALENDAR                  │  ┌───────────────┐  │
│      (Month view)              │  │ Mar 15-22     │  │
│                                │  │ Sarah M.      │  │
│      ● Available (green)       │  │ 4 guests      │  │
│      ● Family/Friend (blue)    │  └───────────────┘  │
│      ● Owner (gray)            │                     │
│      ● Unavailable (light gray)│  ┌───────────────┐  │
│                                │  │ Apr 3-10      │  │
│      [Request Dates]           │  │ The Johnsons  │  │
│                                │  │ 6 guests      │  │
└────────────────────────────────┴─────────────────────┘
```

**Mobile:** Stacked layout, sticky header, fixed bottom CTA bar

**Interactions:**
- Click available dates → Start range selection
- Click family/friend booking → Show details popover
- Swipe for month navigation on mobile

---

### Screen 3: Booking Request Form (`/family/request`)

**Fields:**
1. Your Name (required)
2. Number of Guests (1-12 selector)
3. What are you celebrating? (optional, 280 char limit)

**CTA:** "Send Request to JR"

---

### Screen 4: Confirmation

**Elements:**
- Success checkmark animation
- "All set! Your request is on its way to JR"
- Request summary card
- CTAs: "Back to Calendar" / "Request More Dates"

---

### UI Components (shadcn/ui)

| Component | Usage |
|-----------|-------|
| Card | Containers for forms, summaries |
| Input | Password, name fields |
| Button | All CTAs |
| Select | Guest count dropdown |
| Textarea | Notes field |
| Calendar | Custom-extended for availability |
| Badge | Guest initials, legend items |
| Popover | Booking details on click |

### Custom Components to Build

1. **FamilyCalendar** - Extended Calendar with color-coded cells, range selection
2. **UpcomingStaysCard** - Scrollable list of upcoming reservations
3. **DateRangeSummary** - Visual display of selected dates with night count
4. **PasswordGate** - Auth wrapper with shake animation

---

## Implementation Plan

### Phase 1: Core Portal + Admin Approval (Days 1-2)
- [ ] Password gate with middleware protection
- [ ] Calendar view merging KV (approved only) + Guesty data
- [ ] Booking request form → creates pending request in KV
- [ ] Pushover notification to owner on new request
- [ ] `/family/admin` route with pending requests list
- [ ] Approve/Reject actions for pending requests
- [ ] Mobile-responsive layout

### Phase 2: Full Admin Dashboard (Day 3)
- [ ] List all approved bookings with status
- [ ] Toggle "Guesty Blocked" status
- [ ] Edit/delete bookings
- [ ] Export bookings to CSV

### Phase 3: Automated Reminders (Day 4)
- [ ] Daily cron job checking for approved but unblocked bookings
- [ ] Pushover notification to owner
- [ ] Weekly summary notification

---

## Alternatives Considered

### Option A: Hybrid Google Calendar
- Keep existing Salundo Google Calendar integration
- **Rejected:** Critical sync gap - no automated Guesty blocking

### Option B: Vercel KV + Playwright Automation
- Use browser automation to block Guesty programmatically
- **Rejected:** Fragile (Guesty UI changes), expensive (serverless execution), security risk (stored credentials)

### Option C: Full Guesty Open API Integration
- Would require Open API for programmatic owner reservations
- **Not Available:** We only have access to Guesty Booking API (read-only)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Owner forgets to block in Guesty | Medium | High | Automated daily reminders |
| Paying guest books before owner blocks | Low | High | Real-time Guesty check before family booking confirmation |
| KV data loss | Low | Medium | Daily backup to JSON file |
| Password leak | Low | Medium | Quarterly password rotation; only gives calendar access |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first family booking | < 1 week post-launch | KV booking count |
| Manual blocking compliance | > 90% within 24 hours | guestyBlocked status tracking |
| Mobile usage | > 60% of sessions | Vercel Analytics |
| Family satisfaction | Qualitative | Direct feedback from JR |

---

## Resolved Questions

| # | Question | Decision |
|---|----------|----------|
| 1 | Password rotation | ✅ **Env var only** - `FAMILY_PORTAL_PASSWORD` in Vercel dashboard |
| 2 | Guest approval workflow | ✅ **Pending approval** - requests require owner approval before appearing on calendar |
| 3 | Notification preferences | ✅ Pushover (existing integration) |
| 4 | Owner booking type | ✅ **Guesty only** - owner blocks created in Guesty dashboard, not portal |

---

## Appendix

### A. Salundo Calendar Analysis

The existing Salundo system (github.com/jacobmr/calendarSalundo) uses:
- PHP backend with Google Calendar API
- FullCalendar.js for UI
- AI chatbot (Gemini API) for natural language booking
- State machine: INITIAL → DATES_MENTIONED → DATES_CONFIRMED → NAME_COLLECTED → etc.

**Migration notes:**
- No data migration needed (start fresh)
- Domain redirect from Salundo to casavistas.net/family recommended

### B. Guesty API Limitations

**Booking Engine API (only API available):**
- Read-only calendar access
- Cannot create blocks or owner reservations
- 50% maximum discount on bookings

> This is why the Family Portal uses Vercel KV for family bookings with manual Guesty blocking by owner.

### C. Related Documentation

- [Architecture](./architecture.md)
- [API Contracts](./api-contracts.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
