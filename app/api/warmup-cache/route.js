import { NextResponse } from 'next/server';
import { getCachedToken } from '../../../lib/token-service-kv';
import { setCachedAvailability } from '../../../lib/kv-cache';

/**
 * Manual cache warmup endpoint
 * Pre-populates KV cache with 6 months of availability data
 */
export async function GET(request) {
  try {
    console.log('🔥 Cache warmup started');
    
    const listingId = process.env.GUESTY_PROPERTY_ID;
    const token = await getCachedToken();
    const results = [];
    
    // Warm up next 6 months
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const from = new Date(year, month, 1).toISOString().split('T')[0];
      const to = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      console.log(`📅 Warming up ${year}-${month + 1}...`);
      
      try {
        const url = `https://booking.guesty.com/api/listings/${listingId}/calendar?from=${from}&to=${to}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          await setCachedAvailability(year, month, data.days || data);
          results.push({ month: `${year}-${month}`, status: 'success' });
          console.log(`✅ Cached ${year}-${month + 1}`);
        } else {
          results.push({ month: `${year}-${month}`, status: 'failed', error: response.status });
        }
        
        // Rate limit: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({ month: `${year}-${month}`, status: 'error', error: error.message });
      }
    }
    
    console.log('✅ Cache warmup complete!');
    
    return NextResponse.json({
      success: true,
      message: 'Cache warmup completed',
      results
    });
    
  } catch (error) {
    console.error('Cache warmup error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Cache warmup failed' 
      },
      { status: 500 }
    );
  }
}
