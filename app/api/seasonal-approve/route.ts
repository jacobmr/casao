import { NextResponse } from "next/server"
import { Resend } from "resend"
import { getSeasonalCode, setSeasonalCode } from "@/lib/kv-cache"

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

// Map discount percentages to promo codes
const PROMO_CODES: Record<number, string> = {
  20: "CASAO20",
  30: "CASAO30",
  40: "CASAO40",
  50: "CASAO50",
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const discountStr = searchParams.get("discount")

    if (!code || !discountStr) {
      return new Response(generateErrorPage("Missing code or discount parameter"), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      })
    }

    const discount = parseInt(discountStr, 10)
    if (![20, 30, 40, 50].includes(discount)) {
      return new Response(generateErrorPage("Invalid discount percentage"), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      })
    }

    // Retrieve the stored inquiry
    const inquiry = await getSeasonalCode(code)
    if (!inquiry) {
      return new Response(generateErrorPage("This code has expired or doesn't exist"), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      })
    }

    // Check if already approved
    if (inquiry.promoCode) {
      return new Response(generateErrorPage(`This inquiry was already approved with ${inquiry.promoCode}`), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      })
    }

    // Get the promo code for this discount level
    const promoCode = PROMO_CODES[discount]

    // Update the inquiry with the promo code
    inquiry.promoCode = promoCode
    inquiry.approvedAt = new Date().toISOString()
    inquiry.discountPercent = discount

    // Save back to Redis (refresh TTL)
    await setSeasonalCode(code, inquiry)

    // Build the booking URL they'll use
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.casavistas.net"
    const bookingUrl = `${baseUrl}/seasonal/book/${code}`

    // Send approval email to the guest
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 8px;">
          🎉 You've Been Approved!
        </h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
          Hi ${escapeHtml(inquiry.firstName)}, we'd love to host you at Casa Vistas.
        </p>

        <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #bbf7d0; text-align: center;">
          <p style="color: #15803d; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">
            Your Exclusive Discount
          </p>
          <p style="color: #166534; font-size: 48px; font-weight: 700; margin: 0 0 8px 0;">
            ${discount}% OFF
          </p>
          <p style="color: #22c55e; font-size: 14px; margin: 0;">
            for ${escapeHtml(inquiry.checkIn)} → ${escapeHtml(inquiry.checkOut)}
          </p>
        </div>

        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #374151; font-size: 14px; margin: 0 0 16px 0;">
            We reviewed your request and we think you'll be a great fit for our home.
            Click below to complete your booking with your personal discount applied.
          </p>
          <a href="${bookingUrl}" style="display: block; background: #1a1a1a; color: white; padding: 16px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;">
            Complete Your Booking →
          </a>
        </div>

        <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #fcd34d;">
          <p style="color: #92400e; font-size: 13px; margin: 0;">
            <strong>Important:</strong> This link is personal to you and can only be used once.
            Please complete your booking within the next 7 days.
          </p>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          If you have any questions, just reply to this email — we're happy to help.
        </p>

        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          Looking forward to hosting you,<br/>
          <strong>Jacob & Alicia</strong><br/>
          <span style="color: #9ca3af;">Casa Vistas</span>
        </p>
      </div>
    `

    console.log(`📧 Sending approval email to ${inquiry.email}...`)
    const emailResult = await resend.emails.send({
      from: "Casa Vistas <noreply@salundo.com>",
      to: inquiry.email,
      replyTo: "jacob@reider.us",
      subject: `🎉 Your ${discount}% Discount for Casa Vistas is Ready!`,
      html: emailHtml,
    })
    console.log(`✅ Approval email result:`, emailResult)

    // Return success page
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Approved! - Casa Vistas</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0fdf4;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
          }
          .card {
            background: white;
            border-radius: 16px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          }
          .icon { font-size: 64px; margin-bottom: 16px; }
          h1 { color: #166534; font-size: 28px; margin: 0 0 16px 0; }
          p { color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; }
          .code {
            background: #dcfce7;
            border: 2px dashed #22c55e;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 24px;
            font-weight: bold;
            color: #166534;
            margin-bottom: 24px;
            display: inline-block;
          }
          .details {
            background: #f9fafb;
            border-radius: 8px;
            padding: 16px;
            text-align: left;
            font-size: 14px;
            color: #6b7280;
          }
          .details strong { color: #374151; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>Discount Approved!</h1>
          <p>We've sent <strong>${escapeHtml(inquiry.firstName)}</strong> an email with their ${discount}% discount.</p>
          <div class="code">${escapeHtml(promoCode)}</div>
          <div class="details">
            <p><strong>Guest:</strong> ${escapeHtml(inquiry.firstName)} ${escapeHtml(inquiry.lastName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(inquiry.email)}</p>
            <p><strong>Dates:</strong> ${escapeHtml(inquiry.checkIn)} → ${escapeHtml(inquiry.checkOut)}</p>
            <p><strong>Booking Link:</strong> <a href="${escapeHtml(bookingUrl)}">${escapeHtml(bookingUrl)}</a></p>
          </div>
        </div>
      </body>
      </html>
    `

    return new Response(successHtml, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    })
  } catch (error) {
    console.error("Seasonal approval error:", error)
    return new Response(generateErrorPage("Something went wrong. Please try again."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    })
  }
}

function generateErrorPage(message: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error - Casa Vistas</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #fef2f2;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { color: #991b1b; font-size: 24px; margin: 0 0 12px 0; }
        p { color: #6b7280; font-size: 15px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">❌</div>
        <h1>Oops!</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `
}
