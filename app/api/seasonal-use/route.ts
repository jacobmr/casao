import { NextResponse } from "next/server"
import { getSeasonalCode, setSeasonalCode } from "@/lib/kv-cache"

export async function POST(request: Request) {
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

    // Mark as used
    inquiry.used = true
    inquiry.usedAt = new Date().toISOString()

    // Save back to Redis (keep the same TTL by re-setting with 30 days)
    await setSeasonalCode(code, inquiry)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Seasonal use error:", error)
    return NextResponse.json({ error: "Failed to mark code as used" }, { status: 500 })
  }
}
