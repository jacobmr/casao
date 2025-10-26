import { NextResponse } from 'next/server';
import { getCachedToken } from '../../../lib/token-service';

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
    console.log('✅ Quote received:', data.money?.totalPrice);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Quotes API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
