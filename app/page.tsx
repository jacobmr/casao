import { HeroCarousel } from "@/components/hero-carousel"
import { AmenitiesGrid } from "@/components/amenities-grid"
import { AvailabilityCalendar } from "@/components/availability-calendar"
import { PropertyHighlights } from "@/components/property-highlights"
import { TrustSignals } from "@/components/trust-signals"
import { PropertyDetails } from "@/components/property-details"
import { Footer } from "@/components/footer"
import { CacheRefresher } from "@/components/cache-refresher"

export default function HomePage({
  searchParams,
}: {
  searchParams?: { cache_JMR?: string }
}) {
  const shouldRefreshCache = searchParams?.cache_JMR !== undefined

  return (
    <main className="min-h-screen">
      {shouldRefreshCache && <CacheRefresher />}
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
