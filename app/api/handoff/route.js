import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * Render lead capture form
 */
function renderLeadCaptureForm({ checkIn, checkOut, adults, experiences, promoCode }) {
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Complete Your Booking – Casa Vistas</title>
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
      text-align: center;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    p {
      font-size: 1rem;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 2rem;
      text-align: center;
    }

    .booking-summary {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 2rem;
      text-align: center;
    }

    .booking-summary strong {
      display: block;
      color: #00785c;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .booking-summary .dates {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .booking-summary .details {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
      background: white;
    }

    input:focus {
      outline: none;
      border-color: #00785c;
      box-shadow: 0 0 0 3px rgba(0, 120, 92, 0.1);
    }

    input::placeholder {
      color: #9ca3af;
    }

    .button {
      width: 100%;
      background: linear-gradient(135deg, #00785c 0%, #059669 100%);
      color: white;
      text-decoration: none;
      padding: 1rem 2.5rem;
      border-radius: 12px;
      font-size: 1.125rem;
      font-weight: 600;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0, 120, 92, 0.3);
      border: none;
      cursor: pointer;
      display: block;
    }

    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 120, 92, 0.4);
    }

    .button:active {
      transform: translateY(0);
    }

    .button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .privacy {
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: #9ca3af;
      text-align: center;
      line-height: 1.5;
    }

    @media (max-width: 640px) {
      .card {
        padding: 2rem 1.5rem;
      }

      h1 {
        font-size: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Casa Vistas</div>

    <h1>One Last Step!</h1>
    <p>Please share your contact info so we can assist with your stay</p>

    <div class="booking-summary">
      <strong>Your Selected Dates</strong>
      <div class="dates">${checkIn} → ${checkOut}</div>
      <div class="details">${nights} nights • ${adults} guests</div>
    </div>

    <form id="leadForm" onsubmit="submitForm(event)">
      <div class="form-group">
        <label for="name">Full Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder="John Doe"
          autocomplete="name"
        />
      </div>

      <div class="form-group">
        <label for="email">Email Address *</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="john@example.com"
          autocomplete="email"
        />
      </div>

      <button type="submit" class="button" id="submitBtn">
        Continue to Checkout →
      </button>
    </form>

    <div class="privacy">
      We'll only use this to send booking confirmations and stay details.
      <br>We never share your info with third parties.
    </div>
  </div>

  <script>
    function submitForm(event) {
      event.preventDefault();

      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;

      // Redirect to handoff with name and email
      const params = new URLSearchParams({
        checkIn: '${checkIn}',
        checkOut: '${checkOut}',
        adults: '${adults}',
        name: name,
        email: email
      });

      ${experiences ? `params.set('experiences', '${experiences}');` : ''}
      ${promoCode ? `params.set('promo', '${promoCode}');` : ''}

      window.location.href = '/api/handoff?' + params.toString();
    }
  </script>
</body>
</html>
  `;
}

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
    const experiences = searchParams.get('experiences'); // Comma-separated experience IDs
    const promoCode = searchParams.get('promo'); // Promo/discount code
    const guestName = searchParams.get('name');
    const guestEmail = searchParams.get('email');

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

    // Parse experience selections
    const selectedExperiences = experiences ? experiences.split(',').filter(Boolean) : [];
    const hasDiscount = selectedExperiences.length >= 2;

    // Build Blue Zone Guesty property URL (not /checkout - that doesn't exist)
    const blueZoneURL =
      `https://bluezoneexperience.guestybookings.com/en/properties/${encodeURIComponent(propertyId)}` +
      `?minOccupancy=${adults}&checkIn=${checkIn}&checkOut=${checkOut}`;

    // If name/email not provided, show lead capture form first (no notification yet)
    if (!guestName || !guestEmail) {
      return new NextResponse(renderLeadCaptureForm({ checkIn, checkOut, adults, experiences, promoCode }), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // User has completed lead capture - log and notify
    console.log(`🔄 Handoff created: ${uuid}`, {
      checkIn,
      checkOut,
      adults,
      propertyId,
      experiences: selectedExperiences,
      experienceCount: selectedExperiences.length,
      discountApplied: hasDiscount,
      promoCode: promoCode || null,
      guestName: guestName,
      guestEmail: guestEmail,
      timestamp: new Date().toISOString()
    });

    // Send push notification via Pushover (only after lead capture completed)
    const pushoverUserKey = process.env.PUSHOVER_USER_KEY;
    const pushoverApiToken = process.env.PUSHOVER_API_TOKEN;
    if (pushoverUserKey && pushoverApiToken) {
      try {
        const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
        const title = '🏠 Casa Vistas Booking';
        const guestInfo = `\n${guestName} (${guestEmail})`;
        const message = `${checkIn} → ${checkOut} (${nights} nights, ${adults} guests)${promoCode ? ` [${promoCode}]` : ''}${guestInfo}`;

        const formData = new URLSearchParams({
          token: pushoverApiToken,
          user: pushoverUserKey,
          title: title,
          message: message,
        });
        await fetch('https://api.pushover.net/1/messages.json', {
          method: 'POST',
          body: formData,
        });
        console.log('📱 Push notification sent');
      } catch (pushError) {
        console.error('Push notification failed:', pushError);
        // Don't block the handoff if push fails
      }
    }

    // TODO: Store in database/Redis for tracking
    // await logHandoff({ uuid, checkIn, checkOut, adults, propertyId });

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
    
    ${promoCode ? `
    <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; text-align: center;">
      <div style="font-weight: 700; color: #047857; font-size: 1.125rem; margin-bottom: 0.5rem;">
        🎉 Special Rate Applied!
      </div>
      <div style="font-size: 0.875rem; color: #065f46; margin-bottom: 1rem;">
        Enter this code at checkout to receive your discount:
      </div>
      <button onclick="copyCode()" style="background: white; border: 2px dashed #10b981; padding: 0.75rem 1.5rem; border-radius: 8px; display: inline-block; margin-bottom: 1rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#ecfdf5'" onmouseout="this.style.background='white'">
        <code id="promoCode" style="font-family: 'Courier New', monospace; font-size: 1.25rem; font-weight: 700; color: #047857; letter-spacing: 0.05em;">${promoCode}</code>
        <span style="margin-left: 0.5rem; font-size: 0.75rem; color: #6b7280;">📋</span>
      </button>
      <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 1rem;">
        Click to copy — you'll need it on the next page
      </div>
      <div id="copyToast" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #111827; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        ✓ Copied to clipboard!
      </div>
      <div style="background: #f9fafb; border-radius: 8px; padding: 0.75rem; margin-top: 0.5rem;">
        <div style="font-size: 0.875rem; color: #374151; margin-bottom: 0.5rem; font-weight: 600;">Look for this on the checkout page and paste the code:</div>
        <img src="/images/discount-code-hint.png" alt="Where to enter coupon code" style="max-width: 100%; border-radius: 6px; border: 1px solid #e5e7eb;" />
      </div>
    </div>
    ` : ''}

    ${selectedExperiences.length > 0 ? `
    <div style="background: #f3f4f6; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; text-align: left;">
      <div style="font-weight: 600; color: #111827; margin-bottom: 0.75rem;">
        ✨ Your Selected Experiences (${selectedExperiences.length})
      </div>
      <div style="font-size: 0.875rem; color: #6b7280; line-height: 1.6;">
        ${selectedExperiences.map(id => `• ${id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('<br>')}
      </div>
      ${hasDiscount ? `
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.875rem; color: #059669; font-weight: 600;">
        🎉 5% discount applied to your lodging!
      </div>
      ` : ''}
      <div style="margin-top: 1rem; font-size: 0.75rem; color: #9ca3af;">
        Our concierge team will contact you to confirm availability and pricing for your selected experiences.
      </div>
    </div>
    ` : ''}
    
    <a class="button" href="${blueZoneURL}">
      Continue to Secure Checkout →
    </a>
    
    <div class="details">
      <div>Booking Reference</div>
      <div class="ref-id">${uuid}</div>
    </div>
  </div>
  
  <script>
    function copyCode() {
      const code = document.getElementById('promoCode');
      if (code) {
        navigator.clipboard.writeText(code.textContent).then(() => {
          const toast = document.getElementById('copyToast');
          if (toast) {
            toast.style.display = 'block';
            setTimeout(() => {
              toast.style.display = 'none';
            }, 1500);
          }
        });
      }
    }
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
