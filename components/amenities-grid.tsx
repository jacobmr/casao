import {
  Waves,
  Wifi,
  Car,
  Wind,
  Tv,
  UtensilsCrossed,
  Dumbbell,
  Palmtree,
  Coffee,
  Sparkles,
  Shield,
  Baby,
} from "lucide-react"
import { Card } from "@/components/ui/card"

const amenities = [
  { icon: Waves, title: "Infinity Pool", description: "Private infinity-edge pool with ocean views" },
  { icon: Wifi, title: "High-Speed WiFi", description: "Fiber optic with Starlink backup" },
  { icon: UtensilsCrossed, title: "Gourmet Kitchen", description: "Large island, modern appliances" },
  { icon: Tv, title: "Digital Cable TV", description: "Entertainment in living areas" },
  { icon: Wind, title: "Covered Terrace", description: "Gas BBQ, mini-fridge, outdoor dining" },
  { icon: Coffee, title: "Coffee & Basics", description: "Coffee, spices, cooking oil included" },
  { icon: Sparkles, title: "Beach Amenities", description: "Towels, chairs, coolers provided" },
  { icon: Shield, title: "24/7 Security", description: "Gated Mar Vista community" },
  { icon: Baby, title: "Family Friendly", description: "Travel cribs available on request" },
  { icon: Palmtree, title: "Private Gardens", description: "Yoga area & breakfast nook" },
  { icon: Dumbbell, title: "Community Gym", description: "Access to Mar Vista fitness center" },
  { icon: Car, title: "Tennis & Pickleball", description: "Community courts available" },
]

export function AmenitiesGrid() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            World-Class Amenities
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Everything you need for an unforgettable luxury vacation experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {amenities.map((amenity) => (
            <Card key={amenity.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <amenity.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">{amenity.title}</h3>
                  <p className="text-sm text-muted-foreground">{amenity.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
