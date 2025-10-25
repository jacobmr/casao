import { hasGuestyCreds, guestyBookingFetch } from '../../../lib/guesty';

export async function POST(request) {
  if (!hasGuestyCreds()) {
    return new Response(JSON.stringify({ error: 'Missing Guesty OAuth env' }), { status: 501, headers: { 'content-type': 'application/json' } });
  }
  const body = await request.json().catch(() => ({}));
  const { listingId, checkInDateLocalized, checkOutDateLocalized, adults = 2, children = 0, currency = 'USD' } = body || {};
  if (!listingId || !checkInDateLocalized || !checkOutDateLocalized) {
    return new Response(JSON.stringify({ error: 'listingId, checkInDateLocalized, checkOutDateLocalized are required' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  try {
    const data = await guestyBookingFetch('/api/reservations/quotes', {
      method: 'POST',
      body: { listingId, checkInDateLocalized, checkOutDateLocalized, adults, children, currency },
    });
    return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
