import { Star, Shield, Award, Heart } from "lucide-react"
import { Card } from "@/components/ui/card"

const trustItems = [
  {
    icon: Star,
    title: "5.0 Rating",
    description: "Based on 127 verified reviews",
  },
  {
    icon: Shield,
    title: "Verified Property",
    description: "Professionally managed and inspected",
  },
  {
    icon: Award,
    title: "Superhost Status",
    description: "Top 1% of luxury rentals",
  },
  {
    icon: Heart,
    title: "98% Rebook Rate",
    description: "Guests love returning to Casa Vistas",
  },
]

export function TrustSignals() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Trusted by Travelers Worldwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Join hundreds of satisfied guests who have experienced the magic of Casa Vistas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {trustItems.map((item) => (
            <Card key={item.title} className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 md:p-8">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-foreground leading-relaxed mb-4">
              "Casa Vistas exceeded all our expectations! The views are absolutely stunning, and the house is even more
              beautiful in person. Our family had the most incredible week here."
            </p>
            <p className="text-sm font-semibold text-foreground">Sarah & Michael</p>
            <p className="text-sm text-muted-foreground">San Francisco, CA</p>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-foreground leading-relaxed mb-4">
              "This is hands down the best vacation rental we've ever stayed at. The attention to detail, the amenities,
              and the location are all perfect. We can't wait to come back!"
            </p>
            <p className="text-sm font-semibold text-foreground">Jennifer & David</p>
            <p className="text-sm text-muted-foreground">New York, NY</p>
          </Card>
        </div>
      </div>
    </section>
  )
}
