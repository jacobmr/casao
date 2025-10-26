import { Card } from "@/components/ui/card"

export function PropertyDetails() {
  return (
    <section className="py-16 md:py-24 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8 text-center text-balance">
            Your Dream Vacation Awaits
          </h2>

          <Card className="p-8 md:p-12 mb-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-foreground leading-relaxed mb-6">
                Experience the total luxury and comfort of this house perched 300 feet above the Pacific Ocean with beautiful ocean and mountain views! Casa Vistas features a spacious 2,200 sq. ft. main house with 3 elegantly designed bedrooms and 3.5 bathrooms, complemented by a detached guest house offering an additional 1,400 sq. ft. with 2 bedrooms and 1 bathroom.
              </p>
              <p className="text-foreground leading-relaxed mb-6">
                The stunning infinity-edge pool is your personal oasis, offering the best sunset views along the coast. The great room boasts 20-foot ceilings, oversized glass sliding doors, and a gourmet kitchen with a large island, ideal for entertaining. Unwind on the covered terrace equipped with a gas BBQ, mini-fridge, lounge furniture, and outdoor dining.
              </p>
              <p className="text-foreground leading-relaxed">
                Let us help you personalize your stay! From tour reservations and fishing charters to rental car bookings and in-home chef services, we handle it all at no extra charge. Enjoy preferred corporate rates on transportation and tours.
              </p>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-xl text-foreground mb-4">Location Highlights</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Flamingo Beach - 1.5 miles away</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>12 unique beaches within short drive</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Mar Vista community amenities included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>24/7 gated community security</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-xl text-foreground mb-4">House Rules</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Check-in: 3:00 PM</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Check-out: 10:00 AM</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>No pets and non-smoking property</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>$1,000 security deposit required</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
