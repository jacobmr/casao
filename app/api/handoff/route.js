import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * Branded Checkout Handoff Endpoint
 * 
 * Creates a seamless handoff from Casa O to Blue Zone's Guesty checkout
 * while maintaining Casa O branding throughout the journey.
 * 
 * Flow:
 * 1. Guest selects dates on casavistas.net
 * 2. Clicks "Book This!" 
 * 3. Sees Casa O branded "Secure Checkout" interstitial
 * 4. Redirects to Blue Zone Guesty (pre-filled with dates)
 * 5. Blue Zone handles payment, contract, confirmation
 * 
 * Benefits:
 * - Casa O controls UX/branding
 * - Blue Zone keeps Stripe + contracts
 * - No GuestyPay credentials needed
 * - Trackable with UUID
 * - Zero PM lift
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const adults = searchParams.get('adults') || '2';
    const propertyId = searchParams.get('propertyId') || process.env.GUESTY_PROPERTY_ID;

    // Validate required parameters
    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing checkIn or checkOut parameters' },
        { status: 400 }
      );
    }

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID not configured' },
        { status: 500 }
      );
    }

    // Generate unique reference ID for tracking
    const uuid = randomUUID();
    
    // Log handoff for analytics
    console.log(`🔄 Handoff created: ${uuid}`, {
      checkIn,
      checkOut,
      adults,
      propertyId,
      timestamp: new Date().toISOString()
    });

    // TODO: Store in database/Redis for tracking
    // await logHandoff({ uuid, checkIn, checkOut, adults, propertyId });

    // Build Blue Zone Guesty checkout URL
    const blueZoneURL = 
      `https://bluezoneexperience.guestybookings.com/en/properties/${encodeURIComponent(propertyId)}/checkout` +
      `?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&utm_source=casao&ref=${uuid}`;

    // Return branded interstitial HTML
    const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Secure Checkout – Casa Vistas</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #00785c 0%, #059669 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      color: #1f2937;
    }
    
    .card {
      background: white;
      border-radius: 24px;
      padding: 3rem 2rem;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      animation: slideUp 0.4s ease-out;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .logo {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 2rem;
      font-weight: bold;
      color: #00785c;
      margin-bottom: 1.5rem;
    }
    
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, #00785c 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
    
    .icon svg {
      width: 32px;
      height: 32px;
      stroke: white;
      stroke-width: 2;
      fill: none;
    }
    
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }
    
    p {
      font-size: 1.125rem;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #00785c 0%, #059669 100%);
      color: white;
      text-decoration: none;
      padding: 1rem 2.5rem;
      border-radius: 12px;
      font-size: 1.125rem;
      font-weight: 600;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0, 120, 92, 0.3);
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 120, 92, 0.4);
    }
    
    .button:active {
      transform: translateY(0);
    }
    
    .details {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
      font-size: 0.875rem;
      color: #9ca3af;
    }
    
    .ref-id {
      font-family: 'Courier New', monospace;
      background: #f3f4f6;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      display: inline-block;
      margin-top: 0.5rem;
    }
    
    @media (max-width: 640px) {
      .card {
        padding: 2rem 1.5rem;
      }
      
      h1 {
        font-size: 1.5rem;
      }
      
      p {
        font-size: 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Casa Vistas</div>
    
    <div class="icon">
      <svg viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4"></path>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
      </svg>
    </div>
    
    <h1>You're Almost There!</h1>
    
    <p>
      Your booking will be finalized securely through our property management partner, 
      <strong>Blue Zone Experience</strong>.
    </p>
    
    <div style="margin: 1.5rem 0; padding: 1rem; background: #dbeafe; border: 2px solid #3b82f6; border-radius: 12px;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <svg style="width: 20px; height: 20px; stroke: #3b82f6; fill: none;" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
        </svg>
        <strong style="color: #1e40af; font-size: 0.95rem;">Have a Discount Code?</strong>
      </div>
      <p style="color: #1e40af; font-size: 0.875rem; margin: 0;">
        Enter your discount code on the next page to save on your booking!
      </p>
      <p style="color: #60a5fa; font-size: 0.75rem; margin: 0.5rem 0 0 0;">
        Active codes: <strong>CasaO20</strong>, <strong>CasaO30</strong>, <strong>CasaO40</strong>, <strong>CasaO50</strong>
      </p>
    </div>
    
    <a class="button" href="${blueZoneURL}">
      Continue to Secure Checkout →
    </a>
    
    <div class="details">
      <div>Booking Reference</div>
      <div class="ref-id">${uuid}</div>
    </div>
  </div>
  
  <script>
    // Auto-redirect after 3 seconds (optional)
    // setTimeout(() => {
    //   window.location.href = "${blueZoneURL}";
    // }, 3000);
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Handoff error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout handoff' },
      { status: 500 }
    );
  }
}
