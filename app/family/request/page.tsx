"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, Users, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function FamilyRequestPage() {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestCount, setGuestCount] = useState(2)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/family/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkIn,
          checkOut,
          guestName,
          guestEmail,
          guestCount,
          notes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Failed to submit request")
      }
    } catch (err) {
      console.error("Request error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return nights > 0 ? nights : 0
  }

  const nights = calculateNights()

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Request Sent!
            </h1>
            <p className="text-muted-foreground">
              Your booking request has been sent to JR for approval.
            </p>
          </div>

          <div className="bg-muted rounded-lg p-4 mb-6 text-left">
            <div className="text-sm font-semibold text-foreground mb-2">
              Your Request
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                <span className="font-medium">Dates:</span> {new Date(checkIn).toLocaleDateString()} → {new Date(checkOut).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Nights:</span> {nights}
              </div>
              <div>
                <span className="font-medium">Guests:</span> {guestCount}
              </div>
              {notes && (
                <div className="mt-2 pt-2 border-t">
                  <span className="font-medium">Notes:</span> "{notes}"
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => router.push("/family/availability")}
            >
              Back to Calendar
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSuccess(false)
                setCheckIn("")
                setCheckOut("")
                setGuestName("")
                setGuestEmail("")
                setGuestCount(2)
                setNotes("")
              }}
            >
              Request More Dates
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Request form
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/family/availability")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold text-emerald-800 mb-2">
              Request Dates
            </h1>
            <p className="text-muted-foreground">
              Fill out the form below to request your stay
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Check-in Date
                </Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="checkOut" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Check-out Date
                </Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {/* Show nights if dates selected */}
            {nights > 0 && (
              <div className="p-3 bg-muted rounded-lg text-center">
                <span className="text-sm font-medium">
                  {nights} {nights === 1 ? "night" : "nights"} selected
                </span>
              </div>
            )}

            {/* Guest Info */}
            <div>
              <Label htmlFor="guestName" className="mb-2">
                Your Name
              </Label>
              <Input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="guestEmail" className="mb-2">
                Email Address <span className="text-muted-foreground text-sm">(optional)</span>
              </Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            {/* Guest Count */}
            <div>
              <Label htmlFor="guestCount" className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                Number of Guests
              </Label>
              <select
                id="guestCount"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="mb-2">
                What are you celebrating? <span className="text-muted-foreground text-sm">(optional, 280 chars max)</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 280))}
                placeholder="Birthday celebration, family reunion, etc."
                rows={3}
                maxLength={280}
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {notes.length}/280
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !checkIn || !checkOut || !guestName}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending Request...
                </>
              ) : (
                "Send Request to JR"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Your request will be sent to JR for approval. You'll be notified once it's approved.
          </div>
        </Card>
      </div>
    </div>
  )
}
