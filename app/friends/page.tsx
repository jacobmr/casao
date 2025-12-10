import Link from "next/link"
import { ArrowRight, Calendar, Sun, Waves, Users } from "lucide-react"

export const metadata = {
  title: "Friends & Family Opportunity | Casa Vistas",
  description: "A rare opportunity to stay at Casa Vistas this high season at a special rate.",
}

export default function FriendsPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Paper texture background */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Header - typewriter style */}
        <header className="mb-12 md:mb-16">
          <p className="font-mono text-xs tracking-[0.4em] text-neutral-400 uppercase mb-4">
            December 2025
          </p>
          <h1 className="font-mono text-3xl md:text-4xl lg:text-5xl text-neutral-800 leading-tight mb-6">
            A note to friends<br />
            <span className="text-neutral-500">&amp; family</span>
          </h1>
          <div className="w-24 h-px bg-neutral-300" />
        </header>

        {/* The letter */}
        <article className="space-y-6 font-mono text-neutral-700 leading-relaxed text-sm md:text-base">
          <p>Hey there —</p>

          <p>
            If you're seeing this page, you're friends or family (or you know someone who is).
          </p>

          <p>
            We've had our Costa Rica 3 bedroom home (and 2 bedroom casita)
            blocked for this high season — but plans have changed, and
            we've opened up the calendar.
          </p>

          <p>
            <strong className="text-neutral-900">
              Our scheduling error is your gain.
            </strong>{" "}
            There's quite a bit of availability from now through early March
            at our place, during what's typically the most sought-after
            (and most expensive) time of year.
          </p>

          <p>
            Because this is last-minute, and because you found this page,
            we can offer something we couldn't offer elsewhere:
          </p>

          {/* Special offer box */}
          <div className="my-10 p-6 md:p-8 border-2 border-neutral-300 border-dashed bg-white/50">
            <p className="font-mono text-xs tracking-[0.3em] text-neutral-400 uppercase mb-3">
              Friends & Family Rate
            </p>
            <p className="font-mono text-2xl md:text-3xl text-neutral-800 mb-4">
              50% off for select dates
            </p>
            <p className="font-mono text-sm text-neutral-600">
              Reach out to us directly for the discount code.
            </p>
          </div>

          <p>
            The property sleeps 11 across 5 bedrooms (Casa + Casita), has a
            stunning infinity pool overlooking the Pacific, and sits in a
            gated community just 1.5 miles from Flamingo Beach, 1 mile from
            Brasilito Beach and Playa Conchal.
          </p>

          <p>Here's what you're looking at:</p>

          {/* Quick facts */}
          <ul className="space-y-3 my-8 pl-4 border-l-2 border-neutral-200">
            <li className="flex items-start gap-3">
              <Calendar className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
              <span>December through April availability</span>
            </li>
            <li className="flex items-start gap-3">
              <Sun className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
              <span>Costa Rica's dry season — perfect weather</span>
            </li>
            <li className="flex items-start gap-3">
              <Waves className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
              <span>Private pool + beach gear included</span>
            </li>
            <li className="flex items-start gap-3">
              <Users className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
              <span>Perfect for families or group trips</span>
            </li>
          </ul>

          <p>
            If this sounds interesting, take a look at the property and check
            what dates work for you. Feel free to reach out with any questions
            or to discuss availability and rates.
          </p>

          <p>
            Our property is professionally managed by Blue Zone Experience,
            who'll handle everything once you book. But for friends and family,
            I wanted you to hear it from me first.
          </p>

          {/* Transparency section */}
          <div className="my-10 p-6 border border-neutral-200 bg-neutral-50/50 rounded">
            <p className="font-mono text-xs tracking-[0.2em] text-neutral-400 uppercase mb-3">
              For Transparency
            </p>
            <p className="text-sm text-neutral-600 mb-4">
              You can find this same property on the major booking sites —
              but at full price. I'm including these links so you can see
              the reviews and compare:
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.airbnb.com/rooms/47159132"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                <span className="w-4 h-4 rounded bg-[#FF5A5F] flex items-center justify-center text-white text-[10px] font-bold">A</span>
                Airbnb Listing →
              </a>
              <a
                href="https://www.vrbo.com/en-ca/cottage-rental/p3030912vb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                <span className="w-4 h-4 rounded bg-[#3B5998] flex items-center justify-center text-white text-[10px] font-bold">V</span>
                VRBO Listing →
              </a>
            </div>
          </div>

          <p className="pt-4">
            Pura vida,<br />
            <span className="text-neutral-500">— Jacob & Alicia</span>
          </p>
        </article>

        {/* CTA */}
        <div className="mt-12 md:mt-16 pt-8 border-t border-neutral-200">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 font-mono text-sm text-neutral-800 hover:text-neutral-600 transition-colors"
          >
            <span>View Casa Vistas</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <div className="mt-8">
            <Link
              href="/#availability"
              className="inline-flex items-center justify-center gap-2 bg-neutral-800 text-white px-6 py-3 rounded font-mono text-sm hover:bg-neutral-700 transition-colors"
            >
              Check Availability
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <footer className="mt-16 pt-8 border-t border-neutral-200">
          <p className="font-mono text-xs text-neutral-400 leading-relaxed">
            This page is for friends and family only. Please don't share
            publicly — the special rate is not available through our regular
            booking channels. If you know someone who'd be interested, feel
            free to forward this directly to them.
          </p>
        </footer>
      </div>
    </div>
  )
}
