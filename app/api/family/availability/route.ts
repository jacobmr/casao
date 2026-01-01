import { NextResponse } from 'next/server'
import { getApprovedBookingsInRange } from '@/lib/family-kv'
import { getCachedAvailability } from '@/lib/kv-cache'
import type { CalendarDay } from '@/lib/family-types'

/**
 * Get merged calendar data for family portal
 * Combines:
 * - Guesty availability (from cache)
 * - Approved family bookings (from KV)
 *
 * Color coding:
 * - green: available
 * - blue: family/friend booking
 * - gray: owner block (from Guesty)
 * - light gray: paying guest (from Guesty)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    if (!fromStr || !toStr) {
      return NextResponse.json(
        { error: 'Missing from or to date parameters' },
        { status: 400 }
      )
    }

    const from = new Date(fromStr)
    const to = new Date(toStr)

    // Get family bookings (approved only)
    const familyBookings = await getApprovedBookingsInRange(fromStr, toStr)

    // Create a map of dates to family bookings for quick lookup
    const familyBookingsByDate = new Map<string, any>()

    familyBookings.forEach(booking => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const current = new Date(checkIn)

      while (current < checkOut) {
        const dateStr = current.toISOString().split('T')[0]
        familyBookingsByDate.set(dateStr, booking)
        current.setDate(current.getDate() + 1)
      }
    })

    // Get Guesty availability from cache
    const calendarDays: CalendarDay[] = []
    const current = new Date(from)

    while (current <= to) {
      const year = current.getFullYear()
      const month = current.getMonth() // 0-indexed
      const dateStr = current.toISOString().split('T')[0]

      // Check if this date has a family booking
      const familyBooking = familyBookingsByDate.get(dateStr)

      if (familyBooking) {
        // Family/friend booking takes precedence
        calendarDays.push({
          date: dateStr,
          status: 'family',
          booking: familyBooking
        })
      } else {
        // Check Guesty availability from cache
        const guestyData = await getCachedAvailability(year, month)

        let guestyStatus = 'available'
        if (guestyData && Array.isArray(guestyData)) {
          const dayData = guestyData.find((d: any) => d.date === dateStr)
          if (dayData) {
            guestyStatus = dayData.status
          }
        }

        // Map Guesty status to our color codes
        let status: "available" | "family" | "owner" | "booked"
        if (guestyStatus === 'available') {
          status = 'available'
        } else if (guestyStatus === 'booked') {
          status = 'booked' // Paying guest
        } else {
          status = 'owner' // Blocked by owner
        }

        calendarDays.push({
          date: dateStr,
          status
        })
      }

      current.setDate(current.getDate() + 1)
    }

    return NextResponse.json({
      success: true,
      days: calendarDays,
      familyBookings: familyBookings.length
    })

  } catch (error) {
    console.error('Family availability error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
