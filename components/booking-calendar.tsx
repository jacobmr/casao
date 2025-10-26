"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface BookingCalendarProps {
  initialCheckIn?: Date | null
  initialCheckOut?: Date | null
  onDatesChange?: (checkIn: Date | null, checkOut: Date | null) => void
}

export function BookingCalendar({ 
  initialCheckIn = null, 
  initialCheckOut = null,
  onDatesChange 
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn)
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut)
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Update local state when props change
  useEffect(() => {
    if (initialCheckIn) setCheckIn(initialCheckIn)
    if (initialCheckOut) setCheckOut(initialCheckOut)
  }, [initialCheckIn, initialCheckOut])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      try {
        const startDate = new Date(year, month, 1).toISOString().split("T")[0]
        const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0]

        const response = await fetch(`/api/availability?startDate=${startDate}&endDate=${endDate}`)

        if (response.ok) {
          const data = await response.json()
          const booked = new Set<string>()

          // Mark dates as booked if status is not 'available'
          data.data?.forEach((day: { date: string; status: string }) => {
            if (day.status !== "available") {
              booked.add(day.date)
            }
          })

          setBookedDates(booked)
        }
      } catch (error) {
        console.error("[v0] Error fetching availability:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [year, month])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const isDateBooked = (date: Date) => {
    return bookedDates.has(formatDate(date))
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

    if (isDateInPast(selectedDate) || isDateBooked(selectedDate)) return

    let newCheckIn: Date | null = checkIn
    let newCheckOut: Date | null = checkOut

    if (!checkIn || (checkIn && checkOut)) {
      newCheckIn = selectedDate
      newCheckOut = null
      setCheckIn(selectedDate)
      setCheckOut(null)
    } else if (selectedDate > checkIn) {
      // Check if any dates between checkIn and selectedDate are booked
      let hasBookedDate = false
      const current = new Date(checkIn)
      while (current <= selectedDate) {
        if (isDateBooked(current)) {
          hasBookedDate = true
          break
        }
        current.setDate(current.getDate() + 1)
      }

      if (hasBookedDate) {
        newCheckIn = selectedDate
        newCheckOut = null
        setCheckIn(selectedDate)
        setCheckOut(null)
      } else {
        newCheckOut = selectedDate
        setCheckOut(selectedDate)
      }
    } else {
      newCheckIn = selectedDate
      newCheckOut = null
      setCheckIn(selectedDate)
      setCheckOut(null)
    }

    // Notify parent component of date changes
    if (onDatesChange) {
      onDatesChange(newCheckIn, newCheckOut)
    }
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isBooked = isDateBooked(date)
      const isPast = isDateInPast(date)
      const isSelected = isDateSelected(date)
      const isCheckInDate = checkIn && formatDate(date) === formatDate(checkIn)
      const isCheckOutDate = checkOut && formatDate(date) === formatDate(checkOut)

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isBooked || isPast || loading}
          className={cn(
            "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all",
            "hover:bg-accent hover:text-accent-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
            isSelected && "bg-primary/20 text-primary",
            (isCheckInDate || isCheckOutDate) && "bg-primary text-primary-foreground hover:bg-primary/90",
            isBooked && "bg-destructive/10 text-destructive line-through",
            isPast && !isBooked && "text-muted-foreground",
          )}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Select Your Dates</h2>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth} disabled={loading}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <h3 className="text-lg font-semibold text-foreground">
          {MONTHS[month]} {year}
        </h3>
        <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={loading}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
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
          <div className="col-span-7 text-center py-8 text-muted-foreground">Loading availability...</div>
        ) : (
          renderCalendarDays()
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-primary" />
          <span className="text-sm text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-destructive/10 border border-destructive/20" />
          <span className="text-sm text-muted-foreground">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted" />
          <span className="text-sm text-muted-foreground">Available</span>
        </div>
      </div>

      {/* Selected Dates Display */}
      {checkIn && (
        <div className="mt-6 p-4 bg-accent/50 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Check-in</p>
              <p className="font-semibold text-foreground">{checkIn.toLocaleDateString()}</p>
            </div>
            {checkOut && (
              <>
                <div className="hidden md:block text-muted-foreground">→</div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Check-out</p>
                  <p className="font-semibold text-foreground">{checkOut.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nights</p>
                  <p className="font-semibold text-foreground">
                    {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
