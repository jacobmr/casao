import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "Missing code parameter" }, { status: 400 })
    }

    // Retrieve the stored inquiry
    const storedData = await kv.get<string>(`seasonal:${code}`)
    if (!storedData) {
      return NextResponse.json({ error: "Code not found or expired" }, { status: 404 })
    }

    const inquiry = typeof storedData === "string" ? JSON.parse(storedData) : storedData

    // Mark as used
    inquiry.used = true
    inquiry.usedAt = new Date().toISOString()

    // Save back to Redis (keep the same TTL by re-setting with 30 days)
    await kv.set(`seasonal:${code}`, JSON.stringify(inquiry), { ex: 30 * 24 * 60 * 60 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Seasonal use error:", error)
    return NextResponse.json({ error: "Failed to mark code as used" }, { status: 500 })
  }
}
