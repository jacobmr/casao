import { NextResponse } from 'next/server';
import { getCachedToken } from '../../../lib/token-service-kv';
import { getCachedPricing, setCachedPricing } from '../../../lib/kv-cache';

export async function POST(request) {
  try {
    const body = await request.json();
    const { checkIn, checkOut, guests = 2 } = body;
    const listingId = process.env.GUESTY_PROPERTY_ID;
    
    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'checkIn and checkOut are required' },
        { status: 400 }
      );
    }
    
    // Check cache first
    const cached = await getCachedPricing(checkIn, checkOut, guests);
    if (cached) {
      return NextResponse.json(cached);
    }
    
    console.log(`💰 Fetching quote for ${checkIn} to ${checkOut}, ${guests} guests`);
    
    const token = await getCachedToken();
    
    // Use Guesty's quotes endpoint
    const url = 'https://booking.guesty.com/api/reservations/quotes';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        listingId,
        checkInDateLocalized: checkIn,
        checkOutDateLocalized: checkOut,
        adults: guests,
        children: 0,
        currency: 'USD',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Guesty quotes API error:', error);
      return NextResponse.json(
        { error: `Guesty API error: ${error}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Log the full structure to debug pricing
    console.log('✅ Quote received - Full response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Log specific pricing paths
    console.log('📊 Pricing breakdown:');
    console.log('  - rates.ratePlans[0].money:', data.rates?.ratePlans?.[0]?.money);
    console.log('  - money (top level):', data.money);
    
    // Cache the result
    await setCachedPricing(checkIn, checkOut, guests, data);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Quotes API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
