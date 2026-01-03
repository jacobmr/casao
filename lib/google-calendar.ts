/**
 * Google Calendar Service for Family Portal
 * Reads and writes family bookings to Google Calendar
 */

import { google, calendar_v3 } from 'googleapis'

// Types for family calendar events
export interface FamilyCalendarEvent {
  id: string
  title: string
  start: string  // YYYY-MM-DD
  end: string    // YYYY-MM-DD
  guestCount?: number
  notes?: string
  status: 'pending' | 'confirmed'
  isPending: boolean
}

// Cached calendar client (singleton pattern for serverless)
let cachedCalendarClient: calendar_v3.Calendar | null = null

// Initialize Google Calendar client (cached for performance)
function getCalendarClient(): calendar_v3.Calendar {
  if (cachedCalendarClient) {
    return cachedCalendarClient
  }

  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!privateKey || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error('Google Calendar credentials not configured')
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
  })

  cachedCalendarClient = google.calendar({ version: 'v3', auth })
  return cachedCalendarClient
}

/**
 * Get all family bookings from Google Calendar
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 */
export async function getFamilyBookings(from: string, to: string): Promise<FamilyCalendarEvent[]> {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID not configured')
  }

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date(from).toISOString(),
      timeMax: new Date(to).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    })

    const events = response.data.items || []

    return events.map(event => {
      const title = event.summary || 'Unavailable'
      const isPending = title.toLowerCase().startsWith('pending:') || title.toLowerCase().startsWith('pending ')

      // Parse guest count from title if present (e.g., "Sarah M (4 guests)")
      const guestMatch = title.match(/\((\d+)\s*guests?\)/i)
      const guestCount = guestMatch ? parseInt(guestMatch[1], 10) : undefined

      return {
        id: event.id || '',
        title: title.replace(/^pending:\s*/i, '').replace(/^pending\s+/i, ''),
        start: event.start?.date || event.start?.dateTime?.split('T')[0] || '',
        end: event.end?.date || event.end?.dateTime?.split('T')[0] || '',
        guestCount,
        notes: event.description || undefined,
        status: isPending ? 'pending' : 'confirmed',
        isPending,
      }
    })
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error)
    throw error
  }
}

/**
 * Create a new pending booking request on Google Calendar
 */
export async function createBookingRequest(data: {
  guestName: string
  checkIn: string
  checkOut: string
  guestCount: number
  notes?: string
}): Promise<string> {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID not configured')
  }

  // Create event title with "Pending:" prefix
  const title = `Pending: ${data.guestName} (${data.guestCount} guests)`

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: title,
        description: data.notes || `Family booking request for ${data.guestName}`,
        start: {
          date: data.checkIn,  // All-day event
        },
        end: {
          date: data.checkOut,  // All-day event (exclusive end date)
        },
        transparency: 'opaque',  // Shows as busy
      },
    })

    return response.data.id || ''
  } catch (error) {
    console.error('Error creating Google Calendar event:', error)
    throw error
  }
}

/**
 * Delete a booking from Google Calendar
 */
export async function deleteBooking(eventId: string): Promise<void> {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID not configured')
  }

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    })
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error)
    throw error
  }
}

/**
 * Get confirmed (non-pending) bookings only
 */
export async function getConfirmedBookings(from: string, to: string): Promise<FamilyCalendarEvent[]> {
  const allBookings = await getFamilyBookings(from, to)
  return allBookings.filter(b => !b.isPending)
}

/**
 * Get pending bookings only (for admin view)
 */
export async function getPendingBookings(from: string, to: string): Promise<FamilyCalendarEvent[]> {
  const allBookings = await getFamilyBookings(from, to)
  return allBookings.filter(b => b.isPending)
}

/**
 * Guest booking from Guesty (scraped and synced to Google Calendar)
 */
export interface GuestBooking {
  checkIn: string   // YYYY-MM-DD
  checkOut: string  // YYYY-MM-DD
  guestName: string
}

/**
 * Get guest bookings from Google Calendar (events with [GUEST] prefix)
 * These are synced from Guesty via the scraper on CASAO_PC
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 */
export async function getGuestBookings(from: string, to: string): Promise<GuestBooking[]> {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID not configured')
  }

  try {
    // Extend timeMin back 30 days to catch events that started before
    // the requested range but extend into it
    const extendedFrom = new Date(from)
    extendedFrom.setDate(extendedFrom.getDate() - 30)

    const response = await calendar.events.list({
      calendarId,
      timeMin: extendedFrom.toISOString(),
      timeMax: new Date(to).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    })

    const events = response.data.items || []

    // Filter for [GUEST] prefixed events and extract guest name
    return events
      .filter(event => event.summary?.startsWith('[GUEST]'))
      .map(event => {
        const guestName = event.summary!.replace('[GUEST] ', '').trim()
        return {
          checkIn: event.start?.date || event.start?.dateTime?.split('T')[0] || '',
          checkOut: event.end?.date || event.end?.dateTime?.split('T')[0] || '',
          guestName,
        }
      })
  } catch (error) {
    console.error('Error fetching guest bookings from Google Calendar:', error)
    throw error
  }
}

/**
 * Approve a pending booking by removing "Pending:" prefix
 */
export async function approveBooking(eventId: string): Promise<void> {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID not configured')
  }

  try {
    // Get current event
    const event = await calendar.events.get({
      calendarId,
      eventId,
    })

    const currentTitle = event.data.summary || ''
    // Remove "Pending:" prefix
    const newTitle = currentTitle.replace(/^pending:\s*/i, '').replace(/^pending\s+/i, '')

    // Update event
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        summary: newTitle,
      },
    })
  } catch (error) {
    console.error('Error approving booking:', error)
    throw error
  }
}
