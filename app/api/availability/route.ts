import { type NextRequest, NextResponse } from "next/server"
import { getAvailability } from "@/lib/guesty"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const propertyId = process.env.GUESTY_PROPERTY_ID!

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 })
    }

    const availability = await getAvailability(propertyId, startDate, endDate)

    return NextResponse.json(availability)
  } catch (error) {
    console.error("[v0] Error fetching availability:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}
