"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Loader2, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarDay, FamilyBooking } from "@/lib/family-types"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function FamilyAvailabilityPage() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availability, setAvailability] = useState<Map<string, CalendarDay>>(new Map())
  const [upcomingBookings, setUpcomingBookings] = useState<FamilyBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<FamilyBooking | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Fetch availability for current month
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      try {
        const from = new Date(year, month, 1).toISOString().split("T")[0]
        const to = new Date(year, month + 1, 0).toISOString().split("T")[0]

        const response = await fetch(`/api/family/availability?from=${from}&to=${to}`)

        if (response.ok) {
          const data = await response.json()
          const availMap = new Map<string, CalendarDay>()

          if (data.days && data.days.length > 0) {
            data.days.forEach((day: CalendarDay) => {
              availMap.set(day.date, day)
            })
          }

          setAvailability(availMap)
        } else if (response.status === 401) {
          // Session expired - redirect to login
          router.push("/family")
        }
      } catch (error) {
        console.error("Error fetching availability:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [year, month, router])

  // Fetch upcoming family bookings for sidebar
  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const response = await fetch("/api/family/bookings")

        if (response.ok) {
          const data = await response.json()
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          // Filter for future bookings only
          const upcoming = data.bookings
            .filter((b: FamilyBooking) => new Date(b.checkIn) >= today)
            .sort((a: FamilyBooking, b: FamilyBooking) =>
              new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
            )
            .slice(0, 5) // Show next 5 bookings

          setUpcomingBookings(upcoming)
        }
      } catch (error) {
        console.error("Error fetching upcoming bookings:", error)
      }
    }

    fetchUpcoming()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/family/auth", { method: "DELETE" })
      router.push("/family")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const isDateInPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day)
    const dateStr = formatDate(date)
    const dayInfo = availability.get(dateStr)

    if ((dayInfo?.status === "family" || dayInfo?.status === "booked") && dayInfo.booking) {
      setSelectedBooking(dayInfo.booking)
    } else {
      setSelectedBooking(null)
    }

    setSelectedDate(date)
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
      const isPast = isDateInPast(date)

      let bgColor = "bg-muted"
      let textColor = "text-muted-foreground"
      let borderColor = "border-transparent"
      let content = null

      if (!isPast && dayInfo) {
        switch (dayInfo.status) {
          case "available":
            bgColor = "bg-green-100 dark:bg-green-950"
            borderColor = "border-green-500"
            textColor = "text-green-900 dark:text-green-100"
            break
          case "family":
            bgColor = "bg-blue-100 dark:bg-blue-950"
            borderColor = "border-blue-500"
            textColor = "text-blue-900 dark:text-blue-100"
            if (dayInfo.booking?.guestName) {
              content = (
                <span className="text-[8px] font-medium mt-0.5 leading-tight text-center px-0.5 truncate max-w-full">
                  {dayInfo.booking.guestName}
                </span>
              )
            }
            break
          case "owner":
            bgColor = "bg-amber-100 dark:bg-amber-950"
            textColor = "text-amber-800 dark:text-amber-200"
            break
          case "booked":
            bgColor = "bg-gray-200 dark:bg-gray-800"
            textColor = "text-gray-600 dark:text-gray-400"
            // Show guest name if available from Google Calendar
            if (dayInfo.booking?.guestName) {
              content = (
                <span className="text-[8px] font-medium mt-0.5 leading-tight text-center px-0.5 truncate max-w-full">
                  {dayInfo.booking.guestName}
                </span>
              )
            }
            break
        }
      }

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isPast || loading}
          className={cn(
            "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative border-2",
            bgColor,
            textColor,
            borderColor,
            "hover:opacity-80",
            "disabled:cursor-not-allowed disabled:opacity-40",
            (dayInfo?.status === "family" || (dayInfo?.status === "booked" && dayInfo.booking)) && "cursor-pointer hover:scale-105"
          )}
        >
          <span className="font-medium">{day}</span>
          {content}
        </button>
      )
    }

    return days
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-emerald-800">
              Casa Vistas
            </h1>
            <p className="text-sm text-muted-foreground">Family Portal</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                  disabled={loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold text-foreground">
                  {MONTHS[month]} {year}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                  disabled={loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground"
                  >
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
                  <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-950 border-2 border-green-500" />
                  <span className="text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-blue-100 dark:bg-blue-950 border-2 border-blue-500" />
                  <span className="text-muted-foreground">Family/Friend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-amber-100 dark:bg-amber-950" />
                  <span className="text-muted-foreground">Owner Block</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
                  <span className="text-muted-foreground">Guest Booking</span>
                </div>
              </div>

              {/* Request Dates Button */}
              <Button
                className="w-full mt-6"
                size="lg"
                onClick={() => router.push("/family/request")}
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                Request Dates
              </Button>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Upcoming Stays */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Upcoming Stays
                </h3>

                {upcomingBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming family stays
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => {
                      const checkIn = new Date(booking.checkIn)
                      const checkOut = new Date(booking.checkOut)
                      const nights = Math.ceil(
                        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
                      )

                      return (
                        <div
                          key={booking.id}
                          className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
                        >
                          <div className="font-semibold text-sm text-foreground mb-1">
                            {booking.guestName}
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {checkIn.toLocaleDateString()} → {checkOut.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {nights} {nights === 1 ? "night" : "nights"} • {booking.guestCount}{" "}
                            {booking.guestCount === 1 ? "guest" : "guests"}
                          </div>
                          {booking.notes && (
                            <div className="text-xs text-muted-foreground mt-2 italic">
                              "{booking.notes}"
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              {/* Selected Booking Details */}
              {selectedBooking && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Guest</div>
                      <div className="text-base font-semibold">{selectedBooking.guestName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Dates</div>
                      <div className="text-base">
                        {new Date(selectedBooking.checkIn).toLocaleDateString()} →{" "}
                        {new Date(selectedBooking.checkOut).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Guests</div>
                      <div className="text-base">{selectedBooking.guestCount}</div>
                    </div>
                    {selectedBooking.notes && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Notes</div>
                        <div className="text-base italic">"{selectedBooking.notes}"</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
