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
                Casa Vistas is a breathtaking luxury villa perched on the hills of Costa Rica, offering panoramic ocean
                views that will take your breath away. This stunning 5-bedroom estate combines modern elegance with
                tropical charm, creating the perfect sanctuary for your Costa Rican getaway.
              </p>
              <p className="text-foreground leading-relaxed mb-6">
                Wake up to the sound of waves and howler monkeys, spend your days lounging by the infinity pool, and
                watch spectacular sunsets from your private terrace. Whether you're seeking adventure or relaxation,
                Casa Vistas provides the perfect base for exploring Costa Rica's natural wonders.
              </p>
              <p className="text-foreground leading-relaxed">
                Our dedicated concierge team is available to arrange everything from private chefs and spa services to
                surf lessons and rainforest tours. Experience the pura vida lifestyle in unparalleled luxury and
                comfort.
              </p>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-xl text-foreground mb-4">Location Highlights</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>5 minutes to pristine beaches</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>15 minutes to downtown restaurants</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>30 minutes to national parks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>45 minutes to international airport</span>
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
                  <span>Check-out: 11:00 AM</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>No smoking inside the property</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Pets considered upon request</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
