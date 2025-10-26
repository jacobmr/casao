"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { BookingCalendar } from "@/components/booking-calendar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar as CalendarIcon, Loader2 } from "lucide-react"

function BookingPageContent() {
  const searchParams = useSearchParams()
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [guests, setGuests] = useState(2)
  const [pricing, setPricing] = useState<any>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)

  // Read URL params on mount
  useEffect(() => {
    const checkInParam = searchParams.get('checkIn')
    const checkOutParam = searchParams.get('checkOut')
    const guestsParam = searchParams.get('guests')

    if (checkInParam) setCheckIn(new Date(checkInParam))
    if (checkOutParam) setCheckOut(new Date(checkOutParam))
    if (guestsParam) setGuests(Number(guestsParam))
  }, [searchParams])

  // Fetch pricing when dates are selected
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setPricing(null)
      return
    }

    const fetchPricing = async () => {
      setLoadingPrice(true)
      try {
        const response = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: checkIn.toISOString().split('T')[0],
            checkOut: checkOut.toISOString().split('T')[0],
            guests
          })
        })

        if (response.ok) {
          const data = await response.json()
          setPricing(data)
        }
      } catch (error) {
        console.error('Error fetching pricing:', error)
      } finally {
        setLoadingPrice(false)
      }
    }

    fetchPricing()
  }, [checkIn, checkOut, guests])

  const handleDatesSelected = (newCheckIn: Date | null, newCheckOut: Date | null) => {
    setCheckIn(newCheckIn)
    setCheckOut(newCheckOut)
  }

  const handleBookNow = () => {
    if (!checkIn || !checkOut) return

    // Redirect to Guesty booking page
    const guestyUrl = `https://booking.guesty.com/properties/688a8aae483ff0001243e891?checkIn=${checkIn.toISOString().split('T')[0]}&checkOut=${checkOut.toISOString().split('T')[0]}&adults=${guests}`
    window.location.href = guestyUrl
  }

  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 text-balance">
            Book Your Stay at Casa Vistas
          </h1>
          <p className="text-lg text-muted-foreground text-balance">Select your dates to see pricing and availability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <BookingCalendar 
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              onDatesChange={handleDatesSelected}
            />
          </div>

          {/* Pricing Summary - Sticky */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Booking Summary</h2>

                {/* Guest Selector */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    Number of Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Dates */}
                {checkIn && checkOut ? (
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Check-in</span>
                      <span className="font-medium">{checkIn.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Check-out</span>
                      <span className="font-medium">{checkOut.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Nights</span>
                      <span className="font-medium">{nights}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground mb-6 p-4 bg-accent/30 rounded-lg">
                    <CalendarIcon className="h-5 w-5" />
                    <p className="text-sm">Select dates to see pricing</p>
                  </div>
                )}

                {/* Pricing Breakdown */}
                {loadingPrice ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : pricing ? (
                  <div className="space-y-3 mb-6 pb-6 border-b">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Accommodation</span>
                      <span className="font-medium">${pricing.money?.hostPayout?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Taxes & Fees</span>
                      <span className="font-medium">${(pricing.money?.totalTaxes || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-bold pt-3 border-t">
                      <span>Total</span>
                      <span className="text-primary">${pricing.money?.totalPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                ) : null}

                {/* Book Now Button */}
                <Button 
                  onClick={handleBookNow}
                  disabled={!checkIn || !checkOut || loadingPrice}
                  size="lg"
                  className="w-full"
                >
                  {loadingPrice ? 'Loading...' : 'Book Now with Guesty'}
                </Button>

                {checkIn && checkOut && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    You'll be redirected to Guesty's secure booking page
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  )
}
