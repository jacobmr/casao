# Booking Calendar - Visual Preview

## What You'll Get

### 📅 Interactive Calendar

```
┌─────────────────────────────────────────────────┐
│  ←        January 2026        →                 │
├─────────────────────────────────────────────────┤
│ Sun  Mon  Tue  Wed  Thu  Fri  Sat              │
│                      1    2    3                │
│  4    5    6    7    8    9   10                │
│ 11   12   13   14  [15] [16] [17]              │ ← Selected range
│[18] [19] [20] [21] [22]  23   24                │   (light blue)
│ 25   26   27   28   29   30   31                │
│                                                  │
│ ■ Selected  ▢ In Range  ⊘ Unavailable          │
└─────────────────────────────────────────────────┘
```

### 💰 Price Display

```
┌─────────────────────────────────┐
│ 👥 Guests                       │
│ ┌─────────────────────────────┐ │
│ │ 2 Guests              ▼     │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📅 Your Stay                    │
│                                  │
│ Check-in:                        │
│ Thu, Jan 15, 2026               │
│                                  │
│ Check-out:                       │
│ Thu, Jan 22, 2026               │
│ ─────────────────────────────── │
│ Duration:                        │
│ 7 nights                         │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Price Details                    │
│                                  │
│ $171.43 × 7 nights    $1,200.00 │
│ Cleaning Fee            $150.00 │
│ Service Fee             $100.00 │
│ ─────────────────────────────── │
│ Total                 $1,450.00 │
│                                  │
│ ┌─────────────────────────────┐ │
│ │  Continue to Booking        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## User Interactions

### 1. Initial State
- Calendar shows current month
- All past dates are grayed out and crossed out
- Future dates are clickable
- "Minimum stay: 7 nights" notice displayed

### 2. Selecting Check-in
**User clicks January 15**
- Date turns blue (selected)
- Calendar waits for check-out selection
- Hover over other dates shows preview range

### 3. Selecting Check-out
**User clicks January 22**
- Both dates turn blue
- Dates in between turn light blue
- "Your Stay" panel appears with dates
- Loading spinner appears
- API fetches quote

### 4. Quote Loaded
- Price breakdown displays
- "Continue to Booking" button appears
- User can adjust guest count (quote updates)

### 5. Error States

**Blocked dates in range:**
```
┌─────────────────────────────────┐
│ ⚠️ Selected range contains      │
│    unavailable dates             │
└─────────────────────────────────┘
```

**Minimum nights not met:**
```
┌─────────────────────────────────┐
│ ⚠️ Minimum stay is 7 nights     │
└─────────────────────────────────┘
```

## Color Scheme

### Date States
- **Available**: White background, black text, hover → light blue
- **Selected**: Blue background (#2563eb), white text
- **In Range**: Light blue background (#dbeafe), dark blue text
- **Blocked**: Gray background (#f3f4f6), gray text, strikethrough
- **Hovered**: Light blue background on hover

### UI Elements
- **Primary Button**: Blue (#2563eb)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)
- **Background**: Gradient from blue-50 to purple-50

## Responsive Design

### Desktop (1024px+)
```
┌────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────────────┐  ┌──────────────┐          │
│  │                  │  │              │          │
│  │    Calendar      │  │   Booking    │          │
│  │    (2 columns)   │  │   Summary    │          │
│  │                  │  │   (1 column) │          │
│  └──────────────────┘  └──────────────┘          │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌────────────────────────────────┐
│                                 │
│  ┌──────────────────────────┐  │
│  │       Calendar           │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │    Booking Summary       │  │
│  └──────────────────────────┘  │
│                                 │
└────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────┐
│                  │
│  ┌────────────┐  │
│  │  Calendar  │  │
│  └────────────┘  │
│                  │
│  ┌────────────┐  │
│  │  Summary   │  │
│  └────────────┘  │
│                  │
└──────────────────┘
```

## Animations

### Hover Effects
- Dates: Scale 1.05, background color transition (200ms)
- Buttons: Background color transition (200ms)
- Month navigation: Background color transition (200ms)

### Loading States
- Spinner: Rotating animation
- Price panel: Fade in (300ms)
- Error messages: Slide down (200ms)

### Date Selection
- Selected dates: Background color transition (200ms)
- Range highlight: Fade in (150ms)

## Accessibility Features

### Keyboard Navigation
- **Tab**: Move between dates and controls
- **Enter/Space**: Select date
- **Arrow Keys**: Navigate calendar grid
- **Escape**: Clear selection

### Screen Reader Support
- Date buttons have ARIA labels: "January 15, 2026, Available"
- Selected dates announce: "Selected as check-in date"
- Blocked dates announce: "Unavailable"
- Price updates announce: "Price updated to $1,450"

### Visual Accessibility
- High contrast ratios (WCAG AA compliant)
- Focus indicators on all interactive elements
- Large touch targets (48px minimum)
- Clear visual feedback for all states

## Example States

### Empty State
```
Select your check-in date to begin
┌─────────────────────────────────┐
│ ℹ️ Minimum stay: 7 nights       │
└─────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────┐
│ ⟳ Getting price...              │
└─────────────────────────────────┘
```

### Success State
```
┌─────────────────────────────────┐
│ Price Details                    │
│ Total: $1,450.00                │
│ [Continue to Booking]           │
└─────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────┐
│ ⚠️ Selected range contains      │
│    unavailable dates             │
└─────────────────────────────────┘
```

## To See It Live

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Visit the booking page**:
   ```
   http://localhost:3000/book
   ```

3. **Interact with the calendar**:
   - Click dates to select range
   - Change guest count
   - See live pricing
   - Test error states

## Customization Examples

### Change Minimum Nights
```jsx
<BookingCalendar minNights={3} />  // 3-night minimum
```

### Change Max Guests
```jsx
<BookingCalendar maxGuests={8} />  // Up to 8 guests
```

### Different Property
```jsx
<BookingCalendar listingId="different-id" />
```

## Next: Add Your Own Blocked Dates

Edit `BookingCalendar.jsx`:

```jsx
// Add holidays or maintenance periods
const customBlockedDates = new Set([
  '2025-12-25', // Christmas
  '2025-12-31', // New Year's Eve
  '2026-01-01', // New Year's Day
  '2026-02-14', // Valentine's Day (booked)
]);

// Merge with existing blocked dates
setBlockedDates(new Set([...blockedDates, ...customBlockedDates]));
```
