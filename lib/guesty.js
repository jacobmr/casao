export function getGuestyConfig() {
  const key = process.env.GUESTY_API_KEY;
  const secret = process.env.GUESTY_API_SECRET;
  const propertyId = process.env.GUESTY_PROPERTY_ID;
  const bookingUrl = process.env.GUESTY_BOOKING_URL;
  return { key, secret, propertyId, bookingUrl };
}

export function hasGuestyCreds() {
  const { key, secret } = getGuestyConfig();
  return Boolean(key && secret);
}

// Placeholder for future calls
export async function fetchAvailability({ start, end }) {
  // In Vercel, implement Guesty API call here using fetch and the credentials.
  // For now, return a stub to keep the app ready to wire.
  return { ok: false, reason: 'Not implemented: set GUESTY_API_* and implement fetchAvailability()' };
}
