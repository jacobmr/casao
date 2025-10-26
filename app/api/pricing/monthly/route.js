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
    
    // Cache the pricing data in the consolidated pricing.json file
    const CACHE_FILE = path.join(CACHE_DIR, 'pricing.json');
    
    // Load existing cache
    let cache = { data: {}, timestamp: new Date().toISOString() };
    if (fs.existsSync(CACHE_FILE)) {
      try {
        cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      } catch (error) {
        console.error('Error reading pricing cache:', error);
      }
    }
    
    // Add monthly pricing to cache
    const monthKey = `monthly_${year}_${month}`;
    cache.data[monthKey] = pricingData;
    cache.timestamp = new Date().toISOString();
    
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
    console.log(`💾 Cached monthly pricing for ${year}-${month + 1}`);
    
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
