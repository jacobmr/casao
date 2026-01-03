"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar, Users, Shield, Heart, ArrowRight, Loader2, Check, Sun, Snowflake } from "lucide-react"
import Link from "next/link"
import { getSeasonType, getSeasonDisplay, getSeasonPricing } from "@/lib/seasonal"

interface DayInfo {
  date: string
  status: string
  price?: number
  season?: 'high' | 'off'
  seasonLabel?: string
}

export default function SeasonalPage() {
  const [availability, setAvailability] = useState<Map<string, DayInfo>>(new Map())
  const [selectedDates, setSelectedDates] = useState<{ checkIn: string | null; checkOut: string | null }>({
    checkIn: null,
    checkOut: null,
  })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    guests: "2",
    aboutYou: "",
    socialLink: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const formSectionRef = useRef<HTMLDivElement>(null)

  // Fetch availability
  useEffect(() => {
    const fetchAvailability = async () => {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const startDate = new Date(year, month, 1).toISOString().split("T")[0]
      const endDate = new Date(year, month + 2, 0).toISOString().split("T")[0]

      try {
        const response = await fetch(`/api/calendar?from=${startDate}&to=${endDate}`)
        if (response.ok) {
          const data = await response.json()
          const availMap = new Map<string, DayInfo>()
          data.forEach((day: DayInfo) => {
            availMap.set(day.date, day)
          })
          setAvailability(availMap)
        }
      } catch (err) {
        console.error("Failed to fetch availability:", err)
      }
    }
    fetchAvailability()
  }, [currentMonth])

  const formatDate = (date: Date) => date.toISOString().split("T")[0]

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

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date)
    if (!isDateAvailable(date) || isDateInPast(date)) return

    if (!selectedDates.checkIn || (selectedDates.checkIn && selectedDates.checkOut)) {
      // Starting fresh - selecting check-in
      setSelectedDates({ checkIn: dateStr, checkOut: null })
    } else if (dateStr > selectedDates.checkIn) {
      // Selecting check-out - scroll to form after both dates selected
      setSelectedDates({ ...selectedDates, checkOut: dateStr })
      // Delay scroll slightly to let the UI update
      setTimeout(() => {
        formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } else {
      // Clicked a date before check-in, reset
      setSelectedDates({ checkIn: dateStr, checkOut: null })
    }
  }

  const isDateSelected = (date: Date) => {
    const dateStr = formatDate(date)
    if (!selectedDates.checkIn) return false
    if (dateStr === selectedDates.checkIn) return true
    if (selectedDates.checkOut && dateStr === selectedDates.checkOut) return true
    if (selectedDates.checkOut && dateStr > selectedDates.checkIn && dateStr < selectedDates.checkOut) return true
    return false
  }

  const getDayStyle = (date: Date, isAvailable: boolean, isPast: boolean, isSelected: boolean) => {
    if (isSelected) {
      return "bg-primary text-white"
    }
    if (!isAvailable || isPast) {
      return "bg-neutral-100 text-neutral-400 cursor-not-allowed"
    }
    // Season-based styling
    const season = getSeasonType(date)
    if (season === 'high') {
      return "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"
    }
    return "bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100"
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    // Empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isAvailable = isDateAvailable(date)
      const isPast = isDateInPast(date)
      const isSelected = isDateSelected(date)
      const season = getSeasonType(date)

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          disabled={!isAvailable || isPast}
          title={isAvailable && !isPast ? getSeasonDisplay(date) : undefined}
          className={`h-12 rounded-lg text-sm font-medium transition-all relative ${getDayStyle(date, isAvailable, isPast, isSelected)}`}
        >
          {day}
          {isAvailable && !isPast && !isSelected && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px]">
              {season === 'high' ? '☀️' : '💙'}
            </span>
          )}
        </button>
      )
    }

    return days
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDates.checkIn || !selectedDates.checkOut) {
      setError("Please select your check-in and check-out dates")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/seasonal-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          checkIn: selectedDates.checkIn,
          checkOut: selectedDates.checkOut,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to submit. Please try again.")
      }
    } catch {
      setError("Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#faf8f5] pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-neutral-800 mb-4">
            Thank You!
          </h1>
          <p className="text-neutral-600 text-lg mb-4">
            We've received your inquiry for <strong>{selectedDates.checkIn}</strong> to <strong>{selectedDates.checkOut}</strong>.
          </p>
          <p className="text-neutral-500 mb-8">
            We'll review your request and get back to you within 24 hours with a personalized discount code
            if we think you'd be a great fit for Casa Vistas.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            ← Back to Casa Vistas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Paper texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-800 transition-colors mb-6 text-sm"
          >
            ← Back to Casa Vistas
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl text-neutral-800 mb-4">
            Seasonal <span className="italic">Savings</span>
          </h1>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            We offer special rates to guests who we trust will treat our home with care.
          </p>
        </div>

        {/* Trust explanation */}
        <div className="bg-white/60 border border-neutral-200 rounded-2xl p-6 md:p-8 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-neutral-800 mb-2">
                A Home, Not Just a Rental
              </h2>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Casa Vistas is our family's home in Costa Rica — not an investment property.
                We care deeply about it and everyone who stays there.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-neutral-600">
            <p>
              Like <a href="https://www.livekindred.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Kindred</a> home exchange,
              we believe the best guests are those who treat a home as if it were their own.
              We're not looking for the highest price — we're looking for people who will
              appreciate and respect what we've built.
            </p>
            <p>
              <strong className="text-neutral-800">Here's the deal:</strong> Tell us a bit about yourself
              and your party. If we feel confident you'll care for our home, we'll send you a
              personalized discount code — anywhere from 20% to 50% off depending on dates and fit.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-200 grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm text-neutral-700">Verified guests only</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-neutral-700">Families welcome</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm text-neutral-700">Flexible dates</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Calendar Section */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h3 className="font-serif text-xl text-neutral-800 mb-4">1. Select Your Dates</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Click to select check-in, then check-out.
            </p>

            {/* Season Legend */}
            <div className="flex flex-wrap gap-4 mb-6 p-3 bg-neutral-50 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <span className="text-[8px]">☀️</span>
                </div>
                <span className="text-neutral-600">High Season (50% off via code)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <span className="text-[8px]">💙</span>
                </div>
                <span className="text-neutral-600">Off-Season ($143/night direct)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-neutral-100"></div>
                <span className="text-neutral-600">Unavailable</span>
              </div>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                ←
              </button>
              <span className="font-medium text-neutral-800">
                {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                →
              </button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-xs text-neutral-500 font-medium">
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>

            {/* Selected dates display */}
            {selectedDates.checkIn && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg space-y-3">
                <p className="text-sm text-neutral-700">
                  <strong>Check-in:</strong> {selectedDates.checkIn}
                  {selectedDates.checkOut && (
                    <>
                      <span className="mx-2">→</span>
                      <strong>Check-out:</strong> {selectedDates.checkOut}
                      <span className="ml-2 text-primary">
                        ({Math.ceil((new Date(selectedDates.checkOut).getTime() - new Date(selectedDates.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights)
                      </span>
                    </>
                  )}
                </p>
                {selectedDates.checkOut && (() => {
                  const checkInSeason = getSeasonType(new Date(selectedDates.checkIn))
                  const checkOutSeason = getSeasonType(new Date(selectedDates.checkOut))
                  const isMixed = checkInSeason !== checkOutSeason
                  const pricing = getSeasonPricing(checkInSeason)

                  return (
                    <div className={`text-xs p-2 rounded ${
                      checkInSeason === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isMixed ? (
                        <span>⚠️ Your dates span both seasons. We'll discuss pricing options.</span>
                      ) : checkInSeason === 'high' ? (
                        <span>☀️ High Season — We'll send you a discount code (up to 50% off) after approval</span>
                      ) : (
                        <span>💙 Off-Season — Direct booking at $143/night friends rate</span>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Guest Info */}
          <div ref={formSectionRef} className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h3 className="font-serif text-xl text-neutral-800 mb-4">2. Tell Us About Yourself</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Help us get to know you. The more context you share, the better we can tailor your discount.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Number of Guests *</label>
                <select
                  required
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                LinkedIn, Facebook, or other profile (optional)
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.socialLink}
                onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Helps us understand who you are — increases your chances of a higher discount
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tell us about yourself and your party *
              </label>
              <textarea
                required
                rows={4}
                placeholder="What brings you to Costa Rica? Who's traveling with you? What kind of guests are you?"
                value={formData.aboutYou}
                onChange={(e) => setFormData({ ...formData, aboutYou: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
              <p className="text-xs text-neutral-500 mt-1">
                We love families, remote workers, anniversary trips, and anyone who appreciates a beautiful home
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedDates.checkIn || !selectedDates.checkOut}
            className="w-full bg-neutral-800 text-white py-4 rounded-xl font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Request Your Discount
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-neutral-500">
            We'll review your request and respond within 24 hours.
            Your information is never shared or sold.
          </p>
        </form>
      </div>
    </div>
  )
}
