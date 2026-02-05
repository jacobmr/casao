"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";

export default function FamilyBookingRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Calculate nights
  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
          guestCount: parseInt(guestCount),
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect back to availability page
        router.push("/family/availability?success=true");
      } else {
        setError(data.error || "Failed to submit booking request");
      }
    } catch (err) {
      console.error("Booking request error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!checkIn || !checkOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <h2 className="text-xl font-bold text-center mb-4">
            Invalid Request
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            Please select dates from the calendar first.
          </p>
          <Button
            onClick={() => router.push("/family/availability")}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="font-serif text-2xl font-bold text-emerald-800">
            Casa Vistas
          </h1>
          <p className="text-sm text-muted-foreground">
            Family Booking Request
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/family/availability")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Calendar
        </Button>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Request Booking</h2>

          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-600 rounded-lg">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              Selected Dates
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              {checkIn} → {checkOut} ({nights} nights)
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border-2 border-red-600 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="guestName">Your Name *</Label>
              <Input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                placeholder="Enter your name"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="guestEmail">Email (optional)</Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="guestCount">Number of Guests *</Label>
              <Input
                id="guestCount"
                type="number"
                min="1"
                max="12"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or notes..."
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/family/availability")}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Your booking request will be sent to the property owner for
            approval.
          </p>
        </Card>
      </div>
    </div>
  );
}
