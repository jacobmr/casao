"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

const TOTAL_IMAGES = 39

// Curated hero images - best shots for first impression
const HERO_IMAGES = [1, 3, 5, 8, 12, 15, 18, 22, 25, 28, 31, 35]

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrevious = useCallback(() => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)
  }, [])

  const goToNext = useCallback(() => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length)
  }, [])

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev)
  }, [])

  return (
    <section className="relative h-[100svh] w-full overflow-hidden">
      {/* Images with Ken Burns effect */}
      <div className="absolute inset-0">
        {HERO_IMAGES.map((imageNum, index) => {
          const isPrevious = index === (currentIndex - 1 + HERO_IMAGES.length) % HERO_IMAGES.length
          const isCurrent = index === currentIndex
          const isNext = index === (currentIndex + 1) % HERO_IMAGES.length
          const shouldRender = isPrevious || isCurrent || isNext

          if (!shouldRender) return null

          return (
            <div
              key={imageNum}
              className={cn(
                "absolute inset-0 transition-opacity duration-1500 ease-in-out",
                isCurrent ? "opacity-100" : "opacity-0"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 scale-105 transition-transform duration-[8000ms] ease-out",
                  isCurrent && "scale-100"
                )}
              >
                <Image
                  src={`/images/property/${String(imageNum).padStart(3, "0")}.jpg`}
                  alt={`Casa Vistas oceanview luxury villa - View ${imageNum}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  quality={90}
                  sizes="100vw"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Main hero content - positioned lower for editorial feel */}
        <div
          className={cn(
            "flex-1 flex items-end pb-32 md:pb-40 lg:pb-48 px-6 md:px-12 lg:px-20",
            "transition-all duration-1000",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <p className="text-white/80 text-sm md:text-base tracking-[0.3em] uppercase mb-4 md:mb-6 font-medium animate-fade-in-up stagger-1">
              Brasilito, Costa Rica
            </p>

            {/* Main heading - editorial typography */}
            <h1 className="text-white text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-light leading-[0.9] tracking-tight mb-6 md:mb-8 optical-margin animate-fade-in-up stagger-2">
              Casa<br />
              <span className="italic font-normal">Vistas</span>
            </h1>

            {/* Decorative line */}
            <div className="decorative-line mb-6 md:mb-8 animate-fade-in-up stagger-3" />

            {/* Tagline */}
            <p className="text-white/90 text-lg md:text-xl lg:text-2xl font-light max-w-xl leading-relaxed animate-fade-in-up stagger-4">
              Where Pacific sunsets meet jungle serenity.
              <span className="block mt-2 text-white/70">
                Five bedrooms. Infinity pool. Endless horizon.
              </span>
            </p>

            {/* CTA */}
            <div className="mt-8 md:mt-10 animate-fade-in-up stagger-5">
              <a
                href="#availability"
                className="group inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full transition-all duration-300 hover:gap-5"
              >
                <span className="text-base md:text-lg font-medium tracking-wide">
                  Check Availability
                </span>
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
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
        </div>

        {/* Bottom bar with controls */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 lg:px-20 py-6 flex items-center justify-between">
          {/* Progress indicators - minimal line style */}
          <div className="flex items-center gap-2">
            {HERO_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false)
                  setCurrentIndex(index)
                }}
                className="group relative h-8 flex items-center"
                aria-label={`Go to image ${index + 1}`}
              >
                <div className="h-[2px] w-8 md:w-12 bg-white/30 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full bg-white transition-all duration-300",
                      currentIndex === index
                        ? "w-full"
                        : currentIndex > index
                          ? "w-full opacity-60"
                          : "w-0"
                    )}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAutoPlay}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-300"
              aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {isAutoPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>

            <div className="h-6 w-px bg-white/20" />

            <button
              onClick={goToPrevious}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-300"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-300"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image counter */}
        <div className="absolute bottom-6 right-6 md:right-auto md:left-6 md:bottom-20 text-white/50 text-sm font-mono tracking-wider">
          <span className="text-white">{String(currentIndex + 1).padStart(2, "0")}</span>
          <span className="mx-1">/</span>
          <span>{String(HERO_IMAGES.length).padStart(2, "0")}</span>
        </div>
      </div>
    </section>
  )
}
