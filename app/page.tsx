import { HeroCarousel } from "@/components/hero-carousel"
import { AmenitiesGrid } from "@/components/amenities-grid"
import { AvailabilityCalendar } from "@/components/availability-calendar"
import { PropertyHighlights } from "@/components/property-highlights"
import { TrustSignals } from "@/components/trust-signals"
import { PropertyDetails } from "@/components/property-details"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroCarousel />
      <PropertyHighlights />
      <AvailabilityCalendar />
      <AmenitiesGrid />
      <PropertyDetails />
      <TrustSignals />
      <Footer />
    </main>
  )
}
