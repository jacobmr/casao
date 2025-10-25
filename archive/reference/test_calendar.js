#!/usr/bin/env node
// Test the Guesty Booking Engine API calendar endpoint
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

(async () => {
  const token = getToken();
  console.log('Token loaded ✓\n');

  // Test calendar endpoint
  const startDate = '2025-11-01';
  const endDate = '2026-01-31';
  
  console.log(`Testing calendar endpoint for ${LISTING_ID}`);
  console.log(`Date range: ${startDate} to ${endDate}\n`);

  const url = `https://booking.guesty.com/api/listings/${LISTING_ID}/calendar?from=${startDate}&to=${endDate}`;
  console.log('URL:', url, '\n');

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    console.log('Status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.log('Error:', error);
      return;
    }

    const data = await response.json();
    console.log('\nResponse structure:');
    console.log('- Type:', Array.isArray(data) ? 'Array' : 'Object');
    console.log('- Length/Keys:', Array.isArray(data) ? data.length : Object.keys(data).length);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\nFirst day example:');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('\nLast day example:');
      console.log(JSON.stringify(data[data.length - 1], null, 2));
      
      // Count available vs blocked
      const available = data.filter(d => d.status === 'available').length;
      const blocked = data.filter(d => d.status === 'booked' || d.status === 'unavailable').length;
      
      console.log('\nSummary:');
      console.log(`- Total days: ${data.length}`);
      console.log(`- Available: ${available}`);
      console.log(`- Blocked: ${blocked}`);
    } else {
      console.log('\nFull response:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
})();
