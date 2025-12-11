"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, AlertCircle, PartyPopper, Calendar, Users, Tag, ArrowRight } from "lucide-react"

interface BookingData {
  firstName: string
  lastName: string
  email: string
  guests: string
  checkIn: string
  checkOut: string
  nights: number
  promoCode: string
  discountPercent: number
  used: boolean
}

export default function SeasonalBookPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [proceeding, setProceeding] = useState(false)

  useEffect(() => {
    const verifyCode = async () => {
      try {
        const response = await fetch(`/api/seasonal-verify?code=${code}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Invalid or expired code")
          return
        }

        if (data.used) {
          setError("This booking link has already been used")
          return
        }

        if (!data.promoCode) {
          setError("This booking hasn't been approved yet")
          return
        }

        setBookingData(data)
      } catch {
        setError("Failed to verify your booking code")
      } finally {
        setLoading(false)
      }
    }

    verifyCode()
  }, [code])

  const handleProceed = async () => {
    if (!bookingData) return

    setProceeding(true)

    // Mark the code as used
    try {
      await fetch(`/api/seasonal-use?code=${code}`, { method: "POST" })
    } catch {
      // Continue even if marking fails - the booking is more important
    }

    // Redirect to handoff with all the details
    const handoffUrl = `/api/handoff?checkIn=${bookingData.checkIn}&checkOut=${bookingData.checkOut}&adults=${bookingData.guests}&promo=${bookingData.promoCode}`
    router.push(handoffUrl)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-neutral-600">Verifying your booking...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="font-serif text-2xl text-neutral-800 mb-3">Unable to Continue</h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Link
            href="/seasonal"
            className="inline-flex items-center gap-2 bg-neutral-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-neutral-700 transition-colors"
          >
            Request a New Discount
          </Link>
        </div>
      </div>
    )
  }

  if (!bookingData) return null

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Confetti-style background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-4 h-4 bg-green-300 rounded-full opacity-60" />
        <div className="absolute top-20 right-20 w-3 h-3 bg-primary/40 rounded-full" />
        <div className="absolute top-40 left-1/4 w-2 h-2 bg-yellow-400 rounded-full opacity-70" />
        <div className="absolute bottom-40 right-1/3 w-3 h-3 bg-green-400/50 rounded-full" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-neutral-800 mb-3">
            Welcome, {bookingData.firstName}!
          </h1>
          <p className="text-neutral-600 text-lg">
            Your exclusive discount is ready. Here's a summary of your booking.
          </p>
        </div>

        {/* Discount Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-center text-white mb-8">
          <p className="text-green-100 text-sm uppercase tracking-wider mb-1">Your Exclusive Rate</p>
          <p className="text-5xl font-bold mb-1">{bookingData.discountPercent}% OFF</p>
          <p className="text-green-100 text-sm">
            Use code <span className="font-mono bg-white/20 px-2 py-0.5 rounded">{bookingData.promoCode}</span> at checkout
          </p>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-8">
          <h2 className="font-serif text-xl text-neutral-800 mb-4">Booking Details</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Dates</p>
                <p className="text-neutral-800 font-medium">
                  {bookingData.checkIn} → {bookingData.checkOut}
                  <span className="text-primary ml-2">({bookingData.nights} nights)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Guests</p>
                <p className="text-neutral-800 font-medium">{bookingData.guests} {parseInt(bookingData.guests) === 1 ? "guest" : "guests"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Discount Code</p>
                <p className="text-green-600 font-bold font-mono">{bookingData.promoCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <p className="text-amber-800 text-sm">
            <strong>Important:</strong> This link can only be used once. After clicking below,
            you'll be taken to our booking partner to complete payment. Make sure to enter your
            promo code <span className="font-mono bg-amber-100 px-1 rounded">{bookingData.promoCode}</span> at checkout.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleProceed}
          disabled={proceeding}
          className="w-full bg-neutral-800 text-white py-4 rounded-xl font-medium hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {proceeding ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Preparing Checkout...
            </>
          ) : (
            <>
              Continue to Checkout
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-neutral-500 mt-4">
          You'll be redirected to Blue Zone Experience for secure payment processing
        </p>
      </div>
    </div>
  )
}
