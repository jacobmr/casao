"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarDay, FamilyBooking } from "@/lib/family-types"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface UpcomingStay {
  id: string
  guestName: string
  checkIn: string
  checkOut: string
  type: 'family' | 'guest'
  guestCount?: number
  notes?: string
}

export default function FamilyAvailabilityPage() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availability, setAvailability] = useState<Map<string, CalendarDay>>(new Map())
  const [upcomingStays, setUpcomingStays] = useState<UpcomingStay[]>([])
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

  // Fetch upcoming stays (both family and guest) for sidebar agenda
  useEffect(() => {
    const fetchUpcomingStays = async () => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const from = today.toISOString().split("T")[0]
        const sixMonthsLater = new Date(today)
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)
        const to = sixMonthsLater.toISOString().split("T")[0]

        const response = await fetch(`/api/family/availability?from=${from}&to=${to}`)

        if (response.ok) {
          const data = await response.json()
          const staysMap = new Map<string, UpcomingStay>()

          // Extract unique stays from calendar days
          data.days?.forEach((day: CalendarDay) => {
            if ((day.status === 'booked' || day.status === 'family') && day.booking?.guestName) {
              // Use check-in date as unique key for each stay
              const guestName = day.booking.guestName
              if (!staysMap.has(guestName + day.date)) {
                // Find the first occurrence (check-in) of this guest
                const existingStay = Array.from(staysMap.values()).find(
                  s => s.guestName === guestName && s.checkOut === day.date
                )
                if (existingStay) {
                  // Extend the checkout date
                  existingStay.checkOut = new Date(new Date(day.date).getTime() + 86400000).toISOString().split("T")[0]
                } else if (!Array.from(staysMap.values()).some(s => s.guestName === guestName && s.checkIn <= day.date && s.checkOut > day.date)) {
                  // New stay
                  staysMap.set(guestName + day.date, {
                    id: `${day.status}-${day.date}-${guestName}`,
                    guestName,
                    checkIn: day.date,
                    checkOut: new Date(new Date(day.date).getTime() + 86400000).toISOString().split("T")[0],
                    type: day.status === 'family' ? 'family' : 'guest',
                    guestCount: day.booking.guestCount
                  })
                }
              }
            }
          })

          // Convert to array and consolidate consecutive days for same guest
          const stays: UpcomingStay[] = []
          const guestDays = new Map<string, string[]>()

          data.days?.forEach((day: CalendarDay) => {
            if ((day.status === 'booked' || day.status === 'family') && day.booking?.guestName) {
              const key = `${day.booking.guestName}|${day.status}`
              if (!guestDays.has(key)) {
                guestDays.set(key, [])
              }
              guestDays.get(key)!.push(day.date)
            }
          })

          // Group consecutive dates into stays
          guestDays.forEach((dates, key) => {
            const [guestName, type] = key.split('|')
            dates.sort()

            let stayStart = dates[0]
            let prevDate = dates[0]

            for (let i = 1; i <= dates.length; i++) {
              const currDate = dates[i]
              const prevDateObj = new Date(prevDate)
              const nextDay = new Date(prevDateObj.getTime() + 86400000).toISOString().split("T")[0]

              if (currDate !== nextDay || i === dates.length) {
                // End of stay - checkout is day after last night
                stays.push({
                  id: `${type}-${stayStart}-${guestName}`,
                  guestName,
                  checkIn: stayStart,
                  checkOut: nextDay,
                  type: type as 'family' | 'guest'
                })
                if (currDate) {
                  stayStart = currDate
                }
              }
              prevDate = currDate || prevDate
            }
          })

          // Sort by check-in date
          stays.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
          setUpcomingStays(stays.slice(0, 10)) // Show next 10 stays
        }
      } catch (error) {
        console.error("Error fetching upcoming stays:", error)
      }
    }

    fetchUpcomingStays()
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
              {/* Upcoming Stays - Agenda View */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Upcoming Stays
                </h3>

                {upcomingStays.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming stays
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingStays.map((stay) => {
                      const checkIn = new Date(stay.checkIn)
                      const checkOut = new Date(stay.checkOut)
                      const nights = Math.ceil(
                        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
                      )

                      return (
                        <div
                          key={stay.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            stay.type === 'family'
                              ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                              : "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-sm text-foreground">
                              {stay.guestName}
                            </div>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-medium",
                              stay.type === 'family'
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            )}>
                              {stay.type === 'family' ? 'Family' : 'Guest'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {nights} {nights === 1 ? "night" : "nights"}
                          </div>
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
