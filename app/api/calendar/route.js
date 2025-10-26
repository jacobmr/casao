import { NextResponse } from 'next/server';
import { getCachedToken } from '../../../lib/token-service';
import { getCachedAvailability, setCachedAvailability } from '../../../lib/availability-cache';

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
    
    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cached = getCachedAvailability(year, month);
      if (cached) {
        console.log(`✅ Returning cached data for ${year}-${month}`);
        return NextResponse.json(cached);
      }
    } else {
      console.log(`🔍 Cache bypass requested - fetching fresh data`);
    }
    
    // Cache miss or bypass - fetch from Guesty
    console.log(`🌐 Fetching from Guesty API: ${from} to ${to}`);
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
    
    // Cache the result
    setCachedAvailability(year, month, data);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}
