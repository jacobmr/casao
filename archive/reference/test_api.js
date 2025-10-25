#!/usr/bin/env node
// Test Guesty API endpoints using cached token (avoids rate limits)
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.cwd(), '.cache', 'guesty-token.json');
const LISTING_ID = process.env.GUESTY_PROPERTY_ID;

// Guesty Booking Engine API endpoints
// NOTE: booking-api.guesty.com does NOT exist (NXDOMAIN) - all endpoints are under booking.guesty.com
const SEARCH_URL = 'https://booking.guesty.com/api/v1/search';
const QUOTES_URL = 'https://booking.guesty.com/api/reservations/quotes';
// Note: instant/inquiry use quoteId in path, not separate endpoints

function getToken() {
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (cache.expires_at - 30 > now) {
      return cache.access_token;
    }
    throw new Error('Cached token expired. Run: node scripts/get_token.js');
  } catch (e) {
    throw new Error('No cached token. Run: node scripts/get_token.js');
  }
}

async function beGet(url, token) {
  try {
    const res = await fetch(url, { 
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } 
    });
    const text = await res.text();
    return { status: res.status, body: text };
  } catch (err) {
    return { status: 0, body: `Fetch error: ${err.message}`, error: err };
  }
}

async function bePost(url, token, body) {
  try {
    const res = await fetch(url, { 
      method: 'POST', 
      headers: { 
        Authorization: `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      }, 
      body: JSON.stringify(body || {}) 
    });
    const text = await res.text();
    return { status: res.status, body: text };
  } catch (err) {
    return { status: 0, body: `Fetch error: ${err.message}`, error: err };
  }
}

(async () => {
  console.log('Using cached token...');
  const token = getToken();
  console.log('Token valid ✓\n');

  console.log('1) Testing search endpoint...');
  const searchUrl = `${SEARCH_URL}?checkIn=2025-12-10&checkOut=2025-12-12&adults=2`;
  console.log('   URL:', searchUrl);
  const sres = await beGet(searchUrl, token);
  console.log('   Status:', sres.status);
  console.log('   Response:', sres.body.slice(0, 400));
  
  if (sres.status !== 200) {
    console.log('\n⚠️  Search failed. Trying alternate parameter names...');
    const altUrl = `${SEARCH_URL}?checkInDate=2025-12-10&checkOutDate=2025-12-12&adults=2`;
    console.log('   URL:', altUrl);
    const sres2 = await beGet(altUrl, token);
    console.log('   Status:', sres2.status);
    console.log('   Response:', sres2.body.slice(0, 400));
  }

  if (!LISTING_ID) {
    console.log('\n⚠️  GUESTY_PROPERTY_ID not set. Skipping quote/booking tests.');
    return;
  }

  console.log('\n2) Creating quote...');
  console.log('   URL:', QUOTES_URL);
  console.log('   Listing ID:', LISTING_ID);
  const qres = await bePost(QUOTES_URL, token, {
    listingId: LISTING_ID,
    checkInDateLocalized: '2026-01-15',
    checkOutDateLocalized: '2026-01-22',
    adults: 2,
    children: 0,
    currency: 'USD',
  });
  console.log('   Status:', qres.status);
  if (qres.status >= 400) {
    console.log('   Response:', qres.body.slice(0, 600));
  } else {
    console.log('   Response preview:', qres.body.slice(0, 200) + '...');
  }

  if (qres.status >= 200 && qres.status < 300) {
    try {
      const qjson = JSON.parse(qres.body);
      const quoteId = qjson._id || qjson.id;
      const ratePlanId = qjson.rates?.ratePlans?.[0]?.ratePlan?._id;
      if (quoteId) {
        console.log('   Quote ID:', quoteId);
        console.log('   Rate Plan ID:', ratePlanId || 'not found');

        console.log('\n3a) Testing INSTANT booking...');
        const instantUrl = `${QUOTES_URL}/${quoteId}/instant`;
        console.log('   URL:', instantUrl);
        const inst = await bePost(instantUrl, token, {
          ratePlanId: ratePlanId,
          guest: { 
            firstName: 'Test', 
            lastName: 'Guest', 
            email: 'test@example.com', 
            phone: '+11234567890' 
          },
          ccToken: 'TEST_FAKE_TOKEN'
        });
        console.log('   Status:', inst.status);
        if (inst.status >= 400) {
          console.log('   Error:', inst.body.slice(0, 300));
        } else {
          console.log('   Success!', inst.body.slice(0, 150));
        }

        console.log('\n3b) Testing INQUIRY booking...');
        const inquiryUrl = `${QUOTES_URL}/${quoteId}/inquiry`;
        console.log('   URL:', inquiryUrl);
        const inq = await bePost(inquiryUrl, token, {
          ratePlanId: ratePlanId,
          guest: { 
            firstName: 'Test', 
            lastName: 'Guest', 
            email: 'test@example.com', 
            phone: '+11234567890' 
          },
          message: 'Testing inquiry flow'
        });
        console.log('   Status:', inq.status);
        if (inq.status >= 400) {
          console.log('   Error:', inq.body.slice(0, 300));
        } else {
          console.log('   Success!', inq.body.slice(0, 150));
        }

        console.log('\n📊 RESULTS:');
        if (inst.status >= 200 && inst.status < 300 && inq.status >= 200 && inq.status < 300) {
          console.log('   ✅ Mode: BOTH (instant + inquiry)');
        } else if (inst.status >= 400 && inq.status >= 200 && inq.status < 300) {
          console.log('   ✅ Mode: INQUIRY-ONLY');
        } else if (inst.status >= 200 && inst.status < 300) {
          console.log('   ✅ Mode: INSTANT-ONLY');
        } else {
          console.log('   ⚠️  Check responses above for errors');
        }
      }
    } catch (e) {
      console.log('   Could not parse quote response');
    }
  }

  console.log('\n✅ Test complete!');
})().catch(e => { 
  console.error('\n❌ Error:', e.message); 
  process.exit(1); 
});
