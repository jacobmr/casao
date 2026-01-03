/**
 * Off-season direct booking data models and utilities
 * Handles direct payments from friends outside of Guesty system
 */

import { randomUUID } from 'crypto'

export type OffSeasonBookingStatus =
  | 'pending'           // Created, awaiting deposit
  | 'deposit_paid'      // Deposit received
  | 'balance_due'       // Deposit confirmed, balance reminder sent
  | 'confirmed'         // Fully paid
  | 'completed'         // Stay completed
  | 'cancelled'         // Cancelled by guest or host

export interface OffSeasonBooking {
  // Identification
  id: string
  googleCalendarEventId?: string

  // Guest info
  guestName: string
  guestEmail: string
  guestPhone?: string
  guestCount: number

  // Dates & pricing
  checkIn: string       // YYYY-MM-DD
  checkOut: string      // YYYY-MM-DD
  nights: number
  nightlyRate: number   // USD (default $143)
  cleaningFee: number   // Flat USD (default $300)

  // Payment breakdown
  lodgingSubtotal: number   // nights * nightlyRate
  depositRequired: number   // 30% of total
  balanceDue: number        // Remaining 70%
  balanceDueDate: string    // YYYY-MM-DD (14 days before checkIn)
  totalPrice: number        // lodging + cleaning

  // Payment status
  status: OffSeasonBookingStatus
  depositPaidAt?: string        // ISO timestamp
  depositAmount?: number
  depositStripePaymentId?: string
  balancePaidAt?: string        // ISO timestamp
  balanceAmount?: number
  balanceStripePaymentId?: string

  // Notes
  notes?: string
  specialRequests?: string

  // Timestamps
  createdAt: string     // ISO timestamp
  updatedAt: string     // ISO timestamp
  confirmedAt?: string
}

// Default pricing for off-season friends rate
export const OFF_SEASON_DEFAULTS = {
  nightlyRate: 143,     // $1,000/week = ~$143/night (covers costs)
  cleaningFee: 300,     // Standard cleaning fee
  depositPercent: 0.30, // 30% deposit
  balanceDueDays: 14,   // Balance due 14 days before check-in
  minNights: 3,         // Minimum stay
}

/**
 * Create a new off-season booking record
 */
export function createOffSeasonBooking(data: {
  guestName: string
  guestEmail: string
  guestPhone?: string
  guestCount: number
  checkIn: string
  checkOut: string
  nightlyRate?: number
  cleaningFee?: number
  notes?: string
  specialRequests?: string
}): OffSeasonBooking {
  const checkInDate = new Date(data.checkIn)
  const checkOutDate = new Date(data.checkOut)
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const nightlyRate = data.nightlyRate ?? OFF_SEASON_DEFAULTS.nightlyRate
  const cleaningFee = data.cleaningFee ?? OFF_SEASON_DEFAULTS.cleaningFee

  const lodgingSubtotal = nights * nightlyRate
  const totalPrice = lodgingSubtotal + cleaningFee

  // 30% deposit
  const depositRequired = Math.ceil(totalPrice * OFF_SEASON_DEFAULTS.depositPercent)
  const balanceDue = totalPrice - depositRequired

  // Balance due 14 days before check-in, but at minimum 3 days from now
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const balanceDueDate = new Date(checkInDate)
  balanceDueDate.setDate(balanceDueDate.getDate() - OFF_SEASON_DEFAULTS.balanceDueDays)

  // If balance due date is in the past or too soon, set to 3 days from now or check-in, whichever is sooner
  const minBalanceDueDate = new Date(today)
  minBalanceDueDate.setDate(minBalanceDueDate.getDate() + 3)

  if (balanceDueDate < minBalanceDueDate) {
    // For last-minute bookings, balance due is min(3 days from now, check-in date)
    if (minBalanceDueDate < checkInDate) {
      balanceDueDate.setTime(minBalanceDueDate.getTime())
    } else {
      // Very last-minute booking: balance due at check-in
      balanceDueDate.setTime(checkInDate.getTime())
    }
  }

  const now = new Date().toISOString()

  return {
    id: randomUUID(),
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone,
    guestCount: data.guestCount,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    nights,
    nightlyRate,
    cleaningFee,
    lodgingSubtotal,
    depositRequired,
    balanceDue,
    balanceDueDate: balanceDueDate.toISOString().split('T')[0],
    totalPrice,
    status: 'pending',
    notes: data.notes,
    specialRequests: data.specialRequests,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Calculate payment status for a booking
 */
export function getPaymentStatus(booking: OffSeasonBooking): {
  nextDueAmount: number
  nextDueType: 'deposit' | 'balance' | 'complete'
  nextDueDate: string
  progressPercent: number
  isOverdue: boolean
} {
  const today = new Date().toISOString().split('T')[0]

  if (booking.status === 'confirmed' || booking.status === 'completed') {
    return {
      nextDueAmount: 0,
      nextDueType: 'complete',
      nextDueDate: '',
      progressPercent: 100,
      isOverdue: false,
    }
  }

  if (!booking.depositPaidAt) {
    return {
      nextDueAmount: booking.depositRequired,
      nextDueType: 'deposit',
      nextDueDate: 'now', // Due immediately upon booking
      progressPercent: 0,
      isOverdue: false,
    }
  }

  // Deposit paid, balance due
  const isOverdue = today > booking.balanceDueDate
  return {
    nextDueAmount: booking.balanceDue,
    nextDueType: 'balance',
    nextDueDate: booking.balanceDueDate,
    progressPercent: 50,
    isOverdue,
  }
}

/**
 * Format booking for display
 */
export function formatBookingSummary(booking: OffSeasonBooking): string {
  const checkIn = new Date(booking.checkIn).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const checkOut = new Date(booking.checkOut).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return `${booking.guestName} | ${checkIn} - ${checkOut} | ${booking.nights} nights | $${booking.totalPrice}`
}

/**
 * Validate booking dates
 */
export function validateBookingDates(checkIn: string, checkOut: string): {
  valid: boolean
  error?: string
} {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (checkInDate < today) {
    return { valid: false, error: 'Check-in date cannot be in the past' }
  }

  if (checkOutDate <= checkInDate) {
    return { valid: false, error: 'Check-out must be after check-in' }
  }

  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (nights < OFF_SEASON_DEFAULTS.minNights) {
    return {
      valid: false,
      error: `Minimum stay is ${OFF_SEASON_DEFAULTS.minNights} nights`,
    }
  }

  return { valid: true }
}
