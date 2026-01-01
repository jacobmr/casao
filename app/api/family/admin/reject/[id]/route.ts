import { NextResponse } from 'next/server'
import { deleteBooking } from '@/lib/google-calendar'

/**
 * POST /api/family/admin/reject/[id]
 * Reject a pending booking by deleting the event from Google Calendar
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete the event from Google Calendar
    await deleteBooking(id)

    console.log(`❌ Rejected family booking ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Booking rejected and removed'
    })
  } catch (error) {
    console.error('Error rejecting booking:', error)
    return NextResponse.json(
      { error: 'Failed to reject booking' },
      { status: 500 }
    )
  }
}
