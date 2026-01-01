import { NextResponse } from 'next/server'
import { getConfirmedBookings, createBookingRequest } from '@/lib/google-calendar'

/**
 * GET /api/family/bookings
 * List all confirmed family bookings from Google Calendar
 */
export async function GET() {
  try {
    // Get bookings for next 12 months
    const from = new Date().toISOString().split('T')[0]
    const to = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const bookings = await getConfirmedBookings(from, to)

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
 * Create a new booking request (creates "Pending:" event on Google Calendar)
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

    // Check for conflicts with existing confirmed bookings in Google Calendar
    const existingBookings = await getConfirmedBookings(checkIn, checkOut)
    const hasConflict = existingBookings.some(existing => {
      const existingStart = new Date(existing.start)
      const existingEnd = new Date(existing.end)

      // Check if dates overlap
      return (
        (checkInDate >= existingStart && checkInDate < existingEnd) ||
        (checkOutDate > existingStart && checkOutDate <= existingEnd) ||
        (checkInDate <= existingStart && checkOutDate >= existingEnd)
      )
    })

    if (hasConflict) {
      return NextResponse.json(
        { error: 'These dates conflict with an existing booking' },
        { status: 409 }
      )
    }

    // Create the booking on Google Calendar
    const eventId = await createBookingRequest({
      guestName,
      checkIn,
      checkOut,
      guestCount,
      notes: notes ? `${notes}${guestEmail ? `\n\nContact: ${guestEmail}` : ''}` : (guestEmail ? `Contact: ${guestEmail}` : undefined)
    })

    // Send Pushover notification to owner
    const pushoverUserKey = process.env.PUSHOVER_USER_KEY
    const pushoverApiToken = process.env.PUSHOVER_API_TOKEN

    if (pushoverUserKey && pushoverApiToken) {
      try {
        const nights = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        const message = `New family booking request!\n\n${guestName} (${guestEmail || 'no email'})\n${checkIn} → ${checkOut} (${nights} nights, ${guestCount} guests)\n\n${notes ? `Notes: ${notes}\n\n` : ''}Check Google Calendar to approve (remove "Pending:" prefix)`

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
      booking: {
        id: eventId,
        checkIn,
        checkOut,
        guestName,
        guestCount,
        notes,
        status: 'pending'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating family booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
