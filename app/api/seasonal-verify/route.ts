import { NextResponse } from "next/server"
import { getSeasonalCode } from "@/lib/kv-cache"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "Missing code parameter" }, { status: 400 })
    }

    // Retrieve the stored inquiry
    const inquiry = await getSeasonalCode(code)
    if (!inquiry) {
      return NextResponse.json({ error: "Code not found or expired" }, { status: 404 })
    }

    // Return the booking data (without sensitive internal fields)
    return NextResponse.json({
      firstName: inquiry.firstName,
      lastName: inquiry.lastName,
      email: inquiry.email,
      guests: inquiry.guests,
      checkIn: inquiry.checkIn,
      checkOut: inquiry.checkOut,
      nights: inquiry.nights,
      promoCode: inquiry.promoCode,
      discountPercent: inquiry.discountPercent,
      used: inquiry.used || false,
    })
  } catch (error) {
    console.error("Seasonal verify error:", error)
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 })
  }
}
