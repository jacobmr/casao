# Interactive Booking Calendar

## Overview

A modern, interactive booking calendar component that provides a seamless booking experience similar to Airbnb, Booking.com, and other major booking platforms.

## Features

### ✨ User Experience
- **Visual date selection** - Click to select check-in and check-out dates
- **Blocked dates** - Unavailable dates are visually disabled and crossed out
- **Range preview** - Hover to preview date range before confirming
- **Real-time pricing** - Fetches live quotes from Guesty API
- **Minimum nights enforcement** - Prevents bookings shorter than minimum stay
- **Guest selection** - Dropdown to select number of guests
- **Responsive design** - Works beautifully on mobile, tablet, and desktop

### 🎨 Visual Design
- **Color-coded dates**:
  - Blue: Selected check-in/check-out
  - Light blue: Dates in selected range
  - Gray with strikethrough: Blocked/unavailable dates
  - White: Available dates
- **Smooth animations** - Hover effects and transitions
- **Clear legend** - Visual guide for date status
- **Price breakdown** - Detailed cost display with fees and taxes

### 🔧 Technical Features
- **Server-side rendering** - Fast initial load with Next.js
- **API integration** - Real-time availability via Guesty Booking Engine API
- **Error handling** - Clear feedback for blocked dates, minimum nights, etc.
- **Loading states** - Spinner while fetching quotes
- **Accessibility** - Keyboard navigation and screen reader support

## Usage

### Basic Implementation

```jsx
import BookingCalendar from '@/app/components/BookingCalendar';

export default function BookingPage() {
  return (
    <BookingCalendar 
      listingId="688a8aae483ff0001243e891"
      minNights={7}
      maxGuests={4}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `listingId` | string | required | Guesty listing/property ID |
| `minNights` | number | `7` | Minimum number of nights required |
| `maxGuests` | number | `4` | Maximum number of guests allowed |

### API Requirements

The calendar requires a `/api/quotes` endpoint that:

1. Accepts POST requests with:
   ```json
   {
     "listingId": "string",
     "checkInDateLocalized": "YYYY-MM-DD",
     "checkOutDateLocalized": "YYYY-MM-DD",
     "adults": number,
     "children": number,
     "currency": "USD"
   }
   ```

2. Returns Guesty quote response:
   ```json
   {
     "_id": "quote_id",
     "money": {
       "totalPrice": 1500.00,
       "hostPayout": 1200.00,
       "breakdown": [
         { "title": "Cleaning Fee", "amount": 150.00 },
         { "title": "Service Fee", "amount": 100.00 }
       ]
     },
     "rates": {
       "ratePlans": [...]
     }
   }
   ```

## User Flow

1. **Select Check-in Date**
   - User clicks an available date
   - Date is highlighted in blue
   - Calendar waits for check-out selection

2. **Select Check-out Date**
   - User clicks another available date
   - Range is validated:
     - Must be after check-in
     - Must meet minimum nights
     - Cannot include blocked dates
   - Range is highlighted in light blue

3. **View Pricing**
   - API automatically fetches quote
   - Loading spinner appears
   - Price breakdown displays:
     - Nightly rate × number of nights
     - Additional fees (cleaning, service, etc.)
     - Total price

4. **Adjust Guests** (optional)
   - User can change guest count
   - Quote automatically updates

5. **Continue to Booking**
   - User clicks "Continue to Booking" button
   - Redirected to payment page with quote ID

## Customization

### Styling

The calendar uses Tailwind CSS classes. Customize by modifying the component:

```jsx
// Change primary color from blue to green
className="bg-green-600 text-white hover:bg-green-700"

// Adjust calendar size
className="h-12" // Change to h-14 for larger cells

// Modify shadow and rounding
className="rounded-xl shadow-lg" // Change to rounded-2xl shadow-2xl
```

### Blocked Dates

Currently, blocked dates are determined by:
1. **Past dates** - Automatically blocked
2. **API availability** - Dates that fail quote creation

To add custom blocked dates:

```jsx
const [blockedDates, setBlockedDates] = useState(new Set([
  '2025-12-25', // Christmas
  '2025-12-31', // New Year's Eve
  '2026-01-01', // New Year's Day
]));
```

### Minimum Nights by Season

```jsx
const getMinNights = (date) => {
  const month = date.getMonth();
  // High season (Dec-Apr): 7 nights
  if (month >= 11 || month <= 3) return 7;
  // Low season: 3 nights
  return 3;
};
```

## Advanced Features

### Multi-month View

Show 2 months side-by-side for better UX:

```jsx
<div className="grid lg:grid-cols-2 gap-4">
  {renderCalendar(currentMonth)}
  {renderCalendar(nextMonth)}
</div>
```

### Price Calendar

Show prices on each date:

```jsx
<button className="relative">
  {day}
  <span className="text-xs text-gray-500">
    ${dailyPrice}
  </span>
</button>
```

### Special Offers

Highlight discounted dates:

```jsx
{hasDiscount && (
  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded">
    -20%
  </span>
)}
```

## Accessibility

The calendar includes:
- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ ARIA labels for screen readers
- ✅ Focus indicators
- ✅ Color contrast compliance
- ✅ Semantic HTML structure

## Performance

- **Lazy loading** - Calendar renders only visible months
- **Debounced API calls** - Prevents excessive quote requests
- **Cached tokens** - OAuth tokens cached for 24 hours
- **Optimized re-renders** - React hooks minimize unnecessary updates

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Calendar shows all dates as blocked

**Cause**: API endpoint not configured or returning errors

**Fix**: Check that `/api/quotes` endpoint exists and Guesty credentials are set

### Quotes not loading

**Cause**: OAuth token expired or invalid

**Fix**: Check `.cache/guesty-token.json` and regenerate if needed:
```bash
node scripts/get_token.js
```

### Minimum nights not enforced

**Cause**: `minNights` prop not set or validation logic disabled

**Fix**: Ensure `minNights` prop is passed and validation is enabled in `handleDateClick`

### Prices showing as $0

**Cause**: Quote response structure mismatch

**Fix**: Check that `quote.money.totalPrice` exists in API response

## Next Steps

### Phase 1: Current Implementation ✅
- [x] Interactive calendar with date selection
- [x] Real-time quote fetching
- [x] Price display with breakdown
- [x] Guest selection
- [x] Minimum nights validation

### Phase 2: Enhanced Features 🚧
- [ ] Multi-month view
- [ ] Price calendar (show prices on dates)
- [ ] Special offers/discounts display
- [ ] Calendar sync with external sources
- [ ] Availability cache for faster loading

### Phase 3: Advanced Booking 📋
- [ ] Payment integration (Stripe Elements)
- [ ] Guest information form
- [ ] Booking confirmation page
- [ ] Email notifications
- [ ] Booking management dashboard

## Related Files

- **Component**: `/app/components/BookingCalendar.jsx`
- **Page**: `/app/book/page.jsx`
- **API Route**: `/app/api/quotes/route.js`
- **Guesty Library**: `/lib/guesty.js`
- **Test Script**: `/scripts/test_api.js`

## Resources

- [Guesty Booking Engine API Docs](https://booking-api-docs.guesty.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
