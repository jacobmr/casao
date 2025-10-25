import { getCachedToken } from './token-service';

export function getGuestyConfig() {
  const baseUrl = process.env.GUESTY_BASE_URL || 'https://booking-api.guesty.com/v1';
  const clientId = process.env.GUESTY_CLIENT_ID;
  const clientSecret = process.env.GUESTY_CLIENT_SECRET;
  const tokenUrl = process.env.GUESTY_OAUTH_TOKEN_URL; // required
  const propertyId = process.env.GUESTY_PROPERTY_ID;
  const bookingUrl = process.env.GUESTY_BOOKING_URL;
  return { baseUrl, clientId, clientSecret, tokenUrl, propertyId, bookingUrl };
}

export function hasGuestyCreds() {
  const { clientId, clientSecret, tokenUrl } = getGuestyConfig();
  const scope = process.env.GUESTY_OAUTH_SCOPE || 'booking_engine:api';
  return Boolean(clientId && clientSecret && tokenUrl);
}

// Use centralized token service - DO NOT fetch tokens directly!
async function getAccessToken() {
  return await getCachedToken();
}

export async function guestyFetch(pathname, { method = 'GET', headers = {}, search = {}, body } = {}) {
  const { baseUrl } = getGuestyConfig();
  const token = await getAccessToken();
  const url = new URL(pathname.replace(/^\//, ''), baseUrl + '/');
  for (const [k, v] of Object.entries(search || {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    method,
    headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Guesty API ${method} ${url} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

// Example: availability lookup (adjust the path/params to your Booking API spec)
export async function fetchAvailability({ start, end, listingId }) {
  // Placeholder path; update to your actual Booking API endpoint and params.
  // e.g., '/availability' or '/listings/{id}/availability'
  const path = '/search';
  const search = { checkIn: start, checkOut: end, adults: 2, listingId };
  return guestyFetch(path, { search });
}


export async function guestyBookingFetch(pathname, opts={}) {
  const token = await (async ()=>{
    return await (await import('./guesty.js')).getAccessToken?.() || await (await import('./guesty.js')).default?.getAccessToken();
  })().catch(()=>null);
  const url = new URL(pathname.replace(/^\//,''), 'https://booking.guesty.com/');
  const res = await fetch(url, {
    method: opts.method||'GET',
    headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json', ...(opts.headers||{}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    throw new Error(`Guesty Booking API ${opts.method||'GET'} ${url} failed: ${res.status} ${txt}`);
  }
  return res.json();
}
