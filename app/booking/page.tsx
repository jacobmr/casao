import { BookingCalendar } from "@/components/booking-calendar"
import { PricingCard } from "@/components/pricing-card"
import { BookingSummary } from "@/components/booking-summary"

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 text-balance">
            Book Your Stay at Casa Vistas
          </h1>
          <p className="text-lg text-muted-foreground text-balance">Select your dates and complete your reservation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <BookingCalendar />
            <PricingCard />
          </div>
          <div className="lg:col-span-1">
            <BookingSummary />
          </div>
        </div>
      </div>
    </main>
  )
}
