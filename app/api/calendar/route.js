import { NextResponse } from 'next/server';
import { getCachedToken } from '../../../lib/token-service-kv';
import { getAvailabilityWithFallback, getCachedAvailability, setCachedAvailability } from '../../../lib/kv-cache';
import { getSeasonType, getSeasonLabel } from '../../../lib/seasonal';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId') || process.env.GUESTY_PROPERTY_ID;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!listingId || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: listingId, from, to' },
        { status: 400 }
      );
    }

    // Extract year and month for cache key
    const fromDate = new Date(from);
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();

    // Check if we should skip cache (for real-time verification)
    const skipCache = searchParams.get('skipCache') === 'true';

    if (skipCache) {
      console.log(`🔍 Cache bypass requested - fetching fresh data`);
      // Direct fetch bypassing cache
      const token = await getCachedToken();
      const url = `https://booking.guesty.com/api/listings/${listingId}/calendar?from=${from}&to=${to}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: `Guesty API error: ${error}` },
          { status: response.status }
        );
      }

      const data = await response.json();

      // Cache the fresh result
      await setCachedAvailability(year, month, data.days || data);

      // Enrich with season info
      const enrichedData = (data.days || data || []).map(day => ({
        ...day,
        season: getSeasonType(new Date(day.date)),
        seasonLabel: getSeasonLabel(getSeasonType(new Date(day.date)))
      }));

      return NextResponse.json(enrichedData);
    }

    // Use shared read-through cache function
    const token = await getCachedToken();
    const data = await getAvailabilityWithFallback(year, month, token);

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to fetch availability data' },
        { status: 500 }
      );
    }

    // Enrich with season info
    const enrichedData = (data || []).map(day => ({
      ...day,
      season: getSeasonType(new Date(day.date)),
      seasonLabel: getSeasonLabel(getSeasonType(new Date(day.date)))
    }));

    return NextResponse.json(enrichedData);

  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}
