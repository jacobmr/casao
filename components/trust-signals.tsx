import { Star, Shield, Award, Heart, Quote } from "lucide-react"

const trustItems = [
  {
    icon: Star,
    value: "5.0",
    label: "Guest Rating",
    detail: "127 verified reviews",
  },
  {
    icon: Shield,
    value: "Verified",
    label: "Property",
    detail: "Professionally managed",
  },
  {
    icon: Award,
    value: "Top 1%",
    label: "Superhost",
    detail: "Of luxury rentals",
  },
  {
    icon: Heart,
    value: "98%",
    label: "Return Rate",
    detail: "Guests rebook",
  },
]

const testimonials = [
  {
    quote:
      "Casa Vistas exceeded all our expectations. The views are absolutely stunning, and the house is even more beautiful in person. Our family had the most incredible week here.",
    author: "Sarah & Michael",
    location: "San Francisco, CA",
    rating: 5,
  },
  {
    quote:
      "Hands down the best vacation rental we've ever stayed at. The attention to detail, the amenities, and the location are all perfect. We can't wait to come back!",
    author: "Jennifer & David",
    location: "New York, NY",
    rating: 5,
  },
]

export function TrustSignals() {
  return (
    <section className="py-24 md:py-32 bg-background" id="reviews">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-20">
          <p className="text-secondary text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            Trusted Worldwide
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-6 text-balance">
            Join hundreds who've found their{" "}
            <span className="italic">perfect</span> getaway
          </h2>
        </div>

        {/* Trust stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {trustItems.map((item, index) => (
            <div
              key={item.label}
              className="text-center p-6 rounded-2xl bg-accent/30 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary/10 text-primary">
                <item.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="font-serif text-3xl md:text-4xl font-light text-foreground mb-1">
                {item.value}
              </div>
              <div className="text-sm font-medium text-foreground mb-1">
                {item.label}
              </div>
              <div className="text-xs text-muted-foreground">{item.detail}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="relative bg-card rounded-2xl p-8 md:p-10 border shadow-sm animate-fade-in-up"
              style={{ animationDelay: `${(index + 4) * 0.15}s` }}
            >
              {/* Quote icon */}
              <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Quote className="w-4 h-4 text-secondary-foreground" fill="currentColor" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-secondary"
                    fill="currentColor"
                  />
                ))}
              </div>

              {/* Quote text */}
              <blockquote className="text-foreground/80 text-lg leading-relaxed mb-6 font-light">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-sm font-medium">
                    {testimonial.author.split(" ")[0][0]}
                    {testimonial.author.split(" ")[2]?.[0] || testimonial.author.split(" ")[1][0]}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm">
                    {testimonial.author}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Ready to experience Casa Vistas for yourself?
          </p>
          <a
            href="#availability"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-medium transition-all duration-300 hover:bg-primary/90 hover:gap-4"
          >
            Check Availability
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
