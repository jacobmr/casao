import { NextResponse } from 'next/server';
import { getCachedToken } from '../../../lib/token-service';

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
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}
