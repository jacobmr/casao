import { NextResponse } from 'next/server'
import { approveBooking } from '@/lib/google-calendar'

/**
 * POST /api/family/admin/approve/[id]
 * Approve a pending booking by removing "Pending:" prefix from Google Calendar event
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Approve by removing "Pending:" prefix from event title
    await approveBooking(id)

    console.log(`✅ Approved family booking ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Booking approved'
    })
  } catch (error) {
    console.error('Error approving booking:', error)
    return NextResponse.json(
      { error: 'Failed to approve booking' },
      { status: 500 }
    )
  }
}
