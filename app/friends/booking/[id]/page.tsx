'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, AlertCircle, Calendar, CreditCard, ArrowRight } from 'lucide-react'

interface Booking {
  id: string
  guestName: string
  checkIn: string
  checkOut: string
  nights: number
  guestCount: number
  nightlyRate: number
  cleaningFee: number
  totalPrice: number
  depositRequired: number
  balanceDue: number
  balanceDueDate: string
  status: string
  depositPaidAt?: string
  balancePaidAt?: string
}

export default function BookingStatusPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const bookingId = params.id as string
  const status = searchParams.get('status')

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payingBalance, setPayingBalance] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/friends/book?id=${bookingId}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to load booking')
          return
        }

        setBooking(data.booking)
      } catch (err) {
        setError('Failed to load booking')
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId])

  const handlePayBalance = async () => {
    if (!booking) return
    setPayingBalance(true)

    try {
      const res = await fetch('/api/friends/pay-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      const data = await res.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError(data.error || 'Failed to create payment session')
        setPayingBalance(false)
      }
    } catch (err) {
      setError('Failed to process payment')
      setPayingBalance(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusInfo = () => {
    if (!booking) return { icon: Clock, color: 'neutral', label: 'Loading...' }

    switch (booking.status) {
      case 'pending':
        return { icon: Clock, color: 'amber', label: 'Awaiting Deposit' }
      case 'deposit_paid':
        return { icon: CreditCard, color: 'blue', label: 'Deposit Paid - Balance Due' }
      case 'confirmed':
        return { icon: CheckCircle, color: 'green', label: 'Fully Paid - Confirmed!' }
      case 'cancelled':
        return { icon: AlertCircle, color: 'red', label: 'Cancelled' }
      default:
        return { icon: Clock, color: 'neutral', label: booking.status }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-800 mx-auto mb-4" />
          <p className="font-mono text-sm text-neutral-600">Loading booking...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="font-mono text-xl text-neutral-800 mb-2">Booking Not Found</h1>
          <p className="font-mono text-sm text-neutral-600 mb-6">
            {error || 'We couldn\'t find this booking. Please check the link and try again.'}
          </p>
          <Link
            href="/friends/book"
            className="inline-flex items-center gap-2 bg-neutral-800 text-white px-6 py-3 rounded font-mono text-sm hover:bg-neutral-700 transition-colors"
          >
            Create New Booking
          </Link>
        </div>
      </div>
    )
  }

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
        {/* Success message for just-completed payment */}
        {status === 'success' && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-mono text-sm font-semibold text-green-800">Payment Successful!</p>
                <p className="font-mono text-xs text-green-700">
                  Thank you for your payment. Your booking details are below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header with status */}
        <header className="mb-8">
          <p className="font-mono text-xs tracking-[0.4em] text-neutral-400 uppercase mb-4">
            Booking #{booking.id.slice(0, 8)}
          </p>
          <div className="flex items-center gap-3 mb-2">
            <StatusIcon
              className={`w-6 h-6 ${
                statusInfo.color === 'green'
                  ? 'text-green-600'
                  : statusInfo.color === 'blue'
                  ? 'text-blue-600'
                  : statusInfo.color === 'amber'
                  ? 'text-amber-600'
                  : statusInfo.color === 'red'
                  ? 'text-red-600'
                  : 'text-neutral-600'
              }`}
            />
            <h1 className="font-mono text-2xl text-neutral-800">{statusInfo.label}</h1>
          </div>
          <p className="font-mono text-sm text-neutral-500">{booking.guestName}</p>
        </header>

        {/* Booking details */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
          <h2 className="font-mono text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Stay Details
          </h2>

          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Check-in:</span>
              <span className="text-neutral-800">{formatDate(booking.checkIn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Check-out:</span>
              <span className="text-neutral-800">{formatDate(booking.checkOut)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Nights:</span>
              <span className="text-neutral-800">{booking.nights}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Guests:</span>
              <span className="text-neutral-800">{booking.guestCount}</span>
            </div>
          </div>
        </div>

        {/* Payment details */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
          <h2 className="font-mono text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment Details
          </h2>

          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">
                Lodging ({booking.nights} x ${booking.nightlyRate}):
              </span>
              <span className="text-neutral-800">${(booking.nights * booking.nightlyRate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Cleaning fee:</span>
              <span className="text-neutral-800">${booking.cleaningFee}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-100">
              <span className="text-neutral-800 font-semibold">Total:</span>
              <span className="text-neutral-800 font-semibold">${booking.totalPrice.toLocaleString()}</span>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Deposit (30%):</span>
                <span className={booking.depositPaidAt ? 'text-green-600' : 'text-neutral-800'}>
                  ${booking.depositRequired.toLocaleString()}
                  {booking.depositPaidAt && ' (Paid)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Balance:</span>
                <span className={booking.balancePaidAt ? 'text-green-600' : 'text-neutral-800'}>
                  ${booking.balanceDue.toLocaleString()}
                  {booking.balancePaidAt && ' (Paid)'}
                </span>
              </div>
              {!booking.balancePaidAt && booking.depositPaidAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Balance due by:</span>
                  <span className="text-neutral-500">{formatDate(booking.balanceDueDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {booking.status === 'deposit_paid' && !booking.balancePaidAt && (
          <button
            onClick={handlePayBalance}
            disabled={payingBalance}
            className="w-full bg-neutral-800 text-white px-6 py-3 rounded font-mono text-sm hover:bg-neutral-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {payingBalance ? (
              'Processing...'
            ) : (
              <>
                Pay Balance (${booking.balanceDue.toLocaleString()})
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        {booking.status === 'confirmed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-mono text-lg text-green-800 mb-2">You're All Set!</h3>
            <p className="font-mono text-sm text-green-700">
              Your booking is confirmed. We'll send arrival instructions closer to your check-in date.
            </p>
          </div>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/friends"
            className="font-mono text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            ← Back to Friends & Family
          </Link>
        </div>
      </div>
    </div>
  )
}
