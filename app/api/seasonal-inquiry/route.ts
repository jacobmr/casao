import { NextResponse } from "next/server"
import { Resend } from "resend"
import { nanoid } from "nanoid"
import { setSeasonalCode } from "@/lib/kv-cache"

const resend = new Resend(process.env.RESEND_API_KEY)

// HTML escape function to prevent XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// Validate URL to prevent javascript: and other malicious schemes
function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    // Only allow http and https schemes
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return escapeHtml(url)
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.checkIn || !data.checkOut || !data.aboutYou) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate a unique one-time code (12 chars, URL-safe)
    const oneTimeCode = nanoid(12)

    // Calculate nights
    const checkInDate = new Date(data.checkIn)
    const checkOutDate = new Date(data.checkOut)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

    // Store the code in Redis with inquiry details
    // Code expires in 30 days
    const codeData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      guests: data.guests || "2",
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights,
      aboutYou: data.aboutYou,
      socialLink: data.socialLink || null,
      createdAt: new Date().toISOString(),
      used: false,
      promoCode: null, // You'll set this when you reply
    }

    await setSeasonalCode(oneTimeCode, codeData)

    // Build approval links for different discount levels
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.casavistas.net"
    const approvalLinks = [20, 30, 40, 50].map((discount) => ({
      discount,
      url: `${baseUrl}/api/seasonal-approve?code=${oneTimeCode}&discount=${discount}`,
    }))

    // Send email to owner
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 8px;">
          🏠 New Seasonal Discount Request
        </h1>
        <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
          Someone is interested in booking Casa Vistas
        </p>

        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="font-size: 16px; color: #1a1a1a; margin: 0 0 16px 0;">Guest Details</h2>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #666; padding: 4px 0;">Name:</td>
              <td style="color: #1a1a1a; font-weight: 500;">${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 4px 0;">Email:</td>
              <td style="color: #1a1a1a;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
            </tr>
            <tr>
              <td style="color: #666; padding: 4px 0;">Guests:</td>
              <td style="color: #1a1a1a;">${escapeHtml(data.guests || "2")}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 4px 0;">Dates:</td>
              <td style="color: #1a1a1a;">${escapeHtml(data.checkIn)} → ${escapeHtml(data.checkOut)} (${nights} nights)</td>
            </tr>
            ${data.socialLink ? (() => {
              const safeUrl = sanitizeUrl(data.socialLink)
              return safeUrl ? `
            <tr>
              <td style="color: #666; padding: 4px 0;">Social:</td>
              <td style="color: #1a1a1a;"><a href="${safeUrl}" target="_blank">${safeUrl}</a></td>
            </tr>
            ` : `
            <tr>
              <td style="color: #666; padding: 4px 0;">Social:</td>
              <td style="color: #dc2626;">(Invalid URL provided)</td>
            </tr>
            `
            })() : ""}
          </table>
        </div>

        <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
          <h2 style="font-size: 16px; color: #1a1a1a; margin: 0 0 12px 0;">About Themselves</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(data.aboutYou)}</p>
        </div>

        <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #fcd34d;">
          <h2 style="font-size: 16px; color: #1a1a1a; margin: 0 0 12px 0;">🎟️ Quick Approve</h2>
          <p style="color: #666; font-size: 13px; margin: 0 0 16px 0;">
            Click a button to send them a discount code. This will email them automatically.
          </p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${approvalLinks.map((link) => `
              <a href="${link.url}" style="display: inline-block; padding: 10px 16px; background: #1a1a1a; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
                ${link.discount}% Off
              </a>
            `).join("")}
          </div>
        </div>

        <div style="background: #f1f5f9; border-radius: 8px; padding: 12px; margin-bottom: 24px;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            <strong>One-Time Code:</strong> ${oneTimeCode}<br/>
            This code will expire in 30 days if not used.
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          Sent from Casa Vistas Seasonal Booking System
        </p>
      </div>
    `

    // Hardcoded email for now - INQUIRY_EMAIL env var has formatting issues
    const toEmail = "jacob@reider.us"
    console.log(`📧 Sending seasonal inquiry email to ${toEmail}...`)

    const emailResult = await resend.emails.send({
      from: "Casa Vistas <noreply@salundo.com>",
      to: toEmail,
      subject: `🏠 Seasonal Request: ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)} | ${escapeHtml(data.checkIn)} → ${escapeHtml(data.checkOut)}`,
      html: emailHtml,
    })

    console.log(`✅ Seasonal inquiry email sent:`, emailResult)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Seasonal inquiry error:", error)
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 })
  }
}
