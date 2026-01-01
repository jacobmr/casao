"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, ArrowLeft, Clock, Users, ExternalLink } from "lucide-react"

interface PendingBooking {
  id: string
  title: string
  start: string
  end: string
  guestCount?: number
  notes?: string
}

export default function FamilyAdminPage() {
  const router = useRouter()
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingBookings()
  }, [])

  const fetchPendingBookings = async () => {
    try {
      const response = await fetch("/api/family/admin/pending")

      if (response.ok) {
        const data = await response.json()
        setPendingBookings(data.bookings || [])
      } else if (response.status === 401) {
        router.push("/family")
      }
    } catch (error) {
      console.error("Error fetching pending bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      const response = await fetch(`/api/family/admin/approve/${id}`, {
        method: "POST",
      })

      if (response.ok) {
        // Remove from pending list
        setPendingBookings((prev) => prev.filter((b) => b.id !== id))
      } else {
        const data = await response.json()
        alert(`Failed to approve: ${data.error}`)
      }
    } catch (error) {
      console.error("Error approving booking:", error)
      alert("Failed to approve booking")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this request? This will delete the event from Google Calendar.")) {
      return
    }

    setProcessingId(id)
    try {
      const response = await fetch(`/api/family/admin/reject/${id}`, {
        method: "POST",
      })

      if (response.ok) {
        // Remove from pending list
        setPendingBookings((prev) => prev.filter((b) => b.id !== id))
      } else {
        const data = await response.json()
        alert(`Failed to reject: ${data.error}`)
      }
    } catch (error) {
      console.error("Error rejecting booking:", error)
      alert("Failed to reject booking")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/family/availability")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            Open Google Calendar
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-emerald-800 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage pending family booking requests
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pendingBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">All Caught Up!</h2>
            <p className="text-muted-foreground">
              No pending booking requests at the moment
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingBookings.map((booking) => {
              const checkIn = new Date(booking.start)
              const checkOut = new Date(booking.end)
              const nights = Math.ceil(
                (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
              )
              const isProcessing = processingId === booking.id

              return (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Booking Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{booking.title}</h3>
                        <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="font-medium text-foreground">Dates:</span>{" "}
                          <span className="text-muted-foreground">
                            {checkIn.toLocaleDateString()} → {checkOut.toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Nights:</span>{" "}
                          <span className="text-muted-foreground">{nights}</span>
                        </div>
                        {booking.guestCount && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{booking.guestCount} guests</span>
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Notes
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{booking.notes}</div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex md:flex-col gap-2">
                      <Button
                        onClick={() => handleApprove(booking.id)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => handleReject(booking.id)}
                        disabled={isProcessing}
                        variant="outline"
                        className="flex-1 md:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Remember to block in Guesty!
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            After approving a request, don't forget to manually block the dates in the Guesty dashboard to prevent double bookings from paying guests.
          </p>
        </div>

        {/* Alternative: Google Calendar */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold mb-2">
            Prefer using Google Calendar directly?
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            You can also approve bookings by editing the event in Google Calendar - just remove the "Pending:" prefix from the event title.
          </p>
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Open Google Calendar
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
