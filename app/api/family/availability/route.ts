import { NextResponse } from 'next/server'
import { getConfirmedBookings, getGuestBookings } from '@/lib/google-calendar'
import { getAvailabilityWithFallback } from '@/lib/kv-cache'
import { getCachedToken } from '@/lib/token-service-kv'

interface CalendarDay {
  date: string
  status: 'available' | 'family' | 'owner' | 'booked'
  booking?: {
    title: string
    guestName?: string
    guestCount?: number
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
    const guestyGuestsByDate = new Map<string, string>()
    try {
      const guestBookings = await getGuestBookings(fromStr, toStr)
      guestBookings.forEach(booking => {
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        const current = new Date(checkIn)

        while (current < checkOut) {
          const dateStr = current.toISOString().split('T')[0]
          guestyGuestsByDate.set(dateStr, booking.guestName)
          current.setDate(current.getDate() + 1)
        }
      })
    } catch (error) {
      console.error('Failed to fetch guest bookings from Google Calendar:', error)
    }

    // Create a map of dates to family bookings for quick lookup
    const familyBookingsByDate = new Map<string, typeof familyBookings[0]>()

    familyBookings.forEach(booking => {
      const checkIn = new Date(booking.start)
      const checkOut = new Date(booking.end)
      const current = new Date(checkIn)

      while (current < checkOut) {
        const dateStr = current.toISOString().split('T')[0]
        familyBookingsByDate.set(dateStr, booking)
        current.setDate(current.getDate() + 1)
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
      const familyBooking = familyBookingsByDate.get(dateStr)

      if (familyBooking) {
        // Family/friend booking takes precedence
        calendarDays.push({
          date: dateStr,
          status: 'family',
          booking: {
            title: familyBooking.title,
            guestCount: familyBooking.guestCount,
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
        const guestName = guestyGuestsByDate.get(dateStr)
        if (status === 'booked' && guestName) {
          calendarDays.push({
            date: dateStr,
            status,
            booking: {
              title: 'Guest Booking',
              guestName: guestName
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
