import { Mail, MapPin, Instagram, Facebook } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="font-serif text-3xl font-light text-background mb-6 block">
              Casa <span className="italic">Vistas</span>
            </Link>
            <p className="text-background/70 leading-relaxed max-w-md mb-6">
              Your private paradise in Costa Rica. Experience luxury, comfort,
              and breathtaking ocean views in one of the most beautiful
              destinations in the world.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center text-background/70 hover:bg-background/20 hover:text-background transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center text-background/70 hover:bg-background/20 hover:text-background transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-medium text-background mb-6 text-sm tracking-wider uppercase">
              Explore
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#property"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  The Villa
                </Link>
              </li>
              <li>
                <Link
                  href="/#amenities"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Amenities
                </Link>
              </li>
              <li>
                <Link
                  href="/#availability"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Availability
                </Link>
              </li>
              <li>
                <Link
                  href="/experiences"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Experiences
                </Link>
              </li>
              <li>
                <Link
                  href="/#reviews"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium text-background mb-6 text-sm tracking-wider uppercase">
              Contact
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="mailto:info@casavistas.net"
                  className="flex items-center gap-3 text-background/70 hover:text-background transition-colors"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>info@casavistas.net</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-background/70">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-1" />
                  <span>
                    Mar Vista Community<br />
                    Brasilito, Costa Rica
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/50 text-sm">
            © {new Date().getFullYear()} Casa Vistas. All rights reserved.
          </p>
          <p className="text-background/40 text-xs">
            Managed by Blue Zone Experience
          </p>
        </div>
      </div>
    </footer>
  )
}
