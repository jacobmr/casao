import { HeroCarousel } from "@/components/hero-carousel"
import { AmenitiesGrid } from "@/components/amenities-grid"
import { BookingWidget } from "@/components/booking-widget"
import { PropertyHighlights } from "@/components/property-highlights"
import { TrustSignals } from "@/components/trust-signals"
import { PropertyDetails } from "@/components/property-details"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroCarousel />
      <BookingWidget />
      <PropertyHighlights />
      <AmenitiesGrid />
      <PropertyDetails />
      <TrustSignals />
      <Footer />
    </main>
  )
}
