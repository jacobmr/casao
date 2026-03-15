"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarDay, FamilyBooking } from "@/lib/family-types";

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
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface UpcomingStay {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  type: "family" | "guest" | "kindred";
  guestCount?: number;
  notes?: string;
}

export default function FamilyAvailabilityPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Map<string, CalendarDay>>(
    new Map(),
  );
  const [upcomingStays, setUpcomingStays] = useState<UpcomingStay[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<FamilyBooking | null>(
    null,
  );
  const [bookingCheckIn, setBookingCheckIn] = useState<Date | null>(null);
  const [bookingCheckOut, setBookingCheckOut] = useState<Date | null>(null);
  const [scraperPending, setScraperPending] = useState(false);
  const [scraperLastRun, setScraperLastRun] = useState<string | null>(null);
  const [scraperResult, setScraperResult] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Fetch availability for current month
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const from = new Date(year, month, 1).toISOString().split("T")[0];
        const to = new Date(year, month + 1, 0).toISOString().split("T")[0];

        const response = await fetch(
          `/api/family/availability?from=${from}&to=${to}`,
        );

        if (response.ok) {
          const data = await response.json();
          const availMap = new Map<string, CalendarDay>();

          if (data.days && data.days.length > 0) {
            data.days.forEach((day: CalendarDay) => {
              availMap.set(day.date, day);
            });
          }

          setAvailability(availMap);
        } else if (response.status === 401) {
          // Session expired - redirect to login
          router.push("/family");
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [year, month, router]);

  // Fetch upcoming stays (both family and guest) for sidebar agenda
  useEffect(() => {
    const fetchUpcomingStays = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const from = today.toISOString().split("T")[0];
        const sixMonthsLater = new Date(today);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        const to = sixMonthsLater.toISOString().split("T")[0];

        const response = await fetch(
          `/api/family/availability?from=${from}&to=${to}`,
        );

        if (response.ok) {
          const data = await response.json();
          const staysMap = new Map<string, UpcomingStay>();

          // Extract unique stays from calendar days
          data.days?.forEach((day: CalendarDay) => {
            if (
              (day.status === "booked" ||
                day.status === "family" ||
                day.status === "kindred") &&
              day.booking?.guestName
            ) {
              // Use check-in date as unique key for each stay
              const guestName = day.booking.guestName;
              if (!staysMap.has(guestName + day.date)) {
                // Find the first occurrence (check-in) of this guest
                const existingStay = Array.from(staysMap.values()).find(
                  (s) => s.guestName === guestName && s.checkOut === day.date,
                );
                if (existingStay) {
                  // Extend the checkout date
                  existingStay.checkOut = new Date(
                    new Date(day.date).getTime() + 86400000,
                  )
                    .toISOString()
                    .split("T")[0];
                } else if (
                  !Array.from(staysMap.values()).some(
                    (s) =>
                      s.guestName === guestName &&
                      s.checkIn <= day.date &&
                      s.checkOut > day.date,
                  )
                ) {
                  // New stay
                  const stayType =
                    day.status === "family"
                      ? "family"
                      : day.status === "kindred"
                        ? "kindred"
                        : "guest";
                  staysMap.set(guestName + day.date, {
                    id: `${day.status}-${day.date}-${guestName}`,
                    guestName,
                    checkIn: day.date,
                    checkOut: new Date(new Date(day.date).getTime() + 86400000)
                      .toISOString()
                      .split("T")[0],
                    type: stayType,
                    guestCount: day.booking.guestCount,
                  });
                }
              }
            }
          });

          // Convert to array and consolidate consecutive days for same guest
          const stays: UpcomingStay[] = [];
          const guestDays = new Map<string, string[]>();

          data.days?.forEach((day: CalendarDay) => {
            if (
              (day.status === "booked" ||
                day.status === "family" ||
                day.status === "kindred") &&
              day.booking?.guestName
            ) {
              const key = `${day.booking.guestName}|${day.status}`;
              if (!guestDays.has(key)) {
                guestDays.set(key, []);
              }
              guestDays.get(key)!.push(day.date);
            }
          });

          // Group consecutive dates into stays
          guestDays.forEach((dates, key) => {
            const [guestName, type] = key.split("|");
            dates.sort();

            let stayStart = dates[0];
            let prevDate = dates[0];

            for (let i = 1; i <= dates.length; i++) {
              const currDate = dates[i];
              const prevDateObj = new Date(prevDate);
              const nextDay = new Date(prevDateObj.getTime() + 86400000)
                .toISOString()
                .split("T")[0];

              if (currDate !== nextDay || i === dates.length) {
                // End of stay - checkout is day after last night
                stays.push({
                  id: `${type}-${stayStart}-${guestName}`,
                  guestName,
                  checkIn: stayStart,
                  checkOut: nextDay,
                  type: type as "family" | "guest" | "kindred",
                });
                if (currDate) {
                  stayStart = currDate;
                }
              }
              prevDate = currDate || prevDate;
            }
          });

          // Sort by check-in date
          stays.sort(
            (a, b) =>
              new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
          );
          setUpcomingStays(stays.slice(0, 10)); // Show next 10 stays
        }
      } catch (error) {
        console.error("Error fetching upcoming stays:", error);
      }
    };

    fetchUpcomingStays();
  }, []);

  // Fetch scraper status on load + poll while pending
  useEffect(() => {
    const fetchScraperStatus = async () => {
      try {
        const res = await fetch("/api/family/admin/scraper");
        if (res.ok) {
          const data = await res.json();
          setScraperPending(data.pending);
          setScraperLastRun(data.lastRun);
          setScraperResult(data.result);
        }
      } catch {
        // Silently ignore — non-critical
      }
    };

    fetchScraperStatus();

    // Poll every 15s while pending
    if (scraperPending) {
      const interval = setInterval(fetchScraperStatus, 15000);
      return () => clearInterval(interval);
    }
  }, [scraperPending]);

  const handleRefreshBookings = async () => {
    try {
      setScraperPending(true);
      const res = await fetch("/api/family/admin/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger" }),
      });
      if (!res.ok) {
        setScraperPending(false);
        alert("Failed to trigger refresh");
      }
    } catch {
      setScraperPending(false);
      alert("Failed to trigger refresh");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/family/auth", { method: "DELETE" });
      router.push("/family");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = formatDate(date);
    const dayInfo = availability.get(dateStr);

    // If clicking an occupied day, show booking details
    if (
      (dayInfo?.status === "family" ||
        dayInfo?.status === "kindred" ||
        dayInfo?.status === "booked") &&
      dayInfo.booking
    ) {
      setSelectedBooking(dayInfo.booking);
      setSelectedDate(date);
      // Clear booking selection mode
      setBookingCheckIn(null);
      setBookingCheckOut(null);
      return;
    }

    // If clicking an available day, start booking flow
    if (dayInfo?.status === "available" && !isDateInPast(date)) {
      // First click sets check-in
      if (!bookingCheckIn) {
        setBookingCheckIn(date);
        setBookingCheckOut(null);
        setSelectedBooking(null);
        setSelectedDate(date);
      }
      // Second click sets check-out (must be after check-in)
      else if (!bookingCheckOut && date > bookingCheckIn) {
        // Verify all days in range are available
        const checkInStr = formatDate(bookingCheckIn);
        const checkOutStr = formatDate(date);
        const rangeIsAvailable = isRangeAvailable(checkInStr, checkOutStr);

        if (rangeIsAvailable) {
          setBookingCheckOut(date);
          setSelectedDate(date);
        } else {
          // Range has unavailable days - reset and show error
          alert(
            "Some dates in this range are not available. Please select a different range.",
          );
          setBookingCheckIn(null);
          setBookingCheckOut(null);
        }
      }
      // Third click resets selection
      else {
        setBookingCheckIn(null);
        setBookingCheckOut(null);
        setSelectedDate(null);
      }
    } else {
      setSelectedDate(date);
      setSelectedBooking(null);
    }
  };

  const isRangeAvailable = (checkIn: string, checkOut: string): boolean => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const current = new Date(start);

    while (current < end) {
      const dateStr = formatDate(current);
      const dayInfo = availability.get(dateStr);
      if (dayInfo?.status !== "available") {
        return false;
      }
      current.setDate(current.getDate() + 1);
    }
    return true;
  };

  const renderCalendar = () => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const dayInfo = availability.get(dateStr);
      const isPast = isDateInPast(date);

      // Check if this date is in the selected booking range
      const isInSelectedRange =
        bookingCheckIn &&
        bookingCheckOut &&
        date >= bookingCheckIn &&
        date < bookingCheckOut;
      const isSelectedCheckIn =
        bookingCheckIn && formatDate(bookingCheckIn) === dateStr;
      const isSelectedCheckOut =
        bookingCheckOut && formatDate(bookingCheckOut) === dateStr;

      let bgColor = "bg-muted";
      let textColor = "text-muted-foreground";
      let borderColor = "border-transparent";
      let content = null;
      let partialDayStyle = "";

      if (!isPast && dayInfo) {
        // Check for partial day (check-in or check-out)
        const isCheckIn = dayInfo.isCheckIn;
        const isCheckOut = dayInfo.isCheckOut;

        switch (dayInfo.status) {
          case "available":
            // Highlight selected booking range
            if (isInSelectedRange || isSelectedCheckIn || isSelectedCheckOut) {
              bgColor = "bg-emerald-200 dark:bg-emerald-900";
              borderColor = "border-emerald-600";
              textColor = "text-emerald-950 dark:text-emerald-50";
              if (isSelectedCheckIn) {
                content = (
                  <span className="text-[8px] font-bold mt-0.5">CHECK-IN</span>
                );
              } else if (isSelectedCheckOut) {
                content = (
                  <span className="text-[8px] font-bold mt-0.5">CHECK-OUT</span>
                );
              }
            } else {
              bgColor = "bg-green-100 dark:bg-green-950";
              borderColor = "border-green-500";
              textColor = "text-green-900 dark:text-green-100";
            }
            break;
          case "family":
            textColor = "text-blue-900 dark:text-blue-100";
            borderColor = "border-blue-500";
            if (isCheckIn) {
              // Check-in day: left half available, right half booked
              partialDayStyle =
                "bg-gradient-to-r from-green-100 via-green-100 to-blue-100 dark:from-green-950 dark:via-green-950 dark:to-blue-950";
            } else if (isCheckOut) {
              // Check-out day: left half booked, right half available
              partialDayStyle =
                "bg-gradient-to-r from-blue-100 via-blue-100 to-green-100 dark:from-blue-950 dark:via-blue-950 dark:to-green-950";
            } else {
              bgColor = "bg-blue-100 dark:bg-blue-950";
            }
            if (dayInfo.booking?.guestName) {
              content = (
                <span className="text-[8px] font-medium mt-0.5 leading-tight text-center px-0.5 truncate max-w-full">
                  {isCheckIn ? "→" : isCheckOut ? "←" : ""}
                  {dayInfo.booking.guestName}
                </span>
              );
            }
            break;
          case "owner":
            bgColor = "bg-amber-100 dark:bg-amber-950";
            textColor = "text-amber-800 dark:text-amber-200";
            break;
          case "kindred":
            textColor = "text-purple-900 dark:text-purple-100";
            borderColor = "border-purple-500";
            if (isCheckIn) {
              partialDayStyle =
                "bg-gradient-to-r from-green-100 via-green-100 to-purple-100 dark:from-green-950 dark:via-green-950 dark:to-purple-950";
            } else if (isCheckOut) {
              partialDayStyle =
                "bg-gradient-to-r from-purple-100 via-purple-100 to-green-100 dark:from-purple-950 dark:via-purple-950 dark:to-green-950";
            } else {
              bgColor = "bg-purple-100 dark:bg-purple-950";
            }
            if (dayInfo.booking?.guestName) {
              content = (
                <span className="text-[8px] font-medium mt-0.5 leading-tight text-center px-0.5 truncate max-w-full">
                  {isCheckIn ? "→" : isCheckOut ? "←" : ""}
                  {dayInfo.booking.guestName}
                </span>
              );
            }
            break;
          case "booked":
            textColor = "text-gray-600 dark:text-gray-400";
            if (isCheckIn) {
              // Check-in day: left half available, right half booked
              partialDayStyle =
                "bg-gradient-to-r from-green-100 via-green-100 to-gray-200 dark:from-green-950 dark:via-green-950 dark:to-gray-800";
              borderColor = "border-green-500";
            } else if (isCheckOut) {
              // Check-out day: left half booked, right half available
              partialDayStyle =
                "bg-gradient-to-r from-gray-200 via-gray-200 to-green-100 dark:from-gray-800 dark:via-gray-800 dark:to-green-950";
              borderColor = "border-green-500";
            } else {
              bgColor = "bg-gray-200 dark:bg-gray-800";
            }
            // Show guest name if available from Google Calendar
            if (dayInfo.booking?.guestName) {
              content = (
                <span className="text-[8px] font-medium mt-0.5 leading-tight text-center px-0.5 truncate max-w-full">
                  {isCheckIn ? "→" : isCheckOut ? "←" : ""}
                  {dayInfo.booking.guestName}
                </span>
              );
            }
            break;
        }
      }

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isPast || loading}
          className={cn(
            "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative border-2",
            partialDayStyle || bgColor,
            textColor,
            borderColor,
            "hover:opacity-80",
            "disabled:cursor-not-allowed disabled:opacity-40",
            (dayInfo?.status === "family" ||
              dayInfo?.status === "kindred" ||
              (dayInfo?.status === "booked" && dayInfo.booking)) &&
              "cursor-pointer hover:scale-105",
          )}
        >
          <span className="font-medium">{day}</span>
          {content}
        </button>,
      );
    }

    return days;
  };

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
                    <p className="text-muted-foreground">
                      Loading availability...
                    </p>
                  </div>
                ) : (
                  renderCalendar()
                )}
              </div>

              {/* Booking Request Button */}
              {bookingCheckIn && bookingCheckOut && (
                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-600 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                        Selected Dates
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        {formatDate(bookingCheckIn)} →{" "}
                        {formatDate(bookingCheckOut)} (
                        {Math.ceil(
                          (bookingCheckOut.getTime() -
                            bookingCheckIn.getTime()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        nights)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBookingCheckIn(null);
                          setBookingCheckOut(null);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          // Navigate to booking page with dates
                          router.push(
                            `/family/request?checkIn=${formatDate(bookingCheckIn)}&checkOut=${formatDate(bookingCheckOut)}`,
                          );
                        }}
                      >
                        Request Booking
                      </Button>
                    </div>
                  </div>
                </div>
              )}

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
                  <div className="h-4 w-4 rounded bg-purple-100 dark:bg-purple-950 border-2 border-purple-500" />
                  <span className="text-muted-foreground">
                    Kindred (Casita)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-amber-100 dark:bg-amber-950" />
                  <span className="text-muted-foreground">Owner Block</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
                  <span className="text-muted-foreground">Guest Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-gradient-to-r from-green-100 to-gray-200 dark:from-green-950 dark:to-gray-800" />
                  <span className="text-muted-foreground">
                    → Check-in / ← Check-out
                  </span>
                </div>
              </div>

              {/* Refresh Bookings */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  {scraperPending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Refreshing bookings...
                    </span>
                  ) : scraperLastRun ? (
                    <>
                      Last refreshed:{" "}
                      {(() => {
                        const mins = Math.round(
                          (Date.now() - new Date(scraperLastRun).getTime()) /
                            60000,
                        );
                        if (mins < 1) return "just now";
                        if (mins < 60) return `${mins}m ago`;
                        const hrs = Math.round(mins / 60);
                        if (hrs < 24) return `${hrs}h ago`;
                        return `${Math.round(hrs / 24)}d ago`;
                      })()}
                    </>
                  ) : (
                    "Booking data from daily sync"
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshBookings}
                  disabled={scraperPending}
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5 mr-1.5",
                      scraperPending && "animate-spin",
                    )}
                  />
                  Refresh Bookings
                </Button>
              </div>

              {/* Request Dates Button */}
              <Button
                className="w-full mt-4"
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
                      // Parse as noon local to avoid UTC date-only shift
                      const checkIn = new Date(stay.checkIn + "T12:00:00");
                      const checkOut = new Date(stay.checkOut + "T12:00:00");
                      const nights = Math.ceil(
                        (checkOut.getTime() - checkIn.getTime()) /
                          (1000 * 60 * 60 * 24),
                      );

                      return (
                        <div
                          key={stay.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            stay.type === "family"
                              ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                              : stay.type === "kindred"
                                ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                                : "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700",
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-sm text-foreground">
                              {stay.guestName}
                            </div>
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                stay.type === "family"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : stay.type === "kindred"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                              )}
                            >
                              {stay.type === "family"
                                ? "Family"
                                : stay.type === "kindred"
                                  ? "Kindred"
                                  : "Guest"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {checkIn.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            →{" "}
                            {checkOut.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {nights} {nights === 1 ? "night" : "nights"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Selected Booking Details */}
              {selectedBooking && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Booking Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Guest
                      </div>
                      <div className="text-base font-semibold">
                        {selectedBooking.guestName}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Dates
                      </div>
                      <div className="text-base">
                        {new Date(
                          selectedBooking.checkIn + "T12:00:00",
                        ).toLocaleDateString()}{" "}
                        →{" "}
                        {new Date(
                          selectedBooking.checkOut + "T12:00:00",
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Guests
                      </div>
                      <div className="text-base">
                        {selectedBooking.guestCount}
                      </div>
                    </div>
                    {selectedBooking.notes && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Notes
                        </div>
                        <div className="text-base italic">
                          "{selectedBooking.notes}"
                        </div>
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
  );
}
