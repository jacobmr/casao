// Guesty API utilities for authentication and API calls

interface GuestyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface GuestyAvailabilityResponse {
  data: {
    date: string
    status: "available" | "booked" | "blocked"
    minNights?: number
  }[]
}

interface GuestyPricingResponse {
  data: {
    date: string
    price: number
    currency: string
  }[]
}

interface GuestyBookingRequest {
  listingId: string
  checkIn: string
  checkOut: string
  guest: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  address?: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
}

// Cache for access token
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get OAuth access token from Guesty
 */
export async function getGuestyToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const tokenUrl = process.env.GUESTY_OAUTH_TOKEN_URL!
  const clientId = process.env.GUESTY_CLIENT_ID!
  const clientSecret = process.env.GUESTY_CLIENT_SECRET!
  const scope = process.env.GUESTY_OAUTH_SCOPE || "booking_engine:api"

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: scope,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get Guesty token: ${response.statusText}`)
  }

  const data: GuestyTokenResponse = await response.json()

  // Cache token (expires in 1 hour, cache for 55 minutes to be safe)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }

  return data.access_token
}

/**
 * Fetch availability for a property
 */
export async function getAvailability(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<GuestyAvailabilityResponse> {
  const token = await getGuestyToken()
  const baseUrl = process.env.GUESTY_BASE_URL!

  const url = new URL(`${baseUrl}/listings/${propertyId}/availability`)
  url.searchParams.append("startDate", startDate)
  url.searchParams.append("endDate", endDate)

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch availability: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch pricing for a property
 */
export async function getPricing(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<GuestyPricingResponse> {
  const token = await getGuestyToken()
  const baseUrl = process.env.GUESTY_BASE_URL!

  const url = new URL(`${baseUrl}/listings/${propertyId}/pricing`)
  url.searchParams.append("startDate", startDate)
  url.searchParams.append("endDate", endDate)

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch pricing: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Create a booking
 */
export async function createBooking(bookingData: GuestyBookingRequest) {
  const token = await getGuestyToken()
  const baseUrl = process.env.GUESTY_BASE_URL!

  const response = await fetch(`${baseUrl}/bookings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookingData),
  })

  if (!response.ok) {
    throw new Error(`Failed to create booking: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get property details
 */
export async function getPropertyDetails(propertyId: string) {
  const token = await getGuestyToken()
  const baseUrl = process.env.GUESTY_BASE_URL!

  const response = await fetch(`${baseUrl}/listings/${propertyId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch property details: ${response.statusText}`)
  }

  return response.json()
}
