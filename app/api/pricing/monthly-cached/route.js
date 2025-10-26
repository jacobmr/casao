import { NextResponse } from 'next/server';

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.cwd(), '.cache', 'pricing.json');

/**
 * Get cached monthly pricing (read-only, fast)
 * GET /api/pricing/monthly-cached?year=2025&month=10
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
    
    // Read from cache file
    if (!fs.existsSync(CACHE_FILE)) {
      return NextResponse.json({
        success: false,
        message: 'No pricing cache available'
      });
    }
    
    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf8');
    const cache = JSON.parse(cacheContent);
    
    const monthKey = `monthly_${year}_${month}`;
    const data = cache.data[monthKey];
    
    if (!data) {
      return NextResponse.json({
        success: false,
        message: `No pricing cached for ${year}-${month}`
      });
    }
    
    return NextResponse.json({
      success: true,
      data,
      count: data.length
    });
    
  } catch (error) {
    console.error('Monthly pricing cache read error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
