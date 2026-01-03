import { NextResponse } from 'next/server'
import { getConfirmedBookings, getGuestBookings } from '@/lib/google-calendar'
import { getAvailabilityWithFallback } from '@/lib/kv-cache'
import { getCachedToken } from '@/lib/token-service-kv'

interface CalendarDay {
  date: string
  status: 'available' | 'family' | 'owner' | 'booked'
  isCheckIn?: boolean   // First day of stay (PM arrival)
  isCheckOut?: boolean  // Last day of stay (AM departure)
  booking?: {
    title: string
    guestName?: string
    guestCount?: number
    checkIn?: string
    checkOut?: string
  }
}

/**
 * Get merged calendar data for family portal
 * Combines:
 * - Google Calendar family bookings (confirmed only)
 * - Guesty availability (from cache)
 *
 * Color coding:
 * - green: available
 * - blue: family/friend booking (from Google Calendar)
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

    // Get confirmed family bookings from Google Calendar
    let familyBookings: Awaited<ReturnType<typeof getConfirmedBookings>> = []
    try {
      familyBookings = await getConfirmedBookings(fromStr, toStr)
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error)
      // Continue without family bookings if Google Calendar fails
    }

    // Fetch guest names from Google Calendar (synced from Guesty via scraper)
    // These are events with [GUEST] prefix created by the CASAO_PC scraper
    // Track check-in/check-out for partial day display
    const guestyGuestsByDate = new Map<string, { guestName: string, isCheckIn: boolean, isCheckOut: boolean, checkIn: string, checkOut: string }>()
    try {
      const guestBookings = await getGuestBookings(fromStr, toStr)
      guestBookings.forEach(booking => {
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        const current = new Date(checkIn)

        while (current < checkOut) {
          const dateStr = current.toISOString().split('T')[0]
          const isCheckInDate = dateStr === booking.checkIn
          guestyGuestsByDate.set(dateStr, {
            guestName: booking.guestName,
            isCheckIn: isCheckInDate,
            isCheckOut: false,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut
          })
          current.setDate(current.getDate() + 1)
        }
        // Mark check-out day
        const checkOutDateStr = booking.checkOut
        if (!guestyGuestsByDate.has(checkOutDateStr)) {
          guestyGuestsByDate.set(checkOutDateStr, {
            guestName: booking.guestName,
            isCheckIn: false,
            isCheckOut: true,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut
          })
        }
      })
    } catch (error) {
      console.error('Failed to fetch guest bookings from Google Calendar:', error)
    }

    // Create a map of dates to family bookings for quick lookup
    // Also track which dates are check-in vs check-out
    const familyBookingsByDate = new Map<string, { booking: typeof familyBookings[0], isCheckIn: boolean, isCheckOut: boolean }>()

    familyBookings.forEach(booking => {
      const checkIn = new Date(booking.start)
      const checkOut = new Date(booking.end)
      const current = new Date(checkIn)

      while (current < checkOut) {
        const dateStr = current.toISOString().split('T')[0]
        const isCheckInDate = dateStr === booking.start
        const isCheckOutDate = false // Check-out is the day AFTER last night, so it's not in this loop
        familyBookingsByDate.set(dateStr, { booking, isCheckIn: isCheckInDate, isCheckOut: false })
        current.setDate(current.getDate() + 1)
      }
      // Mark the check-out day (if within our range)
      // Check-out day = booking.end (exclusive end date means this is the departure day)
      const checkOutDateStr = booking.end
      const existing = familyBookingsByDate.get(checkOutDateStr)
      if (!existing) {
        // If no booking on this day yet, mark it as check-out only (AM departure, PM available)
        familyBookingsByDate.set(checkOutDateStr, { booking, isCheckIn: false, isCheckOut: true })
      }
    })

    // Pre-fetch all months in the date range (batch cache lookups)
    const monthsToFetch = new Set<string>()
    const tempDate = new Date(from)
    while (tempDate <= to) {
      const key = `${tempDate.getFullYear()}-${tempDate.getMonth()}`
      monthsToFetch.add(key)
      tempDate.setMonth(tempDate.getMonth() + 1)
    }

    // Get auth token once for all requests
    const token = await getCachedToken()

    // Fetch all months in parallel with read-through caching
    // Uses same shared function as main /api/calendar endpoint
    const guestyDataByMonth = new Map<string, { date: string; status: string }[]>()
    await Promise.all(
      Array.from(monthsToFetch).map(async (key) => {
        const [year, month] = key.split('-').map(Number)

        // Use shared read-through cache function
        const data = await getAvailabilityWithFallback(year, month, token)

        if (data && Array.isArray(data)) {
          guestyDataByMonth.set(key, data)
        }
      })
    )

    // Build calendar days array
    const calendarDays: CalendarDay[] = []
    const current = new Date(from)

    while (current <= to) {
      const year = current.getFullYear()
      const month = current.getMonth()
      const dateStr = current.toISOString().split('T')[0]
      const monthKey = `${year}-${month}`

      // Check if this date has a family booking
      const familyData = familyBookingsByDate.get(dateStr)

      if (familyData) {
        // Family/friend booking takes precedence
        calendarDays.push({
          date: dateStr,
          status: 'family',
          isCheckIn: familyData.isCheckIn,
          isCheckOut: familyData.isCheckOut,
          booking: {
            title: familyData.booking.title,
            guestName: familyData.booking.title,
            guestCount: familyData.booking.guestCount,
            checkIn: familyData.booking.start,
            checkOut: familyData.booking.end,
          }
        })
      } else {
        // Check Guesty availability from pre-fetched cache
        const guestyData = guestyDataByMonth.get(monthKey)

        let guestyStatus = 'available'
        if (guestyData) {
          const dayData = guestyData.find(d => d.date === dateStr)
          if (dayData) {
            guestyStatus = dayData.status
          }
        }

        // Map Guesty status to our color codes
        let status: 'available' | 'family' | 'owner' | 'booked'
        if (guestyStatus === 'available') {
          status = 'available'
        } else if (guestyStatus === 'booked') {
          status = 'booked' // Paying guest
        } else {
          status = 'owner' // Blocked by owner
        }

        // Add guest name for booked dates if we have it from scraper
        const guestData = guestyGuestsByDate.get(dateStr)
        if (status === 'booked' && guestData) {
          calendarDays.push({
            date: dateStr,
            status,
            isCheckIn: guestData.isCheckIn,
            isCheckOut: guestData.isCheckOut,
            booking: {
              title: 'Guest Booking',
              guestName: guestData.guestName,
              checkIn: guestData.checkIn,
              checkOut: guestData.checkOut
            }
          })
        } else if (guestData?.isCheckOut) {
          // Check-out day that's marked as available in Guesty (which is correct)
          // but we want to show the morning is occupied
          calendarDays.push({
            date: dateStr,
            status: 'booked',
            isCheckIn: false,
            isCheckOut: true,
            booking: {
              title: 'Guest Booking',
              guestName: guestData.guestName,
              checkIn: guestData.checkIn,
              checkOut: guestData.checkOut
            }
          })
        } else {
          calendarDays.push({
            date: dateStr,
            status
          })
        }
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
