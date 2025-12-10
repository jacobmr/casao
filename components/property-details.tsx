import { MapPin, Clock, Cigarette, DollarSign } from "lucide-react"

const locationFeatures = [
  "Flamingo Beach - 1.5 miles",
  "12 unique beaches nearby",
  "Mar Vista community access",
  "24/7 gated security",
]

const houseRules = [
  { icon: Clock, text: "Check-in 3 PM / Check-out 10 AM" },
  { icon: Cigarette, text: "Non-smoking property" },
  { icon: DollarSign, text: "$1,000 security deposit" },
]

export function PropertyDetails() {
  return (
    <section className="py-24 md:py-32 bg-accent/30" id="property">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left column - Main description */}
          <div>
            <p className="text-secondary text-sm tracking-[0.3em] uppercase mb-4 font-medium">
              The Villa
            </p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-8">
              Your private{" "}
              <span className="italic">paradise</span> awaits
            </h2>

            <div className="prose prose-lg max-w-none">
              <p className="text-foreground/80 leading-relaxed mb-6 text-lg">
                Perched 300 feet above the Pacific Ocean, Casa Vistas offers
                sweeping views of both ocean and mountains that will take your
                breath away. The main house spans 2,200 sq ft with three
                elegantly designed bedrooms, while the detached guest house adds
                another 1,400 sq ft with two additional bedrooms.
              </p>
              <p className="text-foreground/80 leading-relaxed mb-6 text-lg">
                The stunning infinity-edge pool becomes your personal oasis,
                offering the best sunset views along the coast. Inside, 20-foot
                ceilings and oversized glass doors blur the line between indoor
                luxury and tropical paradise.
              </p>
              <p className="text-foreground/80 leading-relaxed text-lg">
                Let us help personalize your stay. From tour reservations and
                fishing charters to private chef services, we handle every detail
                at no extra charge with preferred corporate rates.
              </p>
            </div>

            <div className="decorative-line mt-10" />
          </div>

          {/* Right column - Details cards */}
          <div className="space-y-8">
            {/* Location card */}
            <div className="bg-card rounded-2xl p-8 border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl font-light text-foreground">
                  Location
                </h3>
              </div>
              <ul className="space-y-3">
                {locationFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-foreground/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* House rules card */}
            <div className="bg-card rounded-2xl p-8 border shadow-sm">
              <h3 className="font-serif text-xl font-light text-foreground mb-6">
                House Rules
              </h3>
              <ul className="space-y-4">
                {houseRules.map((rule) => (
                  <li key={rule.text} className="flex items-center gap-4 text-foreground/70">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <rule.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <span>{rule.text}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground mt-6 pt-6 border-t">
                No pets allowed. Additional rules provided upon booking.
              </p>
            </div>

            {/* Concierge callout */}
            <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <h3 className="font-serif text-xl font-light mb-3 relative">
                Personal Concierge
              </h3>
              <p className="text-primary-foreground/80 relative leading-relaxed">
                Our team handles everything from airport transfers to private
                chefs. Just ask - we're here to make your stay extraordinary.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
