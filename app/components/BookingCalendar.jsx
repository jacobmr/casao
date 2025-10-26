'use client';

import { useState, useEffect } from 'react';

/**
 * Interactive booking calendar component
 * - Shows available/blocked dates
 * - Allows date range selection
 * - Fetches real-time availability from Guesty
 * - Enforces minimum night requirements
 */
export default function BookingCalendar({ listingId, minNights = 7, maxGuests = 4 }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(2);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Check if date is in the past
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if date is blocked
  const isBlocked = (date) => {
    return blockedDates.has(formatDate(date)) || isPastDate(date);
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Handle date click
  const handleDateClick = (date) => {
    if (isBlocked(date)) return;

    // If no check-in, set it
    if (!checkIn) {
      setCheckIn(date);
      setCheckOut(null);
      setQuote(null);
      return;
    }

    // If check-in exists but no check-out
    if (checkIn && !checkOut) {
      // If clicked date is before check-in, reset
      if (date < checkIn) {
        setCheckIn(date);
        setCheckOut(null);
        return;
      }

      // Check if any dates in range are blocked
      const daysDiff = Math.ceil((date - checkIn) / (1000 * 60 * 60 * 24));
      let hasBlockedDate = false;
      for (let i = 1; i < daysDiff; i++) {
        const checkDate = new Date(checkIn);
        checkDate.setDate(checkDate.getDate() + i);
        if (isBlocked(checkDate)) {
          hasBlockedDate = true;
          break;
        }
      }

      if (hasBlockedDate) {
        setError('Selected range contains unavailable dates');
        return;
      }

      // Check minimum nights
      if (daysDiff < minNights) {
        setError(`Minimum stay is ${minNights} nights`);
        return;
      }

      setCheckOut(date);
      setError(null);
      return;
    }

    // If both dates exist, reset
    setCheckIn(date);
    setCheckOut(null);
    setQuote(null);
  };

  // Check if date is in selected range
  const isInRange = (date) => {
    if (!checkIn) return false;
    const compareDate = checkOut || hoveredDate;
    if (!compareDate) return false;
    return date > checkIn && date < compareDate;
  };

  // Check if date is selected endpoint
  const isSelected = (date) => {
    if (!checkIn) return false;
    return formatDate(date) === formatDate(checkIn) || 
           (checkOut && formatDate(date) === formatDate(checkOut));
  };

  // Fetch availability for current month when component mounts or month changes
  useEffect(() => {
    fetchMonthAvailability();
  }, [currentMonth]);

  // Fetch quote when dates are selected
  useEffect(() => {
    if (checkIn && checkOut) {
      fetchQuote();
    }
  }, [checkIn, checkOut, guests]);

  // Fetch availability using Guesty calendar API
  const fetchMonthAvailability = async () => {
    setLoadingAvailability(true);
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first and last day of current month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const fromDate = formatDate(firstDay);
    const toDate = formatDate(lastDay);
    
    try {
      const response = await fetch(
        `/api/calendar?listingId=${listingId}&from=${fromDate}&to=${toDate}`
      );
      
      if (!response.ok) {
        console.error('Failed to fetch calendar:', response.status);
        setLoadingAvailability(false);
        return;
      }
      
      const calendarData = await response.json();
      
      // Build set of blocked dates from calendar response
      const newBlockedDates = new Set();
      
      calendarData.forEach(day => {
        // Block if status is not "available"
        if (day.status !== 'available') {
          newBlockedDates.add(day.date);
        }
      });
      
      setBlockedDates(newBlockedDates);
      
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          checkInDateLocalized: formatDate(checkIn),
          checkOutDateLocalized: formatDate(checkOut),
          adults: guests,
          children: 0,
          currency: 'USD',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get quote');
      }

      const data = await response.json();
      setQuote(data);
    } catch (err) {
      setError(err.message);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  // Render calendar
  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const blocked = isBlocked(date);
      const selected = isSelected(date);
      const inRange = isInRange(date);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          onMouseEnter={() => setHoveredDate(date)}
          onMouseLeave={() => setHoveredDate(null)}
          disabled={blocked}
          className={`
            h-12 rounded-lg text-sm font-medium transition-all
            ${blocked 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through' 
              : 'hover:bg-blue-50 cursor-pointer'
            }
            ${selected 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : ''
            }
            ${inRange 
              ? 'bg-blue-100 text-blue-900' 
              : ''
            }
            ${!blocked && !selected && !inRange 
              ? 'text-gray-900' 
              : ''
            }
          `}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Loading indicator */}
        {loadingAvailability && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Checking availability from Guesty...
          </div>
        )}
        
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 h-8 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded" />
            <span>In Range</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded line-through" />
            <span>Unavailable</span>
          </div>
        </div>
      </div>
    );
  };

  // Calculate nights
  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          {renderCalendar()}
        </div>

        {/* Booking summary */}
        <div className="space-y-6">
          {/* Guest selector */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              👥 Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>

          {/* Selected dates */}
          {checkIn && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                📅 Your Stay
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Check-in:</span>
                  <div className="font-medium">{checkIn.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</div>
                </div>
                {checkOut && (
                  <>
                    <div>
                      <span className="text-gray-600">Check-out:</span>
                      <div className="font-medium">{checkOut.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</div>
                    </div>
                    <div className="pt-3 border-t">
                      <span className="text-gray-600">Duration:</span>
                      <div className="font-medium">{nights} {nights === 1 ? 'night' : 'nights'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Quote/Price */}
          {loading && (
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Getting price...</span>
            </div>
          )}

          {quote && !loading && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="font-semibold mb-4">Price Details</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    ${(quote.money.hostPayout / nights).toFixed(2)} × {nights} nights
                  </span>
                  <span className="font-medium">${quote.money.hostPayout.toFixed(2)}</span>
                </div>
                {quote.money.breakdown?.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-600">{item.title}</span>
                    <span className="font-medium">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-3 border-t flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>${quote.money.totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => window.location.href = `/book/payment?quoteId=${quote._id}`}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Minimum nights notice */}
          {!checkIn && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>Minimum stay:</strong> {minNights} nights
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
