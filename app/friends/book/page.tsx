'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Users, ArrowRight, Sun, Snowflake, X, Key, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DayInfo {
  date: string
  status: string
  season?: string
}

interface SeasonInfo {
  highSeasonDays: number
  offSeasonDays: number
  nights: number
}

export default function FriendsBookPage() {
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availability, setAvailability] = useState<Map<string, DayInfo>>(new Map())
  const [loading, setLoading] = useState(false)

  // Date selection
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [familyCode, setFamilyCode] = useState('')
  const [notes, setNotes] = useState('')

  // Flow state
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null)
  const [flow, setFlow] = useState<'high_season' | 'off_season' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Fetch availability for current month
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      try {
        const from = new Date(year, month, 1).toISOString().split('T')[0]
        const to = new Date(year, month + 1, 0).toISOString().split('T')[0]

        const response = await fetch(`/api/calendar?from=${from}&to=${to}`)

        if (response.ok) {
          const data = await response.json()
          const availMap = new Map<string, DayInfo>()
          const days = Array.isArray(data) ? data : data.days || []

          days.forEach((day: DayInfo) => {
            availMap.set(day.date, {
              date: day.date,
              status: day.status === 'available' ? 'available' : 'booked',
              season: day.season,
            })
          })

          setAvailability(availMap)
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [year, month])

  // Check season when dates are selected
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setSeasonInfo(null)
      setFlow(null)
      return
    }

    const checkSeason = async () => {
      try {
        const res = await fetch('/api/friends/redirect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: formatDate(checkIn),
            checkOut: formatDate(checkOut),
            guestCount,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          setSeasonInfo(data.seasonInfo)
          setFlow(data.flow)
        }
      } catch (err) {
        console.error('Error checking season:', err)
      }
    }

    checkSeason()
  }, [checkIn, checkOut, guestCount])

  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  const isDateAvailable = (date: Date) => {
    const dateStr = formatDate(date)
    const dayInfo = availability.get(dateStr)
    return dayInfo?.status === 'available'
  }

  const isDateInPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isDateSelected = (date: Date) => {
    if (!checkIn) return false
    if (!checkOut) return formatDate(date) === formatDate(checkIn)

    const dateStr = formatDate(date)
    return dateStr >= formatDate(checkIn) && dateStr <= formatDate(checkOut)
  }

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(year, month, day)

    if (isDateInPast(selectedDate) || !isDateAvailable(selectedDate)) return

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(selectedDate)
      setCheckOut(null)
    } else if (selectedDate > checkIn) {
      // Check for booked dates in range
      let hasBookedDate = false
      const current = new Date(checkIn)
      while (current <= selectedDate) {
        if (!isDateAvailable(current)) {
          hasBookedDate = true
          break
        }
        current.setDate(current.getDate() + 1)
      }

      if (hasBookedDate) {
        setCheckIn(selectedDate)
        setCheckOut(null)
      } else {
        const nights = Math.ceil((selectedDate.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        if (nights < 3) return // Enforce 3-night minimum
        setCheckOut(selectedDate)
      }
    } else {
      setCheckIn(selectedDate)
      setCheckOut(null)
    }
  }

  const nights = checkIn && checkOut
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const isFamilyRate = familyCode.toUpperCase() === 'GRIFFIN'
  const nightlyRate = isFamilyRate ? 71.43 : 143
  const cleaningFee = 300
  const lodgingTotal = nights * nightlyRate
  const grandTotal = lodgingTotal + cleaningFee
  const depositAmount = Math.ceil(grandTotal * 0.3)

  const handleContinue = () => {
    if (!checkIn || !checkOut || nights < 3) return
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (flow === 'high_season') {
        // Redirect to Guesty with discount
        const res = await fetch('/api/friends/redirect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: formatDate(checkIn!),
            checkOut: formatDate(checkOut!),
            guestCount,
            guestName,
            guestEmail,
          }),
        })

        const data = await res.json()
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
        }
      } else {
        // Off-season: Create Stripe checkout
        const res = await fetch('/api/friends/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: formatDate(checkIn!),
            checkOut: formatDate(checkOut!),
            guestCount,
            guestName,
            guestEmail,
            guestPhone,
            notes,
            familyCode: isFamilyRate ? 'GRIFFIN' : undefined,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to create booking')
          setSubmitting(false)
          return
        }

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
        }
      }
    } catch (err) {
      setError('Failed to process booking. Please try again.')
      setSubmitting(false)
    }
  }

  const renderCalendar = () => {
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    // Empty cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = formatDate(date)
      const dayInfo = availability.get(dateStr)
      const isAvailable = dayInfo?.status === 'available'
      const isPast = isDateInPast(date)
      const isSelected = isDateSelected(date)
      const isCheckInDate = checkIn && formatDate(date) === formatDate(checkIn)
      const isCheckOutDate = checkOut && formatDate(date) === formatDate(checkOut)
      const isHighSeason = dayInfo?.season === 'high'

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={!isAvailable || isPast || loading}
          className={cn(
            'aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative font-mono',
            'hover:ring-2 hover:ring-neutral-400',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:ring-0',
            isSelected && 'bg-neutral-200 text-neutral-800',
            (isCheckInDate || isCheckOutDate) && 'bg-neutral-800 text-white hover:bg-neutral-700',
            !isAvailable && !isPast && 'bg-red-100 text-red-400 line-through',
            isAvailable && !isSelected && 'border border-neutral-200 hover:border-neutral-400',
            isPast && 'text-neutral-300',
          )}
        >
          <span className="font-medium">{day}</span>
          {isAvailable && !isPast && (
            <span className={cn(
              'text-[9px] mt-0.5',
              isHighSeason ? 'text-amber-600' : 'text-blue-600'
            )}>
              {isHighSeason ? 'HIGH' : 'OFF'}
            </span>
          )}
        </button>
      )
    }

    return days
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Paper texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8 text-center">
          <p className="font-mono text-xs tracking-[0.4em] text-neutral-400 uppercase mb-2">
            Friends & Family
          </p>
          <h1 className="font-mono text-2xl md:text-3xl text-neutral-800 mb-2">
            Book Your Stay
          </h1>
          <p className="font-mono text-sm text-neutral-500">
            Select your dates to see availability
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-neutral-200 rounded-lg p-4 md:p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <ChevronLeft className="w-5 h-5 text-neutral-600" />
                </button>
                <h3 className="font-mono text-lg font-semibold text-neutral-800">
                  {MONTHS[month]} {year}
                </h3>
                <button
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <ChevronRight className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-xs font-mono text-neutral-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {loading ? (
                  <div className="col-span-7 text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-400 mx-auto mb-2" />
                    <p className="font-mono text-sm text-neutral-500">Loading availability...</p>
                  </div>
                ) : (
                  renderCalendar()
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-neutral-800" />
                  <span className="font-mono text-xs text-neutral-500">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-neutral-200" />
                  <span className="font-mono text-xs text-neutral-500">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100" />
                  <span className="font-mono text-xs text-neutral-500">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="font-mono text-xs text-neutral-500">High Season</span>
                </div>
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-blue-500" />
                  <span className="font-mono text-xs text-neutral-500">Off Season</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-200 rounded-lg p-4 md:p-6 lg:sticky lg:top-6">
              <h3 className="font-mono text-sm font-semibold text-neutral-800 mb-4">
                Booking Summary
              </h3>

              {/* Guest Selector */}
              <div className="mb-4">
                <label className="font-mono text-xs text-neutral-500 flex items-center gap-2 mb-1">
                  <Users className="w-3 h-3" />
                  Guests
                </label>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                    <option key={n} value={n}>
                      {n} guest{n !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Family Code */}
              <div className="mb-4">
                <label className="font-mono text-xs text-neutral-500 flex items-center gap-2 mb-1">
                  <Key className="w-3 h-3" />
                  Family Code (optional)
                </label>
                <input
                  type="text"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value)}
                  placeholder="Enter family code"
                  className="w-full px-3 py-2 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
                />
                {isFamilyRate && (
                  <p className="font-mono text-xs text-green-600 mt-1">
                    Family rate applied: $500/week
                  </p>
                )}
              </div>

              {/* Selected Dates */}
              {checkIn && checkOut ? (
                <div className="space-y-2 mb-4 pb-4 border-b border-neutral-100">
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-neutral-500">Check-in</span>
                    <span className="text-neutral-800">
                      {checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-neutral-500">Check-out</span>
                    <span className="text-neutral-800">
                      {checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-neutral-500">Nights</span>
                    <span className="text-neutral-800">{nights}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 rounded-lg mb-4">
                  <p className="font-mono text-xs text-neutral-500 text-center">
                    {checkIn ? 'Select checkout date (min 3 nights)' : 'Select check-in date'}
                  </p>
                </div>
              )}

              {/* Season indicator */}
              {flow && (
                <div className={cn(
                  'p-3 rounded-lg mb-4 border',
                  flow === 'high_season'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    {flow === 'high_season' ? (
                      <Sun className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Snowflake className="w-4 h-4 text-blue-600" />
                    )}
                    <span className={cn(
                      'font-mono text-xs font-semibold',
                      flow === 'high_season' ? 'text-amber-800' : 'text-blue-800'
                    )}>
                      {flow === 'high_season' ? 'High Season' : 'Off Season'}
                    </span>
                  </div>
                  <p className={cn(
                    'font-mono text-xs',
                    flow === 'high_season' ? 'text-amber-700' : 'text-blue-700'
                  )}>
                    {flow === 'high_season'
                      ? '30% friends discount via checkout'
                      : `Direct booking at $${nightlyRate.toFixed(2)}/night`}
                  </p>
                </div>
              )}

              {/* Pricing (off-season only) */}
              {flow === 'off_season' && nights >= 3 && (
                <div className="space-y-2 mb-4 pb-4 border-b border-neutral-100">
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-neutral-500">
                      {nights} × ${nightlyRate.toFixed(2)}
                    </span>
                    <span className="text-neutral-800">${lodgingTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-neutral-500">Cleaning fee</span>
                    <span className="text-neutral-800">${cleaningFee}</span>
                  </div>
                  <div className="flex justify-between font-mono text-sm font-semibold pt-2 border-t border-neutral-100">
                    <span className="text-neutral-800">Total</span>
                    <span className="text-neutral-800">${grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs text-neutral-500">
                    <span>Deposit (30%)</span>
                    <span>${depositAmount}</span>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                disabled={!checkIn || !checkOut || nights < 3}
                className="w-full bg-neutral-800 text-white px-4 py-3 rounded font-mono text-sm hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>

              {nights > 0 && nights < 3 && (
                <p className="font-mono text-xs text-amber-600 text-center mt-2">
                  Minimum stay is 3 nights
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guest Info Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-mono text-lg font-semibold text-neutral-800">
                  Your Information
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-mono text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Booking Summary */}
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                <div className="font-mono text-xs text-neutral-500 mb-2">Your Stay</div>
                <div className="font-mono text-sm text-neutral-800">
                  {checkIn?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                  {checkOut?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="font-mono text-xs text-neutral-500 mt-1">
                  {nights} nights • {guestCount} guest{guestCount !== 1 ? 's' : ''}
                  {flow === 'off_season' && ` • $${grandTotal.toFixed(2)}`}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-neutral-500 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-neutral-500 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-neutral-500 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                </div>

                {flow === 'off_season' && (
                  <div>
                    <label className="block font-mono text-xs text-neutral-500 mb-1">
                      Notes / Special Requests
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Any special requests..."
                      className="w-full px-3 py-2 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800 resize-none"
                    />
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 border border-neutral-200 rounded font-mono text-sm hover:bg-neutral-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!guestName || !guestEmail || submitting}
                    className="flex-1 bg-neutral-800 text-white px-4 py-3 rounded font-mono text-sm hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : flow === 'high_season' ? (
                      <>Continue to Checkout</>
                    ) : (
                      <>Pay Deposit (${depositAmount})</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
