import { NextResponse } from 'next/server';
import { getCachedToken } from '../../../lib/token-service-kv';
import { getCachedAvailability, setCachedAvailability, setMonthlyPricing } from '../../../lib/kv-cache';
import { fetchMonthlyPricing } from '../../../lib/pricing-fetcher';

/**
 * Send Pushover notification for new bookings (replaced SimplePush Dec 2024)
 */
async function sendBookingNotification(newBookings) {
  const pushoverUserKey = process.env.PUSHOVER_USER_KEY;
  const pushoverApiToken = process.env.PUSHOVER_API_TOKEN;
  if (!pushoverUserKey || !pushoverApiToken || newBookings.length === 0) return;

  try {
    // Group bookings by date range
    const sortedBookings = newBookings.sort((a, b) => new Date(a.date) - new Date(b.date));
    const ranges = [];
    let currentRange = { start: sortedBookings[0].date, end: sortedBookings[0].date };

    for (let i = 1; i < sortedBookings.length; i++) {
      const prevDate = new Date(sortedBookings[i - 1].date);
      const currDate = new Date(sortedBookings[i].date);
      const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      if (daysDiff === 1) {
        // Consecutive dates - extend range
        currentRange.end = sortedBookings[i].date;
      } else {
        // Non-consecutive - save current range and start new one
        ranges.push(currentRange);
        currentRange = { start: sortedBookings[i].date, end: sortedBookings[i].date };
      }
    }
    ranges.push(currentRange);

    // Format notification message
    const title = '🏠 New Casa Vistas Reservation!';
    let message = '';

    ranges.forEach((range, index) => {
      const nights = Math.ceil((new Date(range.end) - new Date(range.start)) / (1000 * 60 * 60 * 24)) + 1;
      if (range.start === range.end) {
        // Single date detected - could be part of larger booking
        message += `New booking on ${range.start}`;
      } else {
        message += `${range.start} → ${range.end} (${nights} nights)`;
      }
      if (index < ranges.length - 1) message += ' | ';
    });

    // Send via Pushover API
    const formData = new URLSearchParams({
      token: pushoverApiToken,
      user: pushoverUserKey,
      title: title,
      message: message,
    });
    await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      body: formData,
    });
    console.log('📱 Booking notification sent:', message);
  } catch (error) {
    console.error('Failed to send booking notification:', error);
  }
}

/**
 * Manual cache warmup endpoint
 * Pre-populates KV cache with 6 months of availability AND pricing data
 * Detects new bookings and sends notifications
 */
export async function GET(request) {
  try {
    console.log('🔥 Cache warmup started');

    const listingId = process.env.GUESTY_PROPERTY_ID;
    const token = await getCachedToken();
    const results = [];
    const allNewBookings = [];

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

          // Step 1: Get old cached data for comparison
          const oldCachedData = await getCachedAvailability(year, month);

          // Step 2: Detect new bookings (available → booked)
          if (oldCachedData && Array.isArray(oldCachedData) && Array.isArray(days)) {
            const oldAvailabilityMap = new Map(oldCachedData.map(day => [day.date, day.status]));
            const newBookings = days.filter(day => {
              const oldStatus = oldAvailabilityMap.get(day.date);
              return oldStatus === 'available' && day.status === 'booked';
            });

            if (newBookings.length > 0) {
              console.log(`  🎉 Found ${newBookings.length} newly booked dates!`);
              allNewBookings.push(...newBookings);
            }
          }

          // Step 3: Cache new availability data
          await setCachedAvailability(year, month, days);
          console.log(`  ✅ Cached availability for ${year}-${month + 1}`);

          // Step 4: Fetch and cache pricing for available dates
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

    // Send notification if new bookings were detected
    if (allNewBookings.length > 0) {
      await sendBookingNotification(allNewBookings);
    }

    console.log('✅ Cache warmup complete!');

    return NextResponse.json({
      success: true,
      message: 'Cache warmup completed',
      results,
      newBookings: allNewBookings.length
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
