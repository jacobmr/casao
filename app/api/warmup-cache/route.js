import { NextResponse } from 'next/server';
import { getCachedToken } from '../../../lib/token-service-kv';
import { setCachedAvailability, setMonthlyPricing } from '../../../lib/kv-cache';
import { fetchMonthlyPricing } from '../../../lib/pricing-fetcher';

/**
 * Manual cache warmup endpoint
 * Pre-populates KV cache with 6 months of availability AND pricing data
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
          const days = data.days || data;
          
          // Step 1: Cache availability data
          await setCachedAvailability(year, month, days);
          console.log(`  ✅ Cached availability for ${year}-${month + 1}`);
          
          // Step 2: Fetch and cache pricing for available dates
          console.log(`  💰 Fetching pricing for available dates...`);
          const pricingMap = await fetchMonthlyPricing(days);
          
          // Convert Map to object for Redis storage
          const pricingByDate = {};
          pricingMap.forEach((price, date) => {
            pricingByDate[date] = price;
          });
          
          await setMonthlyPricing(year, month, pricingByDate);
          console.log(`  ✅ Cached pricing for ${year}-${month + 1} (${pricingMap.size} prices)`);
          
          results.push({ 
            month: `${year}-${month}`, 
            status: 'success',
            daysCount: Array.isArray(days) ? days.length : 0,
            pricesCount: pricingMap.size
          });
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
