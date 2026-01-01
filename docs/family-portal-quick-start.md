# Family Portal - Quick Start Guide

## For JR (Owner)

### Accessing the Admin Dashboard
1. Visit: `https://casavistas.net/family`
2. Enter password: `michael`
3. Click on your profile or navigate to: `https://casavistas.net/family/admin`

### Managing Booking Requests
1. You'll receive a Pushover notification when someone requests dates
2. Visit `/family/admin` to see all pending requests
3. Review the request details (dates, guest name, notes)
4. Click **Approve** or **Reject**
5. **IMPORTANT:** If you approve, manually block the dates in Guesty dashboard to prevent double bookings

### Viewing All Bookings
- Visit `/family/availability` to see the calendar
- Blue dates = approved family bookings
- Click on blue dates to see who's staying

## For Family & Friends

### First Time Access
1. Visit: `https://casavistas.net/family`
2. Enter JR's middle name (lowercase): `michael`
3. You'll stay logged in for 30 days

### Checking Availability
1. View the calendar at `/family/availability`
2. **Color Legend:**
   - 🟢 Green = Available
   - 🔵 Blue = Family/friend has it booked (click to see who)
   - ⚪ Gray = Owner blocked
   - ⚪ Light gray = Paying guest booked

### Requesting Dates
1. Click **"Request Dates"** button
2. Fill out the form:
   - Select your check-in and check-out dates
   - Enter your name
   - (Optional) Add your email
   - Select number of guests (1-12)
   - (Optional) Add notes about what you're celebrating
3. Click **"Send Request to JR"**
4. You'll see a confirmation - JR will review and approve/reject

### After Approval
- Your approved booking will appear on the family calendar in blue
- Other family members can see you have those dates

## Technical Details

### Routes
- **Password Gate:** `/family`
- **Calendar:** `/family/availability`
- **Request Form:** `/family/request`
- **Admin Dashboard:** `/family/admin` (owner only)

### Password
- Answer: `michael` (case-insensitive)
- Hint system shows after 2 failed attempts
- Session lasts 30 days

### Notifications
- Owner receives Pushover notification for new requests
- High priority alert with all booking details
- Includes direct link to admin dashboard

## Troubleshooting

### "Session expired" error
- Just re-enter the password at `/family`

### Can't see pending requests (admin)
- Make sure you're at `/family/admin`
- Check that requests haven't already been approved/rejected

### Request says "dates conflict"
- Someone else (or you) already has an approved booking for those dates
- Try different dates or check the calendar

### Forgot the password
- It's JR's middle name: `michael`
- Must be lowercase

## Support
Contact JR for any issues or questions!
