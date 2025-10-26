import { NextResponse } from 'next/server';
import { getMonthlyPricing } from '../../../../lib/kv-cache';

/**
 * Get cached monthly pricing from Redis
 * GET /api/pricing/monthly-cached?year=2025&month=10
 * 
 * Returns per-day pricing for the calendar display
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year'));
    const month = parseInt(searchParams.get('month'));
    
    if (isNaN(year) || isNaN(month)) {
      return NextResponse.json(
        { success: false, error: 'year and month are required' },
        { status: 400 }
      );
    }
    
    console.log(`📊 Fetching monthly pricing for ${year}-${month}`);
    
    // Read from Redis cache
    const data = await getMonthlyPricing(year, month);
    
    if (!data) {
      console.log(`❌ No pricing cached for ${year}-${month}`);
      return NextResponse.json({
        success: false,
        message: `No pricing cached for ${year}-${month}`
      });
    }
    
    console.log(`✅ Found pricing for ${year}-${month}:`, Object.keys(data).length, 'days');
    
    return NextResponse.json({
      success: true,
      data,
      count: Object.keys(data).length
    });
    
  } catch (error) {
    console.error('Monthly pricing cache read error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
