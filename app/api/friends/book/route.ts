import { NextResponse } from 'next/server'
import {
  createOffSeasonBooking,
  validateBookingDates,
  OFF_SEASON_DEFAULTS,
} from '@/lib/off-season-booking'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe-service'
import { saveBooking, checkBookingConflicts } from '@/lib/booking-storage'
import { createBookingRequest } from '@/lib/google-calendar'
import { getSeasonType, getSeasonBreakdown } from '@/lib/seasonal'

/**
 * POST /api/friends/book
 * Create a new off-season direct booking and return Stripe checkout URL
 */
export async function POST(request: Request) {
  try {
    // Check Stripe configuration
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      guestName,
      guestEmail,
      guestPhone,
      guestCount,
      checkIn,
      checkOut,
      notes,
      specialRequests,
    } = body

    // Validate required fields
    if (!guestName || !guestEmail || !guestCount || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required fields: guestName, guestEmail, guestCount, checkIn, checkOut' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guestEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Validate dates
    const dateValidation = validateBookingDates(checkIn, checkOut)
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      )
    }

    // Check season - off-season direct booking only
    const checkInSeason = getSeasonType(new Date(checkIn))
    const { highSeasonDays, offSeasonDays } = getSeasonBreakdown(
      new Date(checkIn),
      new Date(checkOut)
    )

    if (highSeasonDays > 0) {
      return NextResponse.json(
        {
          error: 'Direct booking is only available for off-season dates',
          message: 'High-season dates should be booked through the main site with a discount code',
          highSeasonDays,
          offSeasonDays,
        },
        { status: 400 }
      )
    }

    // Check for conflicts with existing bookings
    const conflicts = await checkBookingConflicts(checkIn, checkOut)
    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Selected dates conflict with existing bookings',
          conflicts: conflicts.map((c) => ({
            checkIn: c.checkIn,
            checkOut: c.checkOut,
            guestName: c.guestName,
          })),
        },
        { status: 409 }
      )
    }

    // Create booking record
    const booking = createOffSeasonBooking({
      guestName,
      guestEmail,
      guestPhone,
      guestCount,
      checkIn,
      checkOut,
      notes,
      specialRequests,
    })

    // Save booking to Redis
    await saveBooking(booking)

    // Create pending calendar event
    try {
      const eventId = await createBookingRequest({
        guestName: `[PENDING] ${guestName} (Direct)`,
        checkIn,
        checkOut,
        guestCount,
        notes: `Off-season direct booking
Rate: $${booking.nightlyRate}/night
Total: $${booking.totalPrice}
Deposit due: $${booking.depositRequired}
Status: Awaiting payment`,
      })
      booking.googleCalendarEventId = eventId
      await saveBooking(booking)
    } catch (calendarError) {
      console.error('Failed to create calendar event:', calendarError)
      // Continue without calendar event - not critical
    }

    // Create Stripe checkout session for deposit
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.casavistas.net'
    const session = await createCheckoutSession({
      bookingId: booking.id,
      guestName,
      guestEmail,
      amount: booking.depositRequired,
      paymentType: 'deposit',
      checkIn,
      checkOut,
      nights: booking.nights,
      successUrl: `${baseUrl}/friends/booking/${booking.id}?status=success`,
      cancelUrl: `${baseUrl}/friends/booking/${booking.id}?status=cancelled`,
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        guestCount: booking.guestCount,
        nightlyRate: booking.nightlyRate,
        cleaningFee: booking.cleaningFee,
        totalPrice: booking.totalPrice,
        depositRequired: booking.depositRequired,
        balanceDue: booking.balanceDue,
        balanceDueDate: booking.balanceDueDate,
        status: booking.status,
      },
      checkoutUrl: session.url,
      checkoutSessionId: session.id,
    })
  } catch (error) {
    console.error('Error creating direct booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/friends/book?id=xxx
 * Get booking details by ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('id')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking ID' },
        { status: 400 }
      )
    }

    const { getBooking } = await import('@/lib/booking-storage')
    const booking = await getBooking(bookingId)

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Return safe subset of booking data
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        guestName: booking.guestName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        guestCount: booking.guestCount,
        nightlyRate: booking.nightlyRate,
        cleaningFee: booking.cleaningFee,
        totalPrice: booking.totalPrice,
        depositRequired: booking.depositRequired,
        balanceDue: booking.balanceDue,
        balanceDueDate: booking.balanceDueDate,
        status: booking.status,
        depositPaidAt: booking.depositPaidAt,
        balancePaidAt: booking.balancePaidAt,
      },
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}
