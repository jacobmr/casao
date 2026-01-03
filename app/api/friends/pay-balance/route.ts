import { NextResponse } from 'next/server'
import { getBooking } from '@/lib/booking-storage'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe-service'

/**
 * POST /api/friends/pay-balance
 * Create a Stripe checkout session for the remaining balance payment
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
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      )
    }

    // Get the booking
    const booking = await getBooking(bookingId)

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify booking is eligible for balance payment
    if (booking.status !== 'deposit_paid') {
      return NextResponse.json(
        {
          error: 'Booking is not eligible for balance payment',
          status: booking.status,
        },
        { status: 400 }
      )
    }

    if (booking.balancePaidAt) {
      return NextResponse.json(
        { error: 'Balance has already been paid' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session for balance
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.casavistas.net'
    const session = await createCheckoutSession({
      bookingId: booking.id,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      amount: booking.balanceDue,
      paymentType: 'balance',
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      successUrl: `${baseUrl}/friends/booking/${booking.id}?status=success`,
      cancelUrl: `${baseUrl}/friends/booking/${booking.id}?status=cancelled`,
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      checkoutSessionId: session.id,
      balanceDue: booking.balanceDue,
    })
  } catch (error) {
    console.error('Error creating balance payment session:', error)
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
