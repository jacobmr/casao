#!/usr/bin/env node
// Smoke test for Guesty Booking Engine API
// - Fetch OAuth token from booking.guesty.com
// - Call search endpoint (host/path configurable)
// - Optionally create a quote and try inquiry/instant

require('dotenv').config();
const fetch = global.fetch;

const CLIENT_ID = process.env.GUESTY_CLIENT_ID;
const CLIENT_SECRET = process.env.GUESTY_CLIENT_SECRET;
const TOKEN_URL = process.env.GUESTY_OAUTH_TOKEN_URL || 'https://booking.guesty.com/oauth2/token';
const BASE_API = process.env.GUESTY_BASE_URL || 'https://booking-api.guesty.com/v1';
const LISTING_ID = process.env.GUESTY_PROPERTY_ID; // optional
const SCOPE = process.env.GUESTY_OAUTH_SCOPE || 'booking_engine:api';

// Optional explicit endpoints (override if docs differ)
const SEARCH_URL = process.env.GUESTY_SEARCH_URL || `${BASE_API}/search`;
const QUOTES_URL = process.env.GUESTY_QUOTES_URL || 'https://booking.guesty.com/api/reservations/quotes';
const INSTANT_URL = process.env.GUESTY_INSTANT_URL || `${BASE_API}/reservations/instant`;
const INQUIRY_URL = process.env.GUESTY_INQUIRY_URL || `${BASE_API}/reservations/inquiry`;

function mask(s, keep=6){ if(!s) return ''; return s.slice(0,keep) + '…'; }

async function getToken(){
  const params = new URLSearchParams();
  params.set('grant_type','client_credentials');
  params.set('scope', SCOPE);
  params.set('client_id', CLIENT_ID);
  params.set('client_secret', CLIENT_SECRET);
  const res = await fetch(TOKEN_URL, { method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'}, body: params });
  const text = await res.text();
  if(!res.ok){
    throw new Error(`Token error ${res.status}: ${text.slice(0,200)}`);
  }
  try { return JSON.parse(text); } catch { throw new Error(`Token parse error: ${text.slice(0,200)}`); }
}

async function beGet(url, token){
  const res = await fetch(url, { headers:{ Authorization:`Bearer ${token}`, Accept:'application/json' } });
  const t = await res.text();
  return { status: res.status, body: t };
}

async function bePost(url, token, body){
  const res = await fetch(url, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify(body||{}) });
  const t = await res.text();
  return { status: res.status, body: t };
}

(async () => {
  if(!CLIENT_ID || !CLIENT_SECRET){
    console.error('Missing GUESTY_CLIENT_ID / GUESTY_CLIENT_SECRET in .env');
    process.exit(1);
  }
  console.log('1) Requesting token from:', TOKEN_URL);
  const tok = await getToken();
  console.log('   token_type:', tok.token_type || 'Bearer');
  console.log('   access_token:', mask(tok.access_token));
  console.log('   expires_in(s):', tok.expires_in);

  const token = tok.access_token;
  console.log('\n2) Search availability (GET)...');
  const candidates = [
    `${SEARCH_URL}?checkIn=2025-12-10&checkOut=2025-12-12&adults=2`,
    `${SEARCH_URL}?checkInDate=2025-12-10&checkOutDate=2025-12-12&adults=2`,
  ];
  let sres = null, sUrl = null;
  for (const url of candidates) {
    try {
      const r = await beGet(url, token);
      sres = r; sUrl = url; break;
    } catch (e) {
      // try next
    }
  }
  if (!sres) throw new Error('Search failed for all candidate URLs');
  console.log('   tried:', sUrl);
  console.log('   status:', sres.status);
  console.log('   body:', sres.body.slice(0, 300));

  if(LISTING_ID){
    console.log(`\n3) Create quote (POST ${QUOTES_URL})...`);
    const qres = await bePost(QUOTES_URL, token, {
      listingId: LISTING_ID,
      checkInDate: '2025-12-10',
      checkOutDate: '2025-12-12',
      adults: 2,
      children: 0,
      currency: 'USD',
    });
    console.log('   status:', qres.status);
    console.log('   body:', qres.body.slice(0, 300));

    try {
      const qjson = JSON.parse(qres.body);
      if(qres.status >= 200 && qres.status < 300 && qjson.id){
        const quoteId = qjson.id;
        console.log(`\n4a) Try instant reservation from quote (POST ${INSTANT_URL})...`);
        const inst = await bePost(INSTANT_URL, token, {
          quoteId,
          guest: { firstName: 'Test', lastName: 'Guest', email: 'test@example.com', phone: '+11234567890' },
          payment: { method: 'guestyPayToken', token: 'TEST_OR_FAKE_TOKEN' }
        });
        console.log('   instant status:', inst.status);
        console.log('   instant body:', inst.body.slice(0, 300));

        console.log(`\n4b) Try inquiry reservation from quote (POST ${INQUIRY_URL})...`);
        const inq = await bePost(INQUIRY_URL, token, {
          quoteId,
          guest: { firstName: 'Test', lastName: 'Guest', email: 'test@example.com', phone: '+11234567890' },
          message: 'Testing inquiry flow'
        });
        console.log('   inquiry status:', inq.status);
        console.log('   inquiry body:', inq.body.slice(0, 300));
      }
    } catch(e){
      console.log('   Could not parse quote response JSON.');
    }
  } else {
    console.log('\n(listingId not set; skipping quote/inquiry/instant tests. Set GUESTY_PROPERTY_ID to enable.)');
  }

  console.log('\nDone.');
})().catch(e => { console.error('Smoke test failed:', e.message); process.exit(1); });

