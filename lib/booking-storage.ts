/**
 * Off-season booking storage using Redis
 * Stores and retrieves direct booking records
 */

import { createClient, RedisClientType } from 'redis'
import { OffSeasonBooking } from './off-season-booking'

// Redis client singleton
let redisClient: RedisClientType | null = null

async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }

  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    })

    redisClient.on('error', (err) =>
      console.error('Redis Client Error:', err)
    )
  }

  if (!redisClient.isOpen) {
    await redisClient.connect()
  }

  return redisClient
}

// Key prefixes
const BOOKING_PREFIX = 'off-season-booking:'
const BOOKING_INDEX = 'off-season-bookings:index'
const BOOKING_BY_EMAIL = 'off-season-bookings:email:'

/**
 * Save a booking to Redis
 */
export async function saveBooking(booking: OffSeasonBooking): Promise<void> {
  const redis = await getRedisClient()

  // Save the booking
  await redis.set(
    `${BOOKING_PREFIX}${booking.id}`,
    JSON.stringify(booking),
    { EX: 60 * 60 * 24 * 365 } // 1 year expiry
  )

  // Add to index (sorted set by check-in date)
  await redis.zAdd(BOOKING_INDEX, {
    score: new Date(booking.checkIn).getTime(),
    value: booking.id,
  })

  // Add to email index for guest lookups
  await redis.sAdd(`${BOOKING_BY_EMAIL}${booking.guestEmail}`, booking.id)
}

/**
 * Get a booking by ID
 */
export async function getBooking(
  bookingId: string
): Promise<OffSeasonBooking | null> {
  const redis = await getRedisClient()
  const data = await redis.get(`${BOOKING_PREFIX}${bookingId}`)

  if (!data) return null

  return JSON.parse(data) as OffSeasonBooking
}

/**
 * Update a booking
 */
export async function updateBooking(
  bookingId: string,
  updates: Partial<OffSeasonBooking>
): Promise<OffSeasonBooking | null> {
  const booking = await getBooking(bookingId)

  if (!booking) return null

  const updated: OffSeasonBooking = {
    ...booking,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  await saveBooking(updated)
  return updated
}

/**
 * Get all bookings (sorted by check-in date)
 */
export async function getAllBookings(): Promise<OffSeasonBooking[]> {
  const redis = await getRedisClient()

  // Get all booking IDs from index
  const bookingIds = await redis.zRange(BOOKING_INDEX, 0, -1)

  if (bookingIds.length === 0) return []

  // Fetch all bookings
  const bookings: OffSeasonBooking[] = []
  for (const id of bookingIds) {
    const booking = await getBooking(id)
    if (booking) {
      bookings.push(booking)
    }
  }

  return bookings
}

/**
 * Get bookings by guest email
 */
export async function getBookingsByEmail(
  email: string
): Promise<OffSeasonBooking[]> {
  const redis = await getRedisClient()

  const bookingIds = await redis.sMembers(`${BOOKING_BY_EMAIL}${email}`)

  if (bookingIds.length === 0) return []

  const bookings: OffSeasonBooking[] = []
  for (const id of bookingIds) {
    const booking = await getBooking(id)
    if (booking) {
      bookings.push(booking)
    }
  }

  return bookings.sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
  )
}

/**
 * Get upcoming bookings (from today onwards)
 */
export async function getUpcomingBookings(): Promise<OffSeasonBooking[]> {
  const redis = await getRedisClient()
  const now = Date.now()

  // Get booking IDs with check-in from now onwards
  const bookingIds = await redis.zRangeByScore(
    BOOKING_INDEX,
    now,
    '+inf'
  )

  if (bookingIds.length === 0) return []

  const bookings: OffSeasonBooking[] = []
  for (const id of bookingIds) {
    const booking = await getBooking(id)
    if (booking) {
      bookings.push(booking)
    }
  }

  return bookings
}

/**
 * Get pending bookings (awaiting payment)
 */
export async function getPendingBookings(): Promise<OffSeasonBooking[]> {
  const allBookings = await getAllBookings()
  return allBookings.filter(
    (b) => b.status === 'pending' || b.status === 'deposit_paid' || b.status === 'balance_due'
  )
}

/**
 * Delete a booking
 */
export async function deleteBooking(bookingId: string): Promise<boolean> {
  const booking = await getBooking(bookingId)

  if (!booking) return false

  const redis = await getRedisClient()

  // Remove from main store
  await redis.del(`${BOOKING_PREFIX}${bookingId}`)

  // Remove from index
  await redis.zRem(BOOKING_INDEX, bookingId)

  // Remove from email index
  await redis.sRem(`${BOOKING_BY_EMAIL}${booking.guestEmail}`, bookingId)

  return true
}

/**
 * Check for booking conflicts (date overlap)
 */
export async function checkBookingConflicts(
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): Promise<OffSeasonBooking[]> {
  const allBookings = await getAllBookings()

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)

  return allBookings.filter((booking) => {
    // Skip the booking we're updating
    if (excludeBookingId && booking.id === excludeBookingId) return false

    // Skip cancelled bookings
    if (booking.status === 'cancelled') return false

    const existingCheckIn = new Date(booking.checkIn)
    const existingCheckOut = new Date(booking.checkOut)

    // Check for overlap:
    // New booking starts before existing ends AND new booking ends after existing starts
    return checkInDate < existingCheckOut && checkOutDate > existingCheckIn
  })
}
