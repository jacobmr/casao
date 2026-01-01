import { NextResponse } from 'next/server'
import { getAllFamilyBookings, createFamilyBooking } from '@/lib/family-kv'

/**
 * GET /api/family/bookings
 * List all approved family bookings
 */
export async function GET() {
  try {
    const bookings = await getAllFamilyBookings('approved')

    return NextResponse.json({
      success: true,
      bookings,
      count: bookings.length
    })
  } catch (error) {
    console.error('Error fetching family bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/family/bookings
 * Create a new booking request (status: pending)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { checkIn, checkOut, guestName, guestEmail, guestCount, notes } = body

    // Validate required fields
    if (!checkIn || !checkOut || !guestName || !guestCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate guest count
    if (guestCount < 1 || guestCount > 12) {
      return NextResponse.json(
        { error: 'Guest count must be between 1 and 12' },
        { status: 400 }
      )
    }

    // Validate dates
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-out must be after check-in' },
        { status: 400 }
      )
    }

    // Check for conflicts with existing approved bookings
    const existingBookings = await getAllFamilyBookings('approved')
    const hasConflict = existingBookings.some(existing => {
      const existingCheckIn = new Date(existing.checkIn)
      const existingCheckOut = new Date(existing.checkOut)

      // Check if dates overlap
      return (
        (checkInDate >= existingCheckIn && checkInDate < existingCheckOut) ||
        (checkOutDate > existingCheckIn && checkOutDate <= existingCheckOut) ||
        (checkInDate <= existingCheckIn && checkOutDate >= existingCheckOut)
      )
    })

    if (hasConflict) {
      return NextResponse.json(
        { error: 'These dates conflict with an existing booking' },
        { status: 409 }
      )
    }

    // Create the booking
    const booking = await createFamilyBooking({
      checkIn,
      checkOut,
      guestName,
      guestEmail,
      guestCount,
      notes
    })

    // Send Pushover notification to owner
    const pushoverUserKey = process.env.PUSHOVER_USER_KEY
    const pushoverApiToken = process.env.PUSHOVER_API_TOKEN

    if (pushoverUserKey && pushoverApiToken) {
      try {
        const nights = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        const message = `New family booking request!\n\n${guestName} (${guestEmail || 'no email'})\n${checkIn} → ${checkOut} (${nights} nights, ${guestCount} guests)\n\n${notes ? `Notes: ${notes}\n\n` : ''}Approve at casavistas.net/family/admin`

        const formData = new URLSearchParams({
          token: pushoverApiToken,
          user: pushoverUserKey,
          title: '📅 Family Booking Request',
          message: message,
          priority: '1' // High priority
        })

        await fetch('https://api.pushover.net/1/messages.json', {
          method: 'POST',
          body: formData
        })

        console.log('📱 Pushover notification sent for booking request')
      } catch (pushError) {
        console.error('Pushover notification failed:', pushError)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      booking
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating family booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
