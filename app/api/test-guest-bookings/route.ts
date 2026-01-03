import { NextResponse } from 'next/server'
import { getGuestBookings } from '@/lib/google-calendar'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || '2026-01-01'
  const to = searchParams.get('to') || '2026-01-31'

  try {
    console.log('Test endpoint: Calling getGuestBookings')
    const bookings = await getGuestBookings(from, to)
    console.log('Test endpoint: Got', bookings.length, 'bookings')
    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
