import { Home, Users, Bed, Bath, MapPin, Waves } from "lucide-react"

const highlights = [
  { icon: Home, value: "3,600", unit: "sq ft", label: "Living Space" },
  { icon: Users, value: "11", unit: "guests", label: "Sleeps Up To" },
  { icon: Bed, value: "5", unit: "bedrooms", label: "Private Suites" },
  { icon: Bath, value: "4.5", unit: "baths", label: "Full Bathrooms" },
  { icon: Waves, value: "300", unit: "ft elevation", label: "Ocean Views" },
  { icon: MapPin, value: "1.5", unit: "miles", label: "To Beach" },
]

export function PropertyHighlights() {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-accent/50 to-background overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-20">
          <p className="text-secondary text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            At A Glance
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-foreground text-balance">
            A retreat designed for{" "}
            <span className="italic">unforgettable</span> moments
          </h2>
        </div>

        {/* Stats grid - asymmetric layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-6">
          {highlights.map((item, index) => (
            <div
              key={item.label}
              className="group text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>

              {/* Value */}
              <div className="mb-1">
                <span className="font-serif text-3xl md:text-4xl font-light text-foreground">
                  {item.value}
                </span>
                <span className="text-muted-foreground text-sm ml-1">
                  {item.unit}
                </span>
              </div>

              {/* Label */}
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Editorial quote */}
        <div className="mt-20 md:mt-28 max-w-3xl mx-auto text-center">
          <blockquote className="editorial-quote">
            "An oasis where the Pacific stretches endlessly before you,
            and time moves at the pace of the sunset."
          </blockquote>
          <div className="decorative-line mx-auto mt-8" />
        </div>
      </div>
    </section>
  )
}
