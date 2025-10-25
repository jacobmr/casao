import { hasGuestyCreds, fetchAvailability } from '../../../lib/guesty';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const listingId = searchParams.get('listingId') || process.env.GUESTY_PROPERTY_ID || undefined;

  if (!hasGuestyCreds()) {
    return new Response(JSON.stringify({ error: 'Missing Guesty OAuth env (client id/secret/token URL)' }), {
      status: 501,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (!start || !end) {
    return new Response(JSON.stringify({ error: 'Missing required query params: start, end (YYYY-MM-DD)' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const data = await fetchAvailability({ start, end, listingId });
    return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
