import { NextResponse } from 'next/server'
import { getAllFamilyBookings } from '@/lib/family-kv'

/**
 * GET /api/family/admin/pending
 * List all pending family booking requests
 */
export async function GET() {
  try {
    const pendingBookings = await getAllFamilyBookings('pending')

    // Sort by creation date (newest first)
    const sorted = pendingBookings.sort((a, b) => b.createdAt - a.createdAt)

    return NextResponse.json({
      success: true,
      bookings: sorted,
      count: sorted.length
    })
  } catch (error) {
    console.error('Error fetching pending bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending bookings' },
      { status: 500 }
    )
  }
}
