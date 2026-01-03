import { NextResponse } from 'next/server'
import { getSeasonBreakdown } from '@/lib/seasonal'

/**
 * POST /api/friends/redirect
 * Determines booking path: off-season → Stripe, high-season → Guesty with discount code
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { checkIn, checkOut, guestCount, guestName, guestEmail } = body

    // Validate required fields
    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required fields: checkIn, checkOut' },
        { status: 400 }
      )
    }

    // Check season breakdown
    const { highSeasonDays, offSeasonDays } = getSeasonBreakdown(
      new Date(checkIn),
      new Date(checkOut)
    )

    // Calculate nights
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Validate minimum stay
    if (nights < 3) {
      return NextResponse.json(
        { error: 'Minimum stay is 3 nights' },
        { status: 400 }
      )
    }

    // Determine path
    if (highSeasonDays > 0) {
      // High season: redirect to main booking with friends discount code
      // Use FRIENDS30 as default friends rate (can be customized)
      const discountCode = 'CasaO30' // 30% off for friends

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.casavistas.net'
      const handoffUrl = new URL(`${baseUrl}/api/handoff`)
      handoffUrl.searchParams.set('checkIn', checkIn)
      handoffUrl.searchParams.set('checkOut', checkOut)
      handoffUrl.searchParams.set('adults', String(guestCount || 2))
      handoffUrl.searchParams.set('promo', discountCode)
      if (guestName) handoffUrl.searchParams.set('name', guestName)
      if (guestEmail) handoffUrl.searchParams.set('email', guestEmail)

      return NextResponse.json({
        flow: 'high_season',
        redirectUrl: handoffUrl.toString(),
        seasonInfo: {
          highSeasonDays,
          offSeasonDays,
          nights,
        },
        discountCode,
        message: 'High season dates - redirecting to Guesty with 30% discount',
      })
    } else {
      // Off season: use direct Stripe booking
      return NextResponse.json({
        flow: 'off_season',
        redirectUrl: null, // Client will POST to /api/friends/book
        seasonInfo: {
          highSeasonDays,
          offSeasonDays,
          nights,
        },
        message: 'Off season dates - direct booking available at $143/night',
      })
    }
  } catch (error) {
    console.error('Error in friends redirect:', error)
    return NextResponse.json(
      { error: 'Failed to process booking request' },
      { status: 500 }
    )
  }
}
