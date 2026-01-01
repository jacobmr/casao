import { NextResponse } from 'next/server'
import { approveFamilyBooking, getFamilyBooking } from '@/lib/family-kv'

/**
 * POST /api/family/admin/approve/[id]
 * Approve a pending booking request
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
        { error: 'Only pending bookings can be approved' },
        { status: 400 }
      )
    }

    // Approve the booking
    const updated = await approveFamilyBooking(id)

    console.log(`✅ Approved family booking ${id}`)

    return NextResponse.json({
      success: true,
      booking: updated
    })
  } catch (error) {
    console.error('Error approving booking:', error)
    return NextResponse.json(
      { error: 'Failed to approve booking' },
      { status: 500 }
    )
  }
}
