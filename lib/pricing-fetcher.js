// Fetch per-day pricing for available dates only
// Makes weekly quote requests to get pricing efficiently

const { getCachedToken } = require('./token-service');

/**
 * Fetch per-day pricing for available dates in a month
 * @param {Array} availabilityData - Array of {date, status} from calendar API
 */
async function fetchMonthlyPricing(availabilityData) {
  const token = await getCachedToken();
  const listingId = process.env.GUESTY_PROPERTY_ID;
  
  // Filter to only available dates
  const availableDates = availabilityData
    .filter(day => day.status === 'available')
    .map(day => day.date)
    .sort();
  
  if (availableDates.length === 0) {
    console.log('💰 No available dates to fetch pricing for');
    return new Map();
  }
  
  console.log(`💰 Fetching pricing for ${availableDates.length} available dates...`);
  
  const pricingByDate = new Map();
  
  // Group available dates into weekly chunks
  const weeklyChunks = [];
  let currentChunk = [availableDates[0]];
  
  for (let i = 1; i < availableDates.length; i++) {
    const prevDate = new Date(availableDates[i - 1]);
    const currDate = new Date(availableDates[i]);
    const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
    
    // If dates are consecutive and chunk < 7 days, add to current chunk
    if (daysDiff <= 1 && currentChunk.length < 7) {
      currentChunk.push(availableDates[i]);
    } else {
      // Start new chunk
      if (currentChunk.length >= 3) { // Only fetch if at least 3 days
        weeklyChunks.push(currentChunk);
      }
      currentChunk = [availableDates[i]];
    }
  }
  
  // Add last chunk
  if (currentChunk.length >= 3) {
    weeklyChunks.push(currentChunk);
  }
  
  console.log(`  📦 Split into ${weeklyChunks.length} chunks for pricing`);
  
  // Fetch pricing for each chunk
  for (const chunk of weeklyChunks) {
    const checkInStr = chunk[0];
    const checkOutDate = new Date(chunk[chunk.length - 1]);
    checkOutDate.setDate(checkOutDate.getDate() + 1); // Add 1 day for checkout
    const checkOutStr = checkOutDate.toISOString().split('T')[0];
    
    try {
      const response = await fetch('https://booking.guesty.com/api/reservations/quotes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          checkInDateLocalized: checkInStr,
          checkOutDateLocalized: checkOutStr,
          adults: 2,
          children: 0,
          currency: 'USD',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const days = data.rates?.ratePlans?.[0]?.days || [];
        
        days.forEach(day => {
          if (day.price && day.date) {
            pricingByDate.set(day.date, day.price);
            console.log(`  ${day.date}: $${day.price}`);
          }
        });
      } else {
        const error = await response.text();
        console.warn(`  ⚠️  Quote failed for ${checkInStr} to ${checkOutStr} (may have restrictions)`);
      }
      
      // Rate limit: 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`  ❌ Error fetching pricing for ${checkInStr}:`, error.message);
    }
  }
  
  console.log(`✅ Fetched pricing for ${pricingByDate.size} days`);
  return pricingByDate;
}

/**
 * Get pricing data structure for caching
 * @param {Array} availabilityData - Array of {date, status} from calendar API
 */
async function getMonthlyPricingData(availabilityData) {
  const pricingMap = await fetchMonthlyPricing(availabilityData);
  
  // Convert Map to array for JSON storage
  return Array.from(pricingMap.entries()).map(([date, price]) => ({
    date,
    price
  }));
}

module.exports = { fetchMonthlyPricing, getMonthlyPricingData };
