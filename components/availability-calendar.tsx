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

  // Fetch availability for current month (cached server-side)
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      try {
        const from = new Date(year, month, 1).toISOString().split("T")[0]
        const to = new Date(year, month + 1, 0).toISOString().split("T")[0]

        // Fetch availability (will use server-side cache)
        const response = await fetch(`/api/calendar?from=${from}&to=${to}`)

        if (response.ok) {
          const availData = await response.json()
          console.log('📅 Availability Response (cached):', availData)
          
          const availMap = new Map<string, DayAvailability>()
          const days = Array.isArray(availData) ? availData : availData.days || []
          
          if (days && days.length > 0) {
            days.forEach((day: any) => {
              const dayData: DayAvailability = {
                date: day.date,
                status: day.status === 'available' ? 'available' : 'booked',
                price: undefined // No per-day pricing - only show when dates selected
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

    fetchAvailability()
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

  const handleBookNow = () => {
    if (!checkIn || !checkOut) return

    const guestyUrl = `https://booking.guesty.com/properties/688a8aae483ff0001243e891?checkIn=${checkIn.toISOString().split('T')[0]}&checkOut=${checkOut.toISOString().split('T')[0]}&adults=${guests}`
    window.location.href = guestyUrl
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
            !isAvailable && !isPast && "bg-destructive/10 text-destructive",
            isPast && "text-muted-foreground",
          )}
        >
          <span className={cn("font-medium", isAvailable && "text-foreground")}>{day}</span>
          {isAvailable && dayInfo?.price && (
            <span className="text-[10px] font-semibold text-foreground/70 mt-0.5">
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
                  <div className="h-4 w-4 rounded bg-background border-2" />
                  <span className="text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-destructive/10" />
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
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        ${Math.round((pricing.money?.hostPayout || 0) / nights)} × {nights} {nights === 1 ? 'night' : 'nights'}
                      </span>
                      <span className="font-medium">${pricing.money?.hostPayout?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {/* Show weekly discount if 7+ nights */}
                    {nights >= 7 && pricing.money?.discount && pricing.money.discount > 0 && (
                      <div className="flex items-center justify-between text-sm text-green-600">
                        <span>Weekly discount</span>
                        <span className="font-medium">-${pricing.money.discount.toFixed(2)}</span>
                      </div>
                    )}
                    
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
    </section>
  )
}
