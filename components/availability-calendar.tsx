"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Loader2, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePromo } from "@/components/promo-provider"
import { calculateDiscountedPrice } from "@/lib/promo-codes"

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
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [guests, setGuests] = useState(2)
  const [availability, setAvailability] = useState<Map<string, DayAvailability>>(new Map())
  const [loading, setLoading] = useState(false)
  const [pricing, setPricing] = useState<any>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const { promo } = usePromo()

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
                // Handle both array format [{date, price}] and object format {date: price}
                if (Array.isArray(pricingData.data)) {
                  pricingData.data.forEach((item: any) => {
                    pricingByDate.set(item.date, item.price)
                  })
                } else {
                  // Object format from Redis: {"2026-02-01": 922, ...}
                  Object.entries(pricingData.data).forEach(([date, price]) => {
                    pricingByDate.set(date, price as number)
                  })
                }
                console.log('💰 Loaded pricing for', pricingByDate.size, 'days')
              }
            }
          } catch (e) {
            console.log('💰 No cached pricing available', e)
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
            guests,
          }),
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

        // All dates still available - redirect directly to handoff (checkout)
        console.log('✅ Dates verified available - redirecting to checkout')
        // Redirect directly to handoff (skipping enhance page)
        let handoffUrl = `/api/handoff?checkIn=${checkInStr}&checkOut=${checkOutStr}&adults=${guests}`
        // Pass promo code if active
        if (promo) {
          handoffUrl += `&promo=${encodeURIComponent(promo.code)}`
        }
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
            !isAvailable && !isPast && "bg-pink-200 text-pink-900 dark:bg-pink-900/50 dark:text-pink-100 font-semibold",
            isAvailable && !isSelected && !isCheckInDate && !isCheckOutDate && "border-2 border-green-500 hover:border-green-600",
            isPast && "text-muted-foreground",
          )}
        >
          <span className={cn("font-medium", isAvailable && "text-foreground")}>{day}</span>
          {isAvailable && dayInfo?.price && (
            <div className="flex flex-col items-center leading-none">
              {promo && (
                <span className="text-[9px] text-red-500 line-through">
                  ${Math.round(dayInfo.price)}
                </span>
              )}
              <span className={cn(
                "text-[10px] font-medium",
                promo ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}>
                ${Math.round(calculateDiscountedPrice(dayInfo.price, promo))}
              </span>
            </div>
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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Select your dates to see real-time availability and pricing
          </p>
          
          {/* Trigger Button */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <CalendarIcon className="h-5 w-5" />
                Check Availability
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-serif">Select Your Dates</DialogTitle>
              </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="p-3 sm:p-6">
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
                  <div className="h-4 w-4 rounded bg-pink-200 dark:bg-pink-900/50" />
                  <span className="text-muted-foreground">Booked</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Summary - Sticky */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Card className="p-4 sm:p-6">
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

                      // Calculate discounted prices if promo is active
                      const discountedAccommodation = calculateDiscountedPrice(accommodation, promo)
                      const promoSavings = accommodation - discountedAccommodation
                      const discountedTaxes = calculateDiscountedPrice(taxes, promo)
                      const discountedTotal = calculateDiscountedPrice(total, promo)
                      const discountedAvgNightly = discountedAccommodation / nights

                      return (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              ${Math.round(promo ? discountedAvgNightly : avgNightly)} × {nights} {nights === 1 ? 'night' : 'nights'}
                            </span>
                            <span className="font-medium">
                              {promo && (
                                <span className="text-muted-foreground line-through mr-2">${accommodation.toFixed(2)}</span>
                              )}
                              ${(promo ? discountedAccommodation : accommodation).toFixed(2)}
                            </span>
                          </div>

                          {/* Show promo discount */}
                          {promo && promoSavings > 0 && (
                            <div className="flex items-center justify-between text-sm text-green-600">
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {promo.label}
                              </span>
                              <span className="font-medium">-${promoSavings.toFixed(2)}</span>
                            </div>
                          )}

                          {/* Show weekly discount if 7+ nights */}
                          {nights >= 7 && money?.discount && money.discount > 0 && (
                            <div className="flex items-center justify-between text-sm text-green-600">
                              <span>Weekly discount</span>
                              <span className="font-medium">-${money.discount.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Taxes & Fees</span>
                            <span className="font-medium">${(promo ? discountedTaxes : taxes).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-lg font-bold pt-3 border-t">
                            <span>Total</span>
                            <span className={promo ? "text-green-600" : "text-primary"}>
                              ${(promo ? discountedTotal : total).toFixed(2)}
                            </span>
                          </div>

                          {/* Promo code reminder */}
                          {promo && (
                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                              <p className="text-xs text-green-700 dark:text-green-300">
                                <span className="font-semibold">Enter code at checkout:</span>{" "}
                                <code className="bg-green-100 dark:bg-green-900 px-1.5 py-0.5 rounded font-mono">{promo.code}</code>
                              </p>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                ) : checkIn && checkOut && nights > 0 ? (
                  // Fallback: estimate from per-day prices when quote API fails
                  <div className="space-y-3 mb-6 pb-6 border-b">
                    {(() => {
                      // Calculate estimated total from daily prices
                      let estimatedTotal = 0
                      let daysWithPricing = 0
                      const current = new Date(checkIn)
                      while (current < checkOut) {
                        const dateStr = current.toISOString().split('T')[0]
                        const dayInfo = availability.get(dateStr)
                        if (dayInfo?.price) {
                          estimatedTotal += dayInfo.price
                          daysWithPricing++
                        }
                        current.setDate(current.getDate() + 1)
                      }

                      // Apply promo discount if active
                      const discountedTotal = calculateDiscountedPrice(estimatedTotal, promo)
                      const promoSavings = estimatedTotal - discountedTotal
                      const avgNightly = (promo ? discountedTotal : estimatedTotal) / nights

                      if (daysWithPricing === 0) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            Pricing unavailable for selected dates
                          </p>
                        )
                      }

                      // Check minimum nights (3 night minimum)
                      if (nights < 3) {
                        return (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                              3 night minimum required
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Please select at least 3 nights to book.
                            </p>
                          </div>
                        )
                      }

                      return (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              ~${Math.round(avgNightly)} × {nights} nights
                            </span>
                            <span className="font-medium">
                              {promo && (
                                <span className="text-muted-foreground line-through mr-2">${estimatedTotal.toLocaleString()}</span>
                              )}
                              ${(promo ? discountedTotal : estimatedTotal).toLocaleString()}
                            </span>
                          </div>

                          {/* Show promo discount */}
                          {promo && promoSavings > 0 && (
                            <div className="flex items-center justify-between text-sm text-green-600">
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {promo.label}
                              </span>
                              <span className="font-medium">-${promoSavings.toLocaleString()}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Taxes (est. 13%)</span>
                            <span className="font-medium">~${Math.round((promo ? discountedTotal : estimatedTotal) * 0.13).toLocaleString()}</span>
                          </div>

                          <div className="flex items-center justify-between text-lg font-bold pt-3 border-t">
                            <span>Est. Total</span>
                            <span className={promo ? "text-green-600" : "text-primary"}>
                              ~${Math.round((promo ? discountedTotal : estimatedTotal) * 1.13).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            Final price confirmed at checkout
                          </p>

                          {/* Promo code reminder */}
                          {promo && (
                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                              <p className="text-xs text-green-700 dark:text-green-300">
                                <span className="font-semibold">Enter code at checkout:</span>{" "}
                                <code className="bg-green-100 dark:bg-green-900 px-1.5 py-0.5 rounded font-mono">{promo.code}</code>
                              </p>
                            </div>
                          )}
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
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  )
}
