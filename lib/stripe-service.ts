/**
 * Stripe integration for direct off-season payments
 * Handles payment intents, checkout sessions, and webhooks
 */

import Stripe from 'stripe'

// Lazy-initialize Stripe client to avoid build-time errors
let stripeClient: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-04-30.basil',
    })
  }
  return stripeClient
}

export interface CreateCheckoutSessionParams {
  bookingId: string
  guestName: string
  guestEmail: string
  amount: number          // Amount in dollars
  paymentType: 'deposit' | 'balance'
  checkIn: string
  checkOut: string
  nights: number
  successUrl: string
  cancelUrl: string
}

export interface PaymentMetadata {
  bookingId: string
  guestEmail: string
  paymentType: 'deposit' | 'balance'
  checkIn: string
  checkOut: string
}

/**
 * Create a Stripe Checkout Session for off-season booking payment
 * Using Checkout Session instead of Payment Intent for simpler integration
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const {
    bookingId,
    guestName,
    guestEmail,
    amount,
    paymentType,
    checkIn,
    checkOut,
    nights,
    successUrl,
    cancelUrl,
  } = params

  const description =
    paymentType === 'deposit'
      ? `Deposit for Casa Vistas: ${checkIn} to ${checkOut} (${nights} nights)`
      : `Balance for Casa Vistas: ${checkIn} to ${checkOut} (${nights} nights)`

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: guestEmail,
    client_reference_id: bookingId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: paymentType === 'deposit' ? 'Booking Deposit' : 'Booking Balance',
            description,
            images: ['https://www.casavistas.net/images/hero.jpg'],
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId,
      guestEmail,
      paymentType,
      checkIn,
      checkOut,
    } as PaymentMetadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
  })

  return session
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(sessionId)
}

/**
 * Verify webhook signature and parse event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret)
}

/**
 * Get payment intent details
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.retrieve(paymentIntentId)
}

/**
 * Create a refund for a payment
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number // Optional partial refund in cents
): Promise<Stripe.Refund> {
  return getStripe().refunds.create({
    payment_intent: paymentIntentId,
    amount, // If undefined, full refund
  })
}

/**
 * List all payments for a booking (by metadata)
 */
export async function listPaymentsForBooking(
  bookingId: string
): Promise<Stripe.Checkout.Session[]> {
  const sessions = await getStripe().checkout.sessions.list({
    limit: 100,
  })

  return sessions.data.filter(
    (session) => session.metadata?.bookingId === bookingId
  )
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )
}

/**
 * Get Stripe publishable key for client-side
 */
export function getPublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
}
