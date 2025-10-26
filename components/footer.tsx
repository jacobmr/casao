import { Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-bold mb-4">Casa Vistas</h3>
            <p className="text-background/80 leading-relaxed">
              Your private paradise in Costa Rica. Experience luxury, comfort, and breathtaking ocean views in one of
              the most beautiful destinations in the world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/booking" className="text-background/80 hover:text-background transition-colors">
                  Book Now
                </Link>
              </li>
              <li>
                <Link href="#amenities" className="text-background/80 hover:text-background transition-colors">
                  Amenities
                </Link>
              </li>
              <li>
                <Link href="#reviews" className="text-background/80 hover:text-background transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-background/80 hover:text-background transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:info@casavistas.com"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  info@casavistas.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <a href="tel:+15551234567" className="text-background/80 hover:text-background transition-colors">
                  +1 (555) 123-4567
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-background/80">Guanacaste Province, Costa Rica</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center text-background/60 text-sm">
          <p>&copy; {new Date().getFullYear()} Casa Vistas. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
