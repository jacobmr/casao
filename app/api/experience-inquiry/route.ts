import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { experiences } from "@/lib/experiences-data"

const resend = new Resend(process.env.RESEND_API_KEY)

interface InquiryData {
  name: string
  email: string
  phone?: string
  dates: string
  message?: string
  experiences: string[]
}

export async function POST(request: NextRequest) {
  try {
    const data: InquiryData = await request.json()

    // Validate required fields
    if (!data.name || !data.email || !data.dates || !data.experiences?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get experience names for the email
    const selectedExperiences = data.experiences
      .map((id) => experiences.find((e) => e.id === id)?.name || id)
      .filter(Boolean)

    // Log inquiry
    console.log("📧 New Experience Inquiry:")
    console.log("━".repeat(50))
    console.log(`Name:     ${data.name}`)
    console.log(`Email:    ${data.email}`)
    console.log(`Phone:    ${data.phone || "Not provided"}`)
    console.log(`Dates:    ${data.dates}`)
    console.log(`Message:  ${data.message || "None"}`)
    console.log(`Experiences (${selectedExperiences.length}):`)
    selectedExperiences.forEach((exp) => console.log(`  • ${exp}`))
    console.log("━".repeat(50))

    // Build email HTML
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a; border-bottom: 2px solid #0d9488; padding-bottom: 12px;">
          New Experience Inquiry from Casa Vistas
        </h2>

        <table style="border-collapse: collapse; width: 100%; margin: 24px 0;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600; color: #525252; width: 120px;">Name</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600; color: #525252;">Email</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
              <a href="mailto:${data.email}" style="color: #0d9488;">${data.email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600; color: #525252;">Phone</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a;">${data.phone || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600; color: #525252;">Travel Dates</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600;">${data.dates}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: 600; color: #525252;">Message</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a;">${data.message || "<em style='color: #a3a3a3;'>None</em>"}</td>
          </tr>
        </table>

        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px;">
            Selected Experiences (${selectedExperiences.length})
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: #525252;">
            ${selectedExperiences.map((exp) => `<li style="margin: 8px 0;">${exp}</li>`).join("")}
          </ul>
        </div>

        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
          <p style="color: #a3a3a3; font-size: 13px; margin: 0;">
            This inquiry was submitted from the Casa Vistas website.<br>
            Please follow up within 24 hours.
          </p>
        </div>
      </div>
    `

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Casa Vistas <noreply@salundo.com>",
      to: process.env.INQUIRY_EMAIL || "jacob@reider.us",
      replyTo: data.email,
      subject: `Experience Inquiry from ${data.name} - ${data.dates}`,
      html: emailHtml,
    })

    if (emailError) {
      console.error("Resend error:", emailError)
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }

    console.log("✅ Email sent successfully to", process.env.INQUIRY_EMAIL)

    return NextResponse.json({
      success: true,
      message: "Inquiry received. We'll be in touch within 24 hours.",
    })
  } catch (error) {
    console.error("Experience inquiry error:", error)
    return NextResponse.json(
      { error: "Failed to process inquiry" },
      { status: 500 }
    )
  }
}
