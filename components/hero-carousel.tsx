"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TOTAL_IMAGES = 39

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TOTAL_IMAGES)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + TOTAL_IMAGES) % TOTAL_IMAGES)
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % TOTAL_IMAGES)
  }

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
  }

  return (
    <section className="relative h-[60vh] md:h-[75vh] lg:h-[85vh] w-full overflow-hidden bg-muted">
      {/* Hero Images */}
      <div className="relative h-full w-full">
        {Array.from({ length: TOTAL_IMAGES }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              currentIndex === index ? "opacity-100" : "opacity-0",
            )}
          >
            <img
              src={`/images/property/${String(index + 1).padStart(3, "0")}.jpg`}
              alt={`Casa Vistas - View ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ))}
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 text-balance">
          Casa Vistas
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-white/95 max-w-2xl mb-8 text-balance">
          Your Private Paradise in Costa Rica
        </p>
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-base md:text-lg px-8 py-6 rounded-xl shadow-2xl"
        >
          Check Availability
        </Button>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
      >
        <ChevronLeft className="h-6 w-6" />
        <span className="sr-only">Previous image</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
      >
        <ChevronRight className="h-6 w-6" />
        <span className="sr-only">Next image</span>
      </Button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center max-w-md px-4">
        {Array.from({ length: TOTAL_IMAGES }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              currentIndex === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75",
            )}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
