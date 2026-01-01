import { NextResponse } from 'next/server'
import { getPendingBookings } from '@/lib/google-calendar'

/**
 * GET /api/family/admin/pending
 * List all pending family booking requests from Google Calendar
 * (Events with "Pending:" prefix in title)
 */
export async function GET() {
  try {
    // Get pending bookings for next 12 months
    const from = new Date().toISOString().split('T')[0]
    const to = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const pendingBookings = await getPendingBookings(from, to)

    return NextResponse.json({
      success: true,
      bookings: pendingBookings,
      count: pendingBookings.length
    })
  } catch (error) {
    console.error('Error fetching pending bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending bookings' },
      { status: 500 }
    )
  }
}
