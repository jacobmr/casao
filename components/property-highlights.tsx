import { Home, Users, Bed, Bath } from "lucide-react"

const highlights = [
  { icon: Home, label: "Luxury Villa", value: "4,500 sq ft" },
  { icon: Users, label: "Sleeps", value: "Up to 10 guests" },
  { icon: Bed, label: "Bedrooms", value: "5 spacious rooms" },
  { icon: Bath, label: "Bathrooms", value: "5.5 bathrooms" },
]

export function PropertyHighlights() {
  return (
    <section className="py-12 md:py-16 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {highlights.map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                <p className="font-semibold text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
