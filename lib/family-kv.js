/**
 * Vercel KV Utilities for Family Portal
 * Manages family bookings, password hashing, and session storage
 */

import { createClient } from 'redis';
import { randomUUID } from 'crypto';

// Create and connect Redis client
let redisClient = null;

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

// ============================================
// Family Booking Functions
// ============================================

/**
 * Create a new family booking
 * @param {Object} booking - Booking data
 * @returns {Promise<Object>} Created booking with ID
 */
export async function createFamilyBooking(booking) {
  try {
    const redis = await getRedisClient();
    const id = randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const familyBooking = {
      id,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail || null,
      guestCount: booking.guestCount,
      notes: booking.notes || null,
      status: 'pending',
      guestyBlocked: false,
      createdAt: now,
      updatedAt: now
    };

    // Store individual booking
    await redis.set(
      `family:bookings:${id}`,
      JSON.stringify(familyBooking)
    );

    // Add to list of all bookings
    await redis.sAdd('family:bookings:list', id);

    console.log(`✅ Created family booking ${id}:`, familyBooking);
    return familyBooking;
  } catch (error) {
    console.error('Error creating family booking:', error);
    throw error;
  }
}

/**
 * Get a family booking by ID
 * @param {string} id - Booking UUID
 * @returns {Promise<Object|null>}
 */
export async function getFamilyBooking(id) {
  try {
    const redis = await getRedisClient();
    const cached = await redis.get(`family:bookings:${id}`);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  } catch (error) {
    console.error(`Error getting family booking ${id}:`, error);
    return null;
  }
}

/**
 * Get all family bookings
 * @param {string} statusFilter - Optional status filter ('pending', 'approved', 'rejected')
 * @returns {Promise<Array>}
 */
export async function getAllFamilyBookings(statusFilter = null) {
  try {
    const redis = await getRedisClient();
    const ids = await redis.sMembers('family:bookings:list');

    if (!ids || ids.length === 0) {
      return [];
    }

    const bookings = await Promise.all(
      ids.map(async (id) => {
        const data = await redis.get(`family:bookings:${id}`);
        return data ? JSON.parse(data) : null;
      })
    );

    // Filter out null values and apply status filter
    let filteredBookings = bookings.filter(b => b !== null);

    if (statusFilter) {
      filteredBookings = filteredBookings.filter(b => b.status === statusFilter);
    }

    // Sort by creation date (newest first)
    return filteredBookings.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting all family bookings:', error);
    return [];
  }
}

/**
 * Get approved family bookings for a date range
 * Used to display on the family calendar
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export async function getApprovedBookingsInRange(startDate, endDate) {
  try {
    const allBookings = await getAllFamilyBookings('approved');
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Filter bookings that overlap with the date range
    return allBookings.filter(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);

      // Check for overlap
      return checkIn <= end && checkOut >= start;
    });
  } catch (error) {
    console.error('Error getting approved bookings in range:', error);
    return [];
  }
}

/**
 * Update a family booking
 * @param {string} id - Booking UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>}
 */
export async function updateFamilyBooking(id, updates) {
  try {
    const redis = await getRedisClient();
    const existing = await getFamilyBooking(id);

    if (!existing) {
      throw new Error(`Booking ${id} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: Math.floor(Date.now() / 1000)
    };

    await redis.set(
      `family:bookings:${id}`,
      JSON.stringify(updated)
    );

    console.log(`✅ Updated family booking ${id}:`, updates);
    return updated;
  } catch (error) {
    console.error(`Error updating family booking ${id}:`, error);
    throw error;
  }
}

/**
 * Approve a family booking
 * @param {string} id - Booking UUID
 * @returns {Promise<Object>}
 */
export async function approveFamilyBooking(id) {
  return await updateFamilyBooking(id, { status: 'approved' });
}

/**
 * Reject a family booking
 * @param {string} id - Booking UUID
 * @returns {Promise<Object>}
 */
export async function rejectFamilyBooking(id) {
  return await updateFamilyBooking(id, { status: 'rejected' });
}

/**
 * Delete a family booking
 * @param {string} id - Booking UUID
 * @returns {Promise<boolean>}
 */
export async function deleteFamilyBooking(id) {
  try {
    const redis = await getRedisClient();

    // Remove from list
    await redis.sRem('family:bookings:list', id);

    // Delete individual booking
    await redis.del(`family:bookings:${id}`);

    console.log(`✅ Deleted family booking ${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting family booking ${id}:`, error);
    return false;
  }
}

// ============================================
// Password & Session Functions
// ============================================

/**
 * Verify family portal password
 * @param {string} password - Plain text password to check
 * @returns {Promise<boolean>}
 */
export async function verifyFamilyPassword(password) {
  try {
    // Simple case-insensitive check against "michael"
    // PRD specifies this simple password approach is intentional
    const normalizedPassword = password.toLowerCase().trim();
    const correctPassword = 'michael';

    return normalizedPassword === correctPassword;
  } catch (error) {
    console.error('Error verifying family password:', error);
    return false;
  }
}

/**
 * Create a family session token
 * @returns {Promise<string>} Session token UUID
 */
export async function createFamilySession() {
  try {
    const redis = await getRedisClient();
    const sessionToken = randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;

    const sessionData = {
      authenticated: true,
      expiresAt
    };

    await redis.set(
      `family:session:${sessionToken}`,
      JSON.stringify(sessionData),
      { EX: SESSION_DURATION }
    );

    console.log(`✅ Created family session ${sessionToken} (expires in 30 days)`);
    return sessionToken;
  } catch (error) {
    console.error('Error creating family session:', error);
    throw error;
  }
}

/**
 * Verify a family session token
 * @param {string} sessionToken - Session token UUID
 * @returns {Promise<boolean>}
 */
export async function verifyFamilySession(sessionToken) {
  try {
    if (!sessionToken) {
      return false;
    }

    const redis = await getRedisClient();
    const cached = await redis.get(`family:session:${sessionToken}`);

    if (!cached) {
      return false;
    }

    const sessionData = JSON.parse(cached);
    const now = Math.floor(Date.now() / 1000);

    return sessionData.authenticated && sessionData.expiresAt > now;
  } catch (error) {
    console.error('Error verifying family session:', error);
    return false;
  }
}

/**
 * Delete a family session (logout)
 * @param {string} sessionToken - Session token UUID
 * @returns {Promise<boolean>}
 */
export async function deleteFamilySession(sessionToken) {
  try {
    const redis = await getRedisClient();
    await redis.del(`family:session:${sessionToken}`);
    console.log(`✅ Deleted family session ${sessionToken}`);
    return true;
  } catch (error) {
    console.error('Error deleting family session:', error);
    return false;
  }
}
