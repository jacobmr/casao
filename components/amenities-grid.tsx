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
  { icon: Waves, title: "Infinity Pool", description: "Stunning ocean-view infinity pool" },
  { icon: Wifi, title: "High-Speed WiFi", description: "Fiber optic internet throughout" },
  { icon: Wind, title: "Air Conditioning", description: "Climate control in all rooms" },
  { icon: UtensilsCrossed, title: "Gourmet Kitchen", description: "Fully equipped chef's kitchen" },
  { icon: Tv, title: "Entertainment", description: "Smart TVs in every bedroom" },
  { icon: Car, title: "Free Parking", description: "Secure parking for 3 vehicles" },
  { icon: Dumbbell, title: "Fitness Center", description: "Private gym with ocean views" },
  { icon: Palmtree, title: "Tropical Gardens", description: "Lush landscaped grounds" },
  { icon: Coffee, title: "Espresso Bar", description: "Premium coffee station" },
  { icon: Sparkles, title: "Daily Housekeeping", description: "Professional cleaning service" },
  { icon: Shield, title: "24/7 Security", description: "Gated community with security" },
  { icon: Baby, title: "Family Friendly", description: "Cribs and high chairs available" },
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
