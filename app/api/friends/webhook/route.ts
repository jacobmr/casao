import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { constructWebhookEvent, PaymentMetadata } from '@/lib/stripe-service'
import { getBooking, updateBooking } from '@/lib/booking-storage'
import { approveBooking } from '@/lib/google-calendar'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

/**
 * POST /api/friends/webhook
 * Handle Stripe webhook events for payment status updates
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    if (!WEBHOOK_SECRET) {
      console.error('Webhook secret not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 503 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = constructWebhookEvent(body, signature, WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const metadata = session.metadata as unknown as PaymentMetadata

  if (!metadata?.bookingId) {
    console.error('No bookingId in session metadata')
    return
  }

  const booking = await getBooking(metadata.bookingId)
  if (!booking) {
    console.error(`Booking not found: ${metadata.bookingId}`)
    return
  }

  const paymentType = metadata.paymentType
  const now = new Date().toISOString()

  if (paymentType === 'deposit') {
    console.log(`Deposit received for booking ${booking.id}`)

    await updateBooking(booking.id, {
      status: 'deposit_paid',
      depositPaidAt: now,
      depositAmount: session.amount_total ? session.amount_total / 100 : booking.depositRequired,
      depositStripePaymentId: session.payment_intent as string,
    })

    // Send notification to owner
    await sendOwnerNotification(booking, 'deposit_received')

    // Send confirmation to guest
    await sendGuestConfirmation(booking, 'deposit')
  } else if (paymentType === 'balance') {
    console.log(`Balance received for booking ${booking.id}`)

    await updateBooking(booking.id, {
      status: 'confirmed',
      balancePaidAt: now,
      balanceAmount: session.amount_total ? session.amount_total / 100 : booking.balanceDue,
      balanceStripePaymentId: session.payment_intent as string,
      confirmedAt: now,
    })

    // Update Google Calendar event (remove PENDING prefix)
    if (booking.googleCalendarEventId) {
      try {
        await approveBooking(booking.googleCalendarEventId)
      } catch (err) {
        console.error('Failed to update calendar event:', err)
      }
    }

    // Send notification to owner
    await sendOwnerNotification(booking, 'fully_paid')

    // Send confirmation to guest
    await sendGuestConfirmation(booking, 'confirmed')
  }
}

/**
 * Handle expired checkout session
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const metadata = session.metadata as unknown as PaymentMetadata

  if (!metadata?.bookingId) return

  console.log(`Checkout expired for booking ${metadata.bookingId}`)

  // Don't cancel the booking - just log it
  // Guest can try again with a new checkout session
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId

  if (!bookingId) return

  console.log(`Payment failed for booking ${bookingId}`)

  // Send notification to owner about failed payment
  const booking = await getBooking(bookingId)
  if (booking) {
    await sendOwnerNotification(booking, 'payment_failed')
  }
}

/**
 * Send notification to owner via Pushover
 */
async function sendOwnerNotification(
  booking: Awaited<ReturnType<typeof getBooking>>,
  type: 'deposit_received' | 'fully_paid' | 'payment_failed'
) {
  if (!booking) return

  const pushoverToken = process.env.PUSHOVER_APP_TOKEN
  const pushoverUser = process.env.PUSHOVER_USER_KEY

  if (!pushoverToken || !pushoverUser) {
    console.log('Pushover not configured, skipping notification')
    return
  }

  let title: string
  let message: string

  switch (type) {
    case 'deposit_received':
      title = 'Friends Booking: Deposit Received'
      message = `${booking.guestName} paid $${booking.depositRequired} deposit
${booking.checkIn} → ${booking.checkOut} (${booking.nights} nights)
Balance due: $${booking.balanceDue} by ${booking.balanceDueDate}`
      break

    case 'fully_paid':
      title = 'Friends Booking: Fully Paid!'
      message = `${booking.guestName} is confirmed!
${booking.checkIn} → ${booking.checkOut} (${booking.nights} nights)
Total paid: $${booking.totalPrice}`
      break

    case 'payment_failed':
      title = 'Friends Booking: Payment Failed'
      message = `Payment failed for ${booking.guestName}
${booking.checkIn} → ${booking.checkOut}
Please follow up.`
      break
  }

  try {
    await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: pushoverToken,
        user: pushoverUser,
        title,
        message,
        priority: type === 'payment_failed' ? 1 : 0,
      }),
    })
  } catch (err) {
    console.error('Failed to send Pushover notification:', err)
  }
}

/**
 * Send confirmation email to guest
 * TODO: Implement with email service (SendGrid, Resend, etc.)
 */
async function sendGuestConfirmation(
  booking: Awaited<ReturnType<typeof getBooking>>,
  type: 'deposit' | 'confirmed'
) {
  if (!booking) return

  // Log for now - implement email later
  console.log(`Would send ${type} confirmation to ${booking.guestEmail}`)

  // TODO: Implement email sending
  // - Use SendGrid, Resend, or AWS SES
  // - Include booking details, payment receipt, next steps
  // - For deposit: remind about balance due date
  // - For confirmed: include arrival instructions
}
