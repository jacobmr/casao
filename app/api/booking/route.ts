import { type NextRequest, NextResponse } from "next/server"
import { createBooking } from "@/lib/guesty"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const propertyId = process.env.GUESTY_PROPERTY_ID!

    const { checkIn, checkOut, guest, address } = body

    if (!checkIn || !checkOut || !guest) {
      return NextResponse.json({ error: "checkIn, checkOut, and guest information are required" }, { status: 400 })
    }

    const bookingData = {
      listingId: propertyId,
      checkIn,
      checkOut,
      guest,
      address,
    }

    const booking = await createBooking(bookingData)

    return NextResponse.json(booking)
  } catch (error) {
    console.error("[v0] Error creating booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
