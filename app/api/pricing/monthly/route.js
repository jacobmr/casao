import { NextResponse } from 'next/server';
import { getMonthlyPricingData } from '../../../../lib/pricing-fetcher';
import { getCachedAvailability } from '../../../../lib/availability-cache';

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(process.cwd(), '.cache');

/**
 * Fetch and cache monthly pricing for available dates
 * POST /api/pricing/monthly
 * Body: { year, month, availabilityData }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { year, month, availabilityData } = body;
    
    if (year === undefined || month === undefined) {
      return NextResponse.json(
        { error: 'year and month are required' },
        { status: 400 }
      );
    }
    
    console.log(`💰 Fetching monthly pricing for ${year}-${month + 1}...`);
    
    // Get availability data if not provided
    let avail = availabilityData;
    if (!avail) {
      avail = getCachedAvailability(year, month);
      if (!avail) {
        return NextResponse.json(
          { error: 'Availability data not found. Fetch availability first.' },
          { status: 400 }
        );
      }
      avail = Array.isArray(avail) ? avail : avail.days || [];
    }
    
    // Fetch pricing for available dates
    const pricingData = await getMonthlyPricingData(avail);
    
    // Cache the pricing data
    const cacheKey = `monthly_pricing_${year}_${month}`;
    const filePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    
    const cacheEntry = {
      data: pricingData,
      timestamp: new Date().toISOString(),
    };
    
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(cacheEntry, null, 2), 'utf8');
    console.log(`💾 Cached monthly pricing for ${year}-${month + 1} to file`);
    
    return NextResponse.json({
      success: true,
      count: pricingData.length,
      data: pricingData
    });
    
  } catch (error) {
    console.error('Monthly pricing API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch monthly pricing' },
      { status: 500 }
    );
  }
}
