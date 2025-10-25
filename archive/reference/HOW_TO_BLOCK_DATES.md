# How to Block Dates in the Calendar

## Quick Fix Applied

I've fixed 3 issues:

1. ✅ **Removed weird icon placeholders** - Replaced with simple arrows and emojis
2. ✅ **Removed "Back to Property" link** - Simplified header
3. ✅ **Added manual date blocking** - You can now specify blocked dates

## How to Block Specific Dates

Edit: **`/app/book/blocked-dates.js`**

### Example 1: Block specific dates

```javascript
export const blockedDates = [
  '2025-12-25',  // Christmas
  '2025-12-26',  // Boxing Day  
  '2026-01-01',  // New Year
  '2026-02-14',  // Valentine's (already booked)
];
```

### Example 2: Block a date range

```javascript
import { addBlockedRange } from './blocked-dates';

export const blockedDates = [
  ...addBlockedRange('2025-12-20', '2025-12-27'),  // Christmas week
  ...addBlockedRange('2026-03-15', '2026-03-22'),  // Spring break booking
];
```

### Example 3: Mix both

```javascript
export const blockedDates = [
  // Individual dates
  '2025-11-28',  // Thanksgiving
  '2025-12-25',  // Christmas
  
  // Date ranges
  ...addBlockedRange('2026-01-10', '2026-01-17'),  // Existing reservation
  ...addBlockedRange('2026-02-01', '2026-02-08'),  // Maintenance week
];
```

## Current State

Right now, the calendar blocks:
- ✅ All past dates (automatic)
- ✅ Dates you specify in `blocked-dates.js`

## What the Calendar Shows

- **White** = Available
- **Gray + strikethrough** = Blocked/unavailable
- **Blue** = Selected check-in/check-out
- **Light blue** = Dates in your selected range

## To See Changes

After editing `blocked-dates.js`, the page will auto-reload and show your blocked dates.

## Future: Automatic Blocking

Later we can add automatic blocking by:
1. Fetching existing reservations from Guesty
2. Syncing with your Guesty calendar
3. Real-time availability checks

For now, manually adding blocked dates is the fastest way to get accurate availability.

## Tell Me Your Blocked Dates

**Which dates should be blocked?** Give me a list and I'll add them for you:

Example format:
- Dec 20-27, 2025 (Christmas booking)
- Jan 10-17, 2026 (existing reservation)
- Feb 1-8, 2026 (maintenance)

I'll update the file with your actual blocked dates!
