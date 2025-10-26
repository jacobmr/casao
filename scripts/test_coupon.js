#!/usr/bin/env node
/**
 * Test Discount/Coupon Codes
 * 
 * Tests if discount codes are activated and working with Guesty API
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.cwd(), '.cache', 'guesty-token.json');
const LISTING_ID = process.env.GUESTY_PROPERTY_ID || '688a8aae483ff0001243e891';

function getToken() {
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (cache.expires_at - 30 > now) {
      return cache.access_token;
    }
    throw new Error('Cached token expired');
  } catch (e) {
    throw new Error('No cached token. Run: node scripts/get_token.js');
  }
}

async function testCoupon(couponCode) {
  const token = getToken();
  
  console.log(`\n🎟️  Testing coupon code: "${couponCode}"\n`);
  
  // Step 1: Create a quote
  console.log('1️⃣  Creating quote...');
  const quoteResponse = await fetch('https://booking.guesty.com/api/reservations/quotes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      listingId: LISTING_ID,
      checkInDateLocalized: '2025-11-01',
      checkOutDateLocalized: '2025-11-08',
      adults: 2,
      children: 0,
      currency: 'USD'
    })
  });
  
  if (!quoteResponse.ok) {
    const error = await quoteResponse.text();
    console.error('❌ Quote failed:', error);
    return;
  }
  
  const quote = await quoteResponse.json();
  console.log('✅ Quote created:', quote._id);
  
  // Extract price from nested structure
  const ratePlan = quote.rates?.ratePlans?.[0]?.ratePlan;
  const money = ratePlan?.money;
  
  if (!money || !money.hostPayout) {
    console.log('   Quote response:', JSON.stringify(quote, null, 2).slice(0, 500));
    console.error('❌ Quote missing price information');
    return;
  }
  
  console.log('   Accommodation:', `$${money.fareAccommodation.toFixed(2)}`);
  console.log('   Taxes:', `$${money.totalTaxes.toFixed(2)}`);
  console.log('   Total (Host Payout):', `$${money.hostPayout.toFixed(2)}`);
  
  // Step 2: Apply coupon to quote
  console.log('\n2️⃣  Applying coupon...');
  const couponResponse = await fetch(
    `https://booking.guesty.com/api/reservations/quotes/${quote._id}/coupons`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coupons: [couponCode]
      })
    }
  );
  
  console.log('   Status:', couponResponse.status);
  
  if (!couponResponse.ok) {
    const error = await couponResponse.text();
    console.log('❌ Coupon failed:', error);
    
    try {
      const errorData = JSON.parse(error);
      if (errorData.error) {
        console.log('\n📋 Error details:');
        console.log('   Code:', errorData.error.code);
        console.log('   Message:', errorData.error.message);
        
        if (errorData.error.code === 'COUPON_NOT_FOUND') {
          console.log('\n💡 This means:');
          console.log('   - Coupon code does not exist, OR');
          console.log('   - Coupon is not activated in Guesty, OR');
          console.log('   - Coupon is configured for wrong booking type');
        }
      }
    } catch (e) {
      // Not JSON
    }
    return;
  }
  
  const updatedQuote = await couponResponse.json();
  console.log('✅ Coupon applied successfully!');
  
  const updatedRatePlan = updatedQuote.rates?.ratePlans?.[0]?.ratePlan;
  const updatedMoney = updatedRatePlan?.money;
  
  if (updatedMoney) {
    console.log('\n💰 Price comparison:');
    console.log('   Original:', `$${money.hostPayout.toFixed(2)}`);
    console.log('   Discounted:', `$${updatedMoney.hostPayout.toFixed(2)}`);
    console.log('   Savings:', `$${(money.hostPayout - updatedMoney.hostPayout).toFixed(2)}`);
    console.log('   Discount:', `${((1 - updatedMoney.hostPayout / money.hostPayout) * 100).toFixed(0)}%`);
  }
  
  if (updatedQuote.coupons && updatedQuote.coupons.length > 0) {
    console.log('\n🎟️  Coupon details:');
    console.log('   Code:', updatedQuote.coupons[0].code || couponCode);
    console.log('   Applied:', updatedQuote.coupons[0]);
  }
}

// Run test
(async () => {
  const couponCode = process.argv[2];
  
  if (!couponCode) {
    console.log('Usage: node scripts/test_coupon.js <COUPON_CODE>');
    console.log('Example: node scripts/test_coupon.js SUMMER2025');
    process.exit(1);
  }
  
  try {
    await testCoupon(couponCode);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
