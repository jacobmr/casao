import { NextResponse } from 'next/server';

export async function GET() {
  const result = { ok: false, steps: [] };
  try {
    const tokenUrl = process.env.GUESTY_OAUTH_TOKEN_URL || 'https://booking.guesty.com/oauth2/token';
    const scope = process.env.GUESTY_OAUTH_SCOPE || 'booking_engine:api';
    const clientId = process.env.GUESTY_CLIENT_ID;
    const clientSecret = process.env.GUESTY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.json({ ok: false, error: 'Missing client id/secret' }, { status: 400 });
    }
    // 1) token
    const params = new URLSearchParams();
    params.set('grant_type', 'client_credentials');
    params.set('scope', scope);
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);
    const tRes = await fetch(tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: params });
    const tText = await tRes.text();
    result.steps.push({ step: 'token', status: tRes.status, body: tText.slice(0, 200) });
    if (!tRes.ok) return NextResponse.json(result, { status: 502 });
    const tok = JSON.parse(tText);
    const token = tok.access_token;

    // 2) search
    const baseApi = process.env.GUESTY_BASE_URL || 'https://booking-api.guesty.com/v1';
    const searchUrlEnv = process.env.GUESTY_SEARCH_URL || `${baseApi}/search`;
    const candidates = [
      `${searchUrlEnv}?checkIn=2025-12-10&checkOut=2025-12-12&adults=2`,
      `${searchUrlEnv}?checkInDate=2025-12-10&checkOutDate=2025-12-12&adults=2`,
    ];
    let sStatus = 0, sBody = '', sTried = '';
    for (const url of candidates) {
      try {
        const sRes = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
        sStatus = sRes.status; sBody = (await sRes.text()).slice(0, 300); sTried = url; break;
      } catch (e) { /* try next */ }
    }
    result.steps.push({ step: 'search', tried: sTried, status: sStatus, body: sBody });
    result.ok = true;
    return NextResponse.json(result);
  } catch (e) {
    result.error = String(e.message || e);
    return NextResponse.json(result, { status: 500 });
  }
}
