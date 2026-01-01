import { NextResponse } from 'next/server'
import { rejectFamilyBooking, getFamilyBooking } from '@/lib/family-kv'

/**
 * POST /api/family/admin/reject/[id]
 * Reject a pending booking request
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the booking first to verify it exists
    const booking = await getFamilyBooking(id)

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending bookings can be rejected' },
        { status: 400 }
      )
    }

    // Reject the booking
    const updated = await rejectFamilyBooking(id)

    console.log(`❌ Rejected family booking ${id}`)

    return NextResponse.json({
      success: true,
      booking: updated
    })
  } catch (error) {
    console.error('Error rejecting booking:', error)
    return NextResponse.json(
      { error: 'Failed to reject booking' },
      { status: 500 }
    )
  }
}
