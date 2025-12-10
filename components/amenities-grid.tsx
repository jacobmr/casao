import {
  Waves,
  Wifi,
  Car,
  Wind,
  Tv,
  UtensilsCrossed,
  Dumbbell,
  TreePalm,
  Coffee,
  Sparkles,
  Shield,
  Baby,
} from "lucide-react"

const amenities = [
  {
    icon: Waves,
    title: "Infinity Pool",
    description: "Private infinity-edge pool overlooking the Pacific",
    featured: true,
  },
  {
    icon: Wifi,
    title: "High-Speed WiFi",
    description: "Fiber optic with Starlink backup",
    featured: false,
  },
  {
    icon: UtensilsCrossed,
    title: "Gourmet Kitchen",
    description: "Large island, premium appliances",
    featured: true,
  },
  {
    icon: Tv,
    title: "Entertainment",
    description: "Smart TVs throughout",
    featured: false,
  },
  {
    icon: Wind,
    title: "Covered Terrace",
    description: "Gas BBQ, outdoor dining for 12",
    featured: true,
  },
  {
    icon: Coffee,
    title: "Stocked Kitchen",
    description: "Coffee, spices, oils included",
    featured: false,
  },
  {
    icon: Sparkles,
    title: "Beach Gear",
    description: "Towels, chairs, coolers, umbrellas",
    featured: false,
  },
  {
    icon: Shield,
    title: "24/7 Security",
    description: "Gated Mar Vista community",
    featured: false,
  },
  {
    icon: Baby,
    title: "Family Ready",
    description: "Travel cribs, high chairs available",
    featured: false,
  },
  {
    icon: TreePalm,
    title: "Private Gardens",
    description: "Yoga deck & breakfast nook",
    featured: false,
  },
  {
    icon: Dumbbell,
    title: "Fitness Center",
    description: "Access to Mar Vista gym",
    featured: false,
  },
  {
    icon: Car,
    title: "Courts Access",
    description: "Tennis & pickleball nearby",
    featured: false,
  },
]

export function AmenitiesGrid() {
  const featuredAmenities = amenities.filter((a) => a.featured)
  const otherAmenities = amenities.filter((a) => !a.featured)

  return (
    <section className="py-24 md:py-32 bg-background" id="amenities">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        {/* Section header */}
        <div className="max-w-2xl mb-16 md:mb-20">
          <p className="text-secondary text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            Amenities
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-6">
            Everything you need for the{" "}
            <span className="italic">perfect</span> escape
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            From morning yoga overlooking the ocean to evening cocktails by the infinity pool,
            every detail has been considered.
          </p>
        </div>

        {/* Featured amenities - large cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {featuredAmenities.map((amenity, index) => (
            <div
              key={amenity.title}
              className="group relative bg-accent/30 rounded-2xl p-8 md:p-10 transition-all duration-500 hover:bg-accent/50 card-hover-lift animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                <amenity.icon
                  className="w-7 h-7 text-primary transition-colors duration-300 group-hover:text-primary-foreground"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="font-serif text-2xl font-light text-foreground mb-3">
                {amenity.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {amenity.description}
              </p>
            </div>
          ))}
        </div>

        {/* Other amenities - compact grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {otherAmenities.map((amenity, index) => (
            <div
              key={amenity.title}
              className="group flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-accent/30 animate-fade-in-up"
              style={{ animationDelay: `${(index + 3) * 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary/10">
                <amenity.icon
                  className="w-5 h-5 text-muted-foreground transition-colors duration-300 group-hover:text-primary"
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm mb-0.5">
                  {amenity.title}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {amenity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
