import { hasGuestyCreds, fetchAvailability } from '../../../lib/guesty';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!hasGuestyCreds()) {
    return new Response(JSON.stringify({ error: 'Missing Guesty credentials' }), {
      status: 501,
      headers: { 'content-type': 'application/json' },
    });
  }

  const data = await fetchAvailability({ start, end });
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
}
