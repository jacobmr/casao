// Family Portal Types

export type BookingStatus = "pending" | "approved" | "rejected"

export interface FamilyBooking {
  id: string                    // UUID
  checkIn: string               // YYYY-MM-DD
  checkOut: string              // YYYY-MM-DD
  guestName: string
  guestEmail?: string
  guestCount: number            // 1-12
  notes?: string
  status: BookingStatus         // Approval workflow
  guestyBlocked: boolean        // Owner marks after manual block
  createdAt: number             // Unix timestamp
  updatedAt: number             // Unix timestamp
}

export interface FamilySession {
  authenticated: boolean
  expiresAt: number             // Unix timestamp
}

export interface CalendarDay {
  date: string                  // YYYY-MM-DD
  status: "available" | "family" | "owner" | "booked"
  isCheckIn?: boolean           // First day of stay (PM arrival)
  isCheckOut?: boolean          // Last day of stay (AM departure)
  booking?: {
    title?: string
    guestName?: string
    guestCount?: number
    checkIn?: string
    checkOut?: string
    notes?: string
  }
  price?: number
}
