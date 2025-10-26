"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface DayAvailability {
  date: string
  status: string
  price?: number
}

export function AvailabilityCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [guests, setGuests] = useState(2)
  const [availability, setAvailability] = useState<Map<string, DayAvailability>>(new Map())
  const [loading, setLoading] = useState(false)
  const [pricing, setPricing] = useState<any>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Fetch availability and pricing for current month (cached server-side)
  useEffect(() => {
    const fetchAvailabilityAndPricing = async () => {
      setLoading(true)
      try {
        const from = new Date(year, month, 1).toISOString().split("T")[0]
        const to = new Date(year, month + 1, 0).toISOString().split("T")[0]

        // Fetch availability (cached)
        const response = await fetch(`/api/calendar?from=${from}&to=${to}`)

        if (response.ok) {
          const availData = await response.json()
          console.log('📅 Availability Response (cached):', availData)
          
          // Load monthly pricing from cache
          const pricingByDate = new Map<string, number>()
          try {
            const pricingResponse = await fetch(`/api/pricing/monthly-cached?year=${year}&month=${month}`)
            if (pricingResponse.ok) {
              const pricingData = await pricingResponse.json()
              if (pricingData.success && pricingData.data) {
                pricingData.data.forEach((item: any) => {
                  pricingByDate.set(item.date, item.price)
                })
                console.log('💰 Loaded pricing for', pricingByDate.size, 'days')
              }
            }
          } catch (e) {
            console.log('💰 No cached pricing available')
          }
          
          const availMap = new Map<string, DayAvailability>()
          const days = Array.isArray(availData) ? availData : availData.days || []
          
          if (days && days.length > 0) {
            days.forEach((day: any) => {
              const dayData: DayAvailability = {
                date: day.date,
                status: day.status === 'available' ? 'available' : 'booked',
                price: pricingByDate.get(day.date) // Add per-day pricing from cache
              }
              availMap.set(dayData.date, dayData)
            })
          }

          console.log('📊 Total days loaded:', availMap.size)
          setAvailability(availMap)
        } else {
          console.error('API Error:', response.status, await response.text())
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailabilityAndPricing()
  }, [year, month])

  // Fetch pricing when dates are selected
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setPricing(null)
      return
    }

    const fetchPricing = async () => {
      setLoadingPrice(true)
      try {
        const checkInStr = checkIn.toISOString().split('T')[0]
        const checkOutStr = checkOut.toISOString().split('T')[0]
        
        console.log(`💰 Requesting quote: ${checkInStr} to ${checkOutStr}, ${guests} guests`)
        
        const response = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: checkInStr,
            checkOut: checkOutStr,
            guests
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('💵 Quote response:', data)
          console.log('💵 Money object:', data.rates?.ratePlans?.[0]?.money)
          console.log('💵 Accommodation:', data.rates?.ratePlans?.[0]?.money?.fareAccommodation)
          console.log('💵 Total:', data.rates?.ratePlans?.[0]?.money?.fareTotal)
          setPricing(data)
        } else {
          const errorText = await response.text()
          console.error('❌ Quote API error:', response.status, errorText)
        }
      } catch (error) {
        console.error('Error fetching pricing:', error)
      } finally {
        setLoadingPrice(false)
      }
    }

    fetchPricing()
  }, [checkIn, checkOut, guests])

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const isDateAvailable = (date: Date) => {
    const dateStr = formatDate(date)
    const dayInfo = availability.get(dateStr)
    return dayInfo?.status === "available"
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
    const checkInStr = formatDate(checkIn)
    const checkOutStr = formatDate(checkOut)

    return dateStr >= checkInStr && dateStr <= checkOutStr
  }

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(year, month, day)

    if (isDateInPast(selectedDate) || !isDateAvailable(selectedDate)) return

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(selectedDate)
      setCheckOut(null)
    } else if (selectedDate > checkIn) {
      // Check if any dates between checkIn and selectedDate are unavailable
      let hasUnavailableDate = false
      const current = new Date(checkIn)
      while (current <= selectedDate) {
        if (!isDateAvailable(current)) {
          hasUnavailableDate = true
          break
        }
        current.setDate(current.getDate() + 1)
      }

      if (hasUnavailableDate) {
        setCheckIn(selectedDate)
        setCheckOut(null)
      } else {
        setCheckOut(selectedDate)
      }
    } else {
      setCheckIn(selectedDate)
      setCheckOut(null)
    }
  }

  const handleBookNow = async () => {
    if (!checkIn || !checkOut) return

    // Show loading state
    setLoadingPrice(true)

    try {
      // CRITICAL: Verify availability in real-time before redirecting
      const checkInStr = checkIn.toISOString().split('T')[0]
      const checkOutStr = checkOut.toISOString().split('T')[0]
      
      console.log('🔍 Verifying real-time availability...')
      
      // Force fresh data by calling API directly (bypass cache)
      const verifyResponse = await fetch(
        `/api/calendar?from=${checkInStr}&to=${checkOutStr}&skipCache=true`
      )

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json()
        const days = Array.isArray(verifyData) ? verifyData : verifyData.days || []
        
        // Check if any selected dates became unavailable
        const current = new Date(checkIn)
        const unavailableDates = []
        
        while (current < checkOut) {
          const dateStr = current.toISOString().split('T')[0]
          const dayInfo = days.find((d: any) => d.date === dateStr)
          
          if (!dayInfo || dayInfo.status !== 'available') {
            unavailableDates.push(dateStr)
          }
          
          current.setDate(current.getDate() + 1)
        }

        if (unavailableDates.length > 0) {
          // Dates became unavailable!
          alert(
            `We're so sorry! These dates were just booked by another guest:\n\n${unavailableDates.join(', ')}\n\nPlease select different dates.`
          )
          
          // Clear selection and refresh calendar
          setCheckIn(null)
          setCheckOut(null)
          setPricing(null)
          
          // Force refresh availability
          window.location.reload()
          return
        }

        // All dates still available - redirect to branded handoff page
        console.log('✅ Dates verified available - redirecting to checkout')
        // Use Casa O branded handoff endpoint
        const handoffUrl = `/api/handoff?checkIn=${checkInStr}&checkOut=${checkOutStr}&adults=${guests}`
        console.log('🔗 Handoff URL:', handoffUrl)
        window.location.href = handoffUrl
        
      } else {
        throw new Error('Failed to verify availability')
      }
      
    } catch (error) {
      console.error('Error verifying availability:', error)
      alert('Unable to verify availability. Please try again or contact us directly.')
    } finally {
      setLoadingPrice(false)
    }
  }

  const renderCalendar = () => {
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = formatDate(date)
      const dayInfo = availability.get(dateStr)
      const isAvailable = dayInfo?.status === "available"
      const isPast = isDateInPast(date)
      const isSelected = isDateSelected(date)
      const isCheckInDate = checkIn && formatDate(date) === formatDate(checkIn)
      const isCheckOutDate = checkOut && formatDate(date) === formatDate(checkOut)

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={!isAvailable || isPast || loading}
          className={cn(
            "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative",
            "hover:bg-accent hover:text-accent-foreground",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
            isSelected && "bg-primary/20 text-primary",
            (isCheckInDate || isCheckOutDate) && "bg-primary text-primary-foreground hover:bg-primary/90 font-bold",
            !isAvailable && !isPast && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
            isAvailable && !isSelected && !isCheckInDate && !isCheckOutDate && "border-2 border-green-500 hover:border-green-600",
            isPast && "text-muted-foreground",
          )}
        >
          <span className={cn("font-medium", isAvailable && "text-foreground")}>{day}</span>
          {isAvailable && dayInfo?.price && (
            <span className="text-sm font-medium text-foreground mt-1">
              ${Math.round(dayInfo.price)}
            </span>
          )}
        </button>,
      )
    }

    return days
  }

  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <section className="py-12 md:py-16 bg-background" id="availability">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Check Availability & Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select your dates to see real-time availability and pricing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth} disabled={loading}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold text-foreground">
                  {MONTHS[month]} {year}
                </h3>
                <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={loading}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {loading ? (
                  <div className="col-span-7 text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading availability...</p>
                  </div>
                ) : (
                  renderCalendar()
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-primary" />
                  <span className="text-muted-foreground">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-background border-2 border-green-500" />
                  <span className="text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-red-100 dark:bg-red-900/30" />
                  <span className="text-muted-foreground">Booked</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Summary - Sticky */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Booking Summary</h3>

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
                    {(() => {
                      // Extract pricing from Guesty's nested structure
                      const money = pricing.rates?.ratePlans?.[0]?.ratePlan?.money || pricing.money
                      const accommodation = money?.fareAccommodation || 0
                      const taxes = money?.totalTaxes || 0
                      const total = money?.hostPayout || 0
                      const avgNightly = accommodation / nights
                      
                      return (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              ${Math.round(avgNightly)} × {nights} {nights === 1 ? 'night' : 'nights'}
                            </span>
                            <span className="font-medium">${accommodation.toFixed(2)}</span>
                          </div>
                          
                          {/* Show weekly discount if 7+ nights */}
                          {nights >= 7 && money?.discount && money.discount > 0 && (
                            <div className="flex items-center justify-between text-sm text-green-600">
                              <span>Weekly discount</span>
                              <span className="font-medium">-${money.discount.toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Taxes & Fees</span>
                            <span className="font-medium">${taxes.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-lg font-bold pt-3 border-t">
                            <span>Total</span>
                            <span className="text-primary">${total.toFixed(2)}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ) : null}

                {/* Book Now Button */}
                <Button 
                  onClick={handleBookNow}
                  disabled={!checkIn || !checkOut || loadingPrice}
                  size="lg"
                  className="w-full"
                >
                  {loadingPrice ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying availability...
                    </span>
                  ) : (
                    'Book This!'
                  )}
                </Button>

                {checkIn && checkOut && !loadingPrice && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    We'll verify availability before redirecting to Guesty's secure booking page
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
