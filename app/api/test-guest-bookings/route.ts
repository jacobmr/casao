import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || '2026-01-01'
  const to = searchParams.get('to') || '2026-01-31'

  const debug: Record<string, unknown> = {}

  try {
    // Debug env vars
    debug.hasPrivateKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    debug.privateKeyLength = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.length || 0
    debug.email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    debug.calendarId = process.env.GOOGLE_CALENDAR_ID?.substring(0, 20) + '...'

    // Try to create the client
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
    debug.privateKeyStartsWith = privateKey?.substring(0, 30)

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })

    debug.authCreated = true

    await auth.authorize()
    debug.authorized = true

    const calendar = google.calendar({ version: 'v3', auth })
    debug.calendarCreated = true

    const extendedFrom = new Date(from)
    extendedFrom.setDate(extendedFrom.getDate() - 30)

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: extendedFrom.toISOString(),
      timeMax: new Date(to).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    })

    debug.totalEvents = response.data.items?.length || 0
    const guestEvents = response.data.items?.filter(e => e.summary?.startsWith('[GUEST]')) || []
    debug.guestEvents = guestEvents.length
    debug.eventSummaries = response.data.items?.slice(0, 10).map(e => e.summary) || []

    const bookings = guestEvents.map(event => ({
      checkIn: event.start?.date || event.start?.dateTime?.split('T')[0] || '',
      checkOut: event.end?.date || event.end?.dateTime?.split('T')[0] || '',
      guestName: event.summary!.replace('[GUEST] ', '').trim(),
    }))

    return NextResponse.json({
      success: true,
      debug,
      count: bookings.length,
      bookings
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      debug,
      error: String(error)
    }, { status: 500 })
  }
}
