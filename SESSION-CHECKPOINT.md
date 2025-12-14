# Session Checkpoint - December 13, 2025

## What We Accomplished Today

### 1. ✅ Reservation Notification System
- **Implemented hourly cache refresh** to detect new bookings from VRBO/Airbnb
- Compares old vs new availability data from Guesty
- Sends SimplePush notifications when dates change from `available` → `booked`
- Updated `vercel.json` cron schedule from daily (2 AM UTC) to hourly
- Files modified:
  - `app/api/warmup-cache/route.js` - Added change detection and notification logic
  - `vercel.json` - Changed cron to `0 * * * *` (hourly)

### 2. ✅ Quick Cache Refresh URL
- **Added `?cache_JMR` URL parameter** for manual cache refresh
- Visit `https://www.casavistas.net/?cache_JMR` to refresh availability
- Shows notification in top-right corner with progress
- Auto-reloads page after completion
- Files created:
  - `components/cache-refresher.tsx` - Refresh UI component
  - `app/page.tsx` - Added searchParams support

### 3. ✅ Fixed SimplePush Notifications
- **Problem:** SimplePush key had `\n` newline character in production
- **Solution:** Updated Vercel environment variable to `casaVi` (without newline)
- **Verified:** All booking paths now send notifications via `/api/handoff`

### 4. ✅ Enforced 3-Night Minimum
- **Problem:** Booking calendar allowed < 3 nights, causing Guesty errors
- **Solution:** Added validation to prevent checkout selection before 3 nights
- Files modified:
  - `components/booking-calendar.tsx` - Added 3-night minimum check (lines 151-156)
  - `components/booking-calendar.tsx` - Added helper text (lines 292-294)
  - `app/booking/page.tsx` - Disabled button for < 3 nights

### 5. ✅ Improved Notification Messages
- Changed single-date detection from `"(1 night)"` to `"New booking on [date]"`
- More accurate messaging for partial booking detection

---

## Current Integration Project: Salundo Calendar + Casa Vistas

### The Goal
Merge salundo-calendar (PHP/Google Calendar) into Casa Vistas to create unified system where:
- **Public users** see only Guesty availability (commercial bookings)
- **Friends/family** see additional availability based on owner block categories
- **All bookings** stored in one Google Calendar
- **Shut down** the separate PHP salundo-calendar site

### Why We Can't Use Guesty Open API
- Property manager won't provide Open API credentials (account-wide access)
- Only have Booking Engine API (read-only, no owner block metadata)
- **Solution:** Use Google Calendar as the bridge

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                 Casa Vistas (Next.js)                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐         ┌──────────────────┐     │
│  │   Guesty     │         │ Google Calendar  │     │
│  │   (Public    │         │ (Owner Blocks +  │     │
│  │   Bookings)  │         │  Friends/Family) │     │
│  └──────────────┘         └──────────────────┘     │
│         │                           │               │
│         └───────────┬───────────────┘               │
│                     ▼                                │
│          Unified Availability API                   │
│         (applies rules by user type)                │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Three Owner Block Categories

**Category 1: OWNER-FULL**
- You + Alicia both here
- Fully blocked - no guests allowed
- Not visible to anyone

**Category 2: OWNER-FRIENDS**
- Public blocked, but friends/family welcome
- Shown as "available" to authenticated friends only

**Category 3: OWNER-SOLO**
- You alone, open to friends/family/Kindred
- Shown as "available" to authenticated friends
- Compatible with Kindred bookings

### Salundo-Calendar Technical Details

**Location:** `/Users/jmr/dev/salundo-calendar`

**Tech Stack:**
- PHP backend
- Google Calendar API for storage
- AI chatbot using Gemini API
- FullCalendar.js for UI
- No database - all events in Google Calendar

**Google Calendar ID:**
```
c_3d8960421a7c6f85186c09691337e19aea403d7636c58fd36fb7c0278768680f@group.calendar.google.com
```

**Event Types in Calendar:**
1. Kindred bookings (auto-posted from email confirmations)
2. Friends/family bookings (added by salundo chatbot)
3. Owner blocks (will add manually with category prefixes)

---

## Next Steps (Start Here Tomorrow Morning)

### Step 1: Identify Kindred Event Format ⏳ NEXT
**Action Required from JMR:**
Check your Google Calendar and find a Kindred booking. Tell Claude:
- What does the event title look like?
- Any unique pattern or text? (e.g., "[Kindred]" prefix, specific wording)
- Is there anything in the description that identifies it as Kindred?

**Why:** Need to write detection logic to automatically identify Kindred events

### Step 2: Build Google Calendar Integration
**Files to create:**
- `lib/google-calendar.ts` - Google Calendar API client
- `app/api/google-calendar/route.ts` - API endpoint to fetch events
- Add Google service account credentials

**Implementation:**
- Copy pattern from `salundo-calendar/events.php`
- Use same calendar ID and service account
- Fetch events for date range
- Return events with title, start, end, description

### Step 3: Create Unified Availability API
**File:** `app/api/unified-availability/route.ts`

**Logic:**
```typescript
async function getAvailability(date, userType) {
  // 1. Get Guesty commercial bookings
  const guestyStatus = await getGuestyAvailability(date)

  // 2. Get Google Calendar events
  const gcalEvents = await getGoogleCalendarEvents(date)

  // 3. Classify events
  const ownerBlock = gcalEvents.find(e => e.title.startsWith('OWNER-'))
  const friendBooking = gcalEvents.find(e => e.title.startsWith('FRIEND:'))
  const kindredBooking = gcalEvents.find(e => /* pattern TBD */)

  // 4. Apply visibility rules based on userType and category
  // Return: { available, reason, visibleTo }
}
```

### Step 4: Build Admin Interface
**File:** `app/admin/page.tsx`

**Features:**
- Password-protected route (use simple password in env var)
- Calendar view showing merged Guesty + Google Calendar
- Click dates to add/edit owner blocks
- Select category (OWNER-FULL, OWNER-FRIENDS, OWNER-SOLO)
- Sync to Google Calendar with proper title prefix

### Step 5: Add Friends/Family Authentication
**Implementation:**
- Magic link system (email-based, no passwords)
- Store approved friends in Redis: `friends:{email}`
- Session management to track auth level
- Middleware to protect routes

### Step 6: Update Frontend Calendars
**Files to modify:**
- `components/availability-calendar.tsx` - Home page modal
- `components/booking-calendar.tsx` - Booking page
- Both should call unified availability API
- Show different availability based on user auth level

---

## Key Questions to Answer Tomorrow

1. **Kindred event format:** What does a Kindred booking look like in Google Calendar?
2. **Service account setup:** Do we need new Google Cloud credentials or reuse salundo's?
3. **Friend authentication:** Simple password, magic links, or just email whitelist?

---

## Environment Variables Status

### Production (Vercel)
- ✅ `SIMPLEPUSH_KEY=casaVi` (fixed - no newline)
- ✅ All Guesty credentials set
- ✅ Redis URL configured
- ⏳ Need to add: `GOOGLE_SERVICE_ACCOUNT_KEY` (for Google Calendar)

### Local (.env.local)
- ✅ All variables pulled from Vercel
- ✅ SIMPLEPUSH_KEY present

---

## Files Modified Today (Ready to Commit)

```
Modified:
- app/api/warmup-cache/route.js (notification system)
- vercel.json (hourly cron)
- components/booking-calendar.tsx (3-night minimum)
- app/booking/page.tsx (3-night validation)
- app/page.tsx (cache refresh param)

Created:
- components/cache-refresher.tsx (cache refresh UI)
- SESSION-CHECKPOINT.md (this file)
```

---

## Useful Links

- **Production:** https://www.casavistas.net
- **Staging:** https://casao.vercel.app
- **Cache Refresh:** https://www.casavistas.net/?cache_JMR
- **Vercel Dashboard:** https://vercel.com/huddlehealth/casao
- **Salundo Calendar:** (local PHP site, will be shut down after migration)

---

## Notes for Tomorrow's Session

- Start by asking JMR about Kindred event format
- Keep Google Calendar integration simple - just read events first
- Don't over-engineer the admin interface - basic is fine
- Focus on getting friends to see special availability
- Test thoroughly before shutting down salundo-calendar

---

**Session End:** December 13, 2025 - Late evening
**Resume:** December 14, 2025 - Morning
**Status:** Ready to continue Google Calendar integration
