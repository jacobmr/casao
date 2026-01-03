'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, User, Mail, Phone, Users, ArrowRight, Sun, Snowflake } from 'lucide-react'

interface SeasonInfo {
  highSeasonDays: number
  offSeasonDays: number
  nights: number
}

interface RedirectResponse {
  flow: 'high_season' | 'off_season'
  redirectUrl: string | null
  seasonInfo: SeasonInfo
  discountCode?: string
  message: string
}

interface BookingResponse {
  success: boolean
  booking: {
    id: string
    nights: number
    totalPrice: number
    depositRequired: number
  }
  checkoutUrl: string
}

export default function FriendsBookPage() {
  const router = useRouter()
  const [step, setStep] = useState<'dates' | 'info' | 'loading'>('dates')
  const [error, setError] = useState<string | null>(null)
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null)
  const [flow, setFlow] = useState<'high_season' | 'off_season' | null>(null)

  // Form state
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [notes, setNotes] = useState('')

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const handleDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const nights = calculateNights()
    if (nights < 3) {
      setError('Minimum stay is 3 nights')
      return
    }

    // Check which flow to use
    try {
      const res = await fetch('/api/friends/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkIn, checkOut, guestCount }),
      })

      const data: RedirectResponse = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to check availability')
        return
      }

      setSeasonInfo(data.seasonInfo)
      setFlow(data.flow)
      setStep('info')
    } catch (err) {
      setError('Failed to check availability. Please try again.')
    }
  }

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStep('loading')

    try {
      if (flow === 'high_season') {
        // Redirect to Guesty with discount code
        const res = await fetch('/api/friends/redirect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn,
            checkOut,
            guestCount,
            guestName,
            guestEmail,
          }),
        })

        const data: RedirectResponse = await res.json()
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
        }
      } else {
        // Off-season: Create Stripe checkout
        const res = await fetch('/api/friends/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn,
            checkOut,
            guestCount,
            guestName,
            guestEmail,
            guestPhone,
            notes,
          }),
        })

        const data: BookingResponse = await res.json()

        if (!res.ok) {
          setError((data as { error?: string }).error || 'Failed to create booking')
          setStep('info')
          return
        }

        // Redirect to Stripe checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
        }
      }
    } catch (err) {
      setError('Failed to process booking. Please try again.')
      setStep('info')
    }
  }

  const nights = calculateNights()
  const offSeasonTotal = nights * 143 + 300 // $143/night + $300 cleaning

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Paper texture background */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-lg mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-8">
          <p className="font-mono text-xs tracking-[0.4em] text-neutral-400 uppercase mb-4">
            Friends & Family
          </p>
          <h1 className="font-mono text-2xl md:text-3xl text-neutral-800 leading-tight mb-2">
            Book Your Stay
          </h1>
          <p className="font-mono text-sm text-neutral-500">
            Special rates for friends and family
          </p>
          <div className="w-16 h-px bg-neutral-300 mt-4" />
        </header>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-mono text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Date Selection */}
        {step === 'dates' && (
          <form onSubmit={handleDateSubmit} className="space-y-6">
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <h2 className="font-mono text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Select Your Dates
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-neutral-500 mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-neutral-500 mb-1">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block font-mono text-xs text-neutral-500 mb-1">
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

              {nights > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <p className="font-mono text-sm text-neutral-600">
                    {nights} night{nights !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!checkIn || !checkOut || nights < 3}
              className="w-full bg-neutral-800 text-white px-6 py-3 rounded font-mono text-sm hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>

            {nights > 0 && nights < 3 && (
              <p className="font-mono text-xs text-amber-600 text-center">
                Minimum stay is 3 nights
              </p>
            )}
          </form>
        )}

        {/* Step 2: Guest Info */}
        {step === 'info' && seasonInfo && (
          <form onSubmit={handleInfoSubmit} className="space-y-6">
            {/* Season indicator */}
            <div
              className={`p-4 rounded-lg border-2 ${
                flow === 'high_season'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {flow === 'high_season' ? (
                  <Sun className="w-5 h-5 text-amber-600" />
                ) : (
                  <Snowflake className="w-5 h-5 text-blue-600" />
                )}
                <span
                  className={`font-mono text-sm font-semibold ${
                    flow === 'high_season' ? 'text-amber-800' : 'text-blue-800'
                  }`}
                >
                  {flow === 'high_season' ? 'High Season' : 'Off Season'}
                </span>
              </div>
              <p
                className={`font-mono text-xs ${
                  flow === 'high_season' ? 'text-amber-700' : 'text-blue-700'
                }`}
              >
                {flow === 'high_season'
                  ? 'Your dates include high season. You\'ll receive a 30% friends discount on standard rates.'
                  : `Direct booking at $143/night + $300 cleaning fee. Total: $${offSeasonTotal.toLocaleString()}`}
              </p>
            </div>

            {/* Guest info form */}
            <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
              <h2 className="font-mono text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Information
              </h2>

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
                    placeholder="Any special requests or notes..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <div className="font-mono text-xs text-neutral-500 mb-2">Booking Summary</div>
              <div className="space-y-1 font-mono text-sm text-neutral-700">
                <div className="flex justify-between">
                  <span>Dates:</span>
                  <span>
                    {new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                    {new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Nights:</span>
                  <span>{seasonInfo.nights}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <span>{guestCount}</span>
                </div>
                {flow === 'off_season' && (
                  <>
                    <div className="pt-2 border-t border-neutral-200 mt-2">
                      <div className="flex justify-between">
                        <span>Lodging ({nights} x $143):</span>
                        <span>${(nights * 143).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cleaning fee:</span>
                        <span>$300</span>
                      </div>
                      <div className="flex justify-between font-semibold text-neutral-800 mt-1">
                        <span>Total:</span>
                        <span>${offSeasonTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-neutral-500 mt-1">
                        <span>Deposit (30%):</span>
                        <span>${Math.ceil(offSeasonTotal * 0.3).toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('dates')}
                className="px-6 py-3 border border-neutral-200 rounded font-mono text-sm hover:bg-neutral-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!guestName || !guestEmail}
                className="flex-1 bg-neutral-800 text-white px-6 py-3 rounded font-mono text-sm hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {flow === 'high_season' ? 'Continue to Checkout' : 'Pay Deposit'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Loading state */}
        {step === 'loading' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-800 mx-auto mb-4" />
            <p className="font-mono text-sm text-neutral-600">Processing your booking...</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-neutral-200">
          <p className="font-mono text-xs text-neutral-400 leading-relaxed text-center">
            Questions? Contact us directly - this booking portal is for friends and family only.
          </p>
        </footer>
      </div>
    </div>
  )
}
