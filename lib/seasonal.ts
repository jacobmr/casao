/**
 * Seasonal date logic for Casa Vistas
 * High Season: Dec 20 → Day after Easter Monday (Semana Santa)
 * Off-Season: Rest of year
 *
 * Uses Meeus/Jones/Butcher algorithm for accurate Easter calculation
 */

// Memoization caches for performance (Easter dates are constant per year)
const easterCache = new Map<number, Date>()
const semanaSantaCache = new Map<number, { start: Date; end: Date }>()

/**
 * Calculate Easter Sunday for a given year
 * Accurate for 1900-2099
 * Memoized for performance
 */
export function getEasterDate(year: number): Date {
  if (easterCache.has(year)) {
    return easterCache.get(year)!
  }
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  const result = new Date(year, month - 1, day)
  easterCache.set(year, result)
  return result
}

/**
 * Semana Santa holy week: Good Friday through Monday after Easter
 * For booking purposes, we use this as the season boundary
 * Memoized for performance
 */
export function getSemanaSanta(year: number): { start: Date; end: Date } {
  if (semanaSantaCache.has(year)) {
    return semanaSantaCache.get(year)!
  }

  const easter = getEasterDate(year)

  // Good Friday is 2 days before Easter
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)

  // Easter Monday is 1 day after Easter
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)

  const result = {
    start: goodFriday,
    end: easterMonday
  }
  semanaSantaCache.set(year, result)
  return result
}

/**
 * Determine if a given date falls in high season or off-season
 * High Season: Dec 20 → Day after Easter Monday
 * Off-Season: Everything else
 */
export function getSeasonType(date: Date): 'high' | 'off' {
  const month = date.getMonth() // 0=Jan, 11=Dec
  const day = date.getDate()
  const year = date.getFullYear()

  // Dec 20 - Dec 31: Always high season
  if (month === 11 && day >= 20) {
    return 'high'
  }

  // Jan 1 - part of April: Check against Easter
  if (month >= 0 && month <= 3) {
    const semana = getSemanaSanta(year)

    // Add 1 day to end to include day after Easter Monday
    const highSeasonEnd = new Date(semana.end)
    highSeasonEnd.setDate(highSeasonEnd.getDate() + 1)

    // If before Easter Monday's next day, it's high season
    if (date < highSeasonEnd) {
      return 'high'
    }
  }

  return 'off'
}

/**
 * Calculate how many days fall into each season for a date range
 */
export function getSeasonBreakdown(
  checkIn: Date,
  checkOut: Date
): {
  highSeasonDays: number
  offSeasonDays: number
  breakDate?: Date
  seasons: Array<{ date: string; season: 'high' | 'off' }>
} {
  const seasons: Array<{ date: string; season: 'high' | 'off' }> = []
  let highCount = 0
  let offCount = 0
  let breakDate: Date | undefined

  const current = new Date(checkIn)
  while (current < checkOut) {
    const season = getSeasonType(current)
    const dateStr = current.toISOString().split('T')[0]

    seasons.push({ date: dateStr, season })

    if (season === 'high') {
      highCount++
    } else {
      offCount++
      if (!breakDate) {
        breakDate = new Date(current)
      }
    }

    current.setDate(current.getDate() + 1)
  }

  return {
    highSeasonDays: highCount,
    offSeasonDays: offCount,
    breakDate,
    seasons
  }
}

/**
 * Check if a booking spans both high and off seasons
 */
export function spansMultipleSeasons(
  checkIn: Date,
  checkOut: Date
): boolean {
  const { highSeasonDays, offSeasonDays } = getSeasonBreakdown(checkIn, checkOut)
  return highSeasonDays > 0 && offSeasonDays > 0
}

/**
 * Get season boundaries for a given year
 */
export function getSeasonBoundaries(year: number) {
  const semana = getSemanaSanta(year)
  const dayAfterEasterMonday = new Date(semana.end)
  dayAfterEasterMonday.setDate(dayAfterEasterMonday.getDate() + 1)

  return {
    year,
    highSeasonStart: new Date(year - 1, 11, 20), // Dec 20 of previous year
    highSeasonEnd: dayAfterEasterMonday,         // Day after Easter Monday
    offSeasonStart: dayAfterEasterMonday,        // After Easter
    offSeasonEnd: new Date(year, 11, 19),        // Dec 19
    nextHighSeasonStart: new Date(year, 11, 20)  // Dec 20
  }
}

/**
 * Format season info for display
 */
export function getSeasonDisplay(date: Date): string {
  const season = getSeasonType(date)
  if (season === 'high') {
    return 'High Season (50% discount available)'
  }
  return 'Off-Season ($143/night friends rate)'
}

/**
 * Get the label for a season type
 */
export function getSeasonLabel(season: 'high' | 'off'): string {
  return season === 'high' ? 'High Season' : 'Off-Season'
}

/**
 * Get pricing info for a season
 */
export function getSeasonPricing(season: 'high' | 'off'): {
  description: string
  discountLabel: string
  nightlyRate?: number
} {
  if (season === 'high') {
    return {
      description: 'Book through Guesty with your discount code',
      discountLabel: 'Up to 50% off regular rates'
    }
  }
  return {
    description: 'Direct booking at friends rate',
    discountLabel: '$143/night (covers costs only)',
    nightlyRate: 143
  }
}
