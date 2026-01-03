"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  // Don't show main navigation on family portal pages
  const isFamilyRoute = pathname?.startsWith('/family')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (isFamilyRoute) {
    return null
  }

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              href="/"
              className={cn(
                "font-serif text-2xl md:text-3xl font-light tracking-tight transition-colors duration-300",
                isScrolled ? "text-foreground" : "text-white"
              )}
            >
              Casa <span className="italic">Vistas</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              <Link
                href="/#property"
                className={cn(
                  "text-sm tracking-wide transition-colors duration-300 hover:opacity-70",
                  isScrolled ? "text-foreground" : "text-white/90"
                )}
              >
                The Villa
              </Link>
              <Link
                href="/#amenities"
                className={cn(
                  "text-sm tracking-wide transition-colors duration-300 hover:opacity-70",
                  isScrolled ? "text-foreground" : "text-white/90"
                )}
              >
                Amenities
              </Link>
              <Link
                href="/experiences"
                className={cn(
                  "text-sm tracking-wide transition-colors duration-300 hover:opacity-70",
                  isScrolled ? "text-foreground" : "text-white/90"
                )}
              >
                Experiences
              </Link>
              <Link
                href="/#availability"
                className={cn(
                  "text-sm tracking-wide px-6 py-2.5 rounded-full transition-all duration-300",
                  isScrolled
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-white/15 text-white border border-white/30 hover:bg-white/25 backdrop-blur-sm"
                )}
              >
                Book Now
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "md:hidden p-2 transition-colors duration-300",
                isScrolled ? "text-foreground" : "text-white"
              )}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background transition-all duration-500 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="font-serif text-4xl font-light text-foreground mb-8"
          >
            Casa <span className="italic">Vistas</span>
          </Link>

          <div className="decorative-line mb-8" />

          <Link
            href="/#property"
            className="text-2xl font-light text-foreground/80 hover:text-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            The Villa
          </Link>
          <Link
            href="/#amenities"
            className="text-2xl font-light text-foreground/80 hover:text-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Amenities
          </Link>
          <Link
            href="/experiences"
            className="text-2xl font-light text-foreground/80 hover:text-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Experiences
          </Link>

          <Link
            href="/#availability"
            onClick={() => setIsOpen(false)}
            className="mt-8 px-10 py-4 bg-primary text-primary-foreground rounded-full text-lg font-medium transition-all duration-300 hover:bg-primary/90"
          >
            Book Now
          </Link>

          <p className="absolute bottom-8 text-sm text-muted-foreground">
            Brasilito, Costa Rica
          </p>
        </div>
      </div>
    </>
  )
}
