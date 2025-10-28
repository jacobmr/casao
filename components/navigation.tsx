"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Sparkles } from "lucide-react"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-serif text-2xl font-bold text-foreground hover:text-primary transition-colors">
            Casa Vistas
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#property" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Property
            </Link>
            <Link href="/#amenities" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Amenities
            </Link>
            <Link href="/experiences" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Experiences
            </Link>
            <Link href="/#availability">
              <Button size="sm">
                Check Availability
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <Link 
                href="/#property" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Property
              </Link>
              <Link 
                href="/#amenities" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Amenities
              </Link>
              <Link 
                href="/experiences" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                onClick={() => setIsOpen(false)}
              >
                <Sparkles className="h-4 w-4" />
                Experiences
              </Link>
              <Link href="/#availability" onClick={() => setIsOpen(false)}>
                <Button size="sm" className="w-full">
                  Check Availability
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
