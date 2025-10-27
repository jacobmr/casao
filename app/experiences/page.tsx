"use client"

import { useState } from "react"
import { experiences, categories, getAllCategories, getExperiencesByCategory } from "@/lib/experiences-data"
import { ExperienceCard } from "@/components/experiences/experience-card"
import { CategorySection } from "@/components/experiences/category-section"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar as CalendarIcon } from "lucide-react"

export default function ExperiencesPage() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  
  const handleBookClick = () => {
    setIsCalendarOpen(true)
    // Scroll to availability section on home page
    // Or open calendar modal directly
  }
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center bg-gradient-to-br from-blue-600 to-green-600">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Your Costa Rica Adventure Awaits
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Curate your perfect vacation with our handpicked experiences and concierge services
          </p>
          <Button 
            size="lg" 
            className="gap-2 bg-white text-blue-600 hover:bg-white/90"
            onClick={() => {
              // Scroll to availability or open calendar
              window.location.href = '/#availability'
            }}
          >
            <CalendarIcon className="h-5 w-5" />
            Book Your Stay
          </Button>
        </div>
      </section>
      
      {/* Introduction */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            More Than Just a Place to Stay
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            At Casa O, we don't just offer a beautiful villa — we curate unforgettable experiences. 
            From thrilling adventures to peaceful wellness retreats, from gourmet dining to seamless 
            concierge services, we help you create the perfect Costa Rica vacation. Browse our 
            carefully selected experiences below and start planning your dream getaway.
          </p>
        </div>
      </section>
      
      {/* Experiences by Category */}
      <div className="container mx-auto px-4 py-12">
        {getAllCategories().map((categoryKey) => {
          const category = categories[categoryKey]
          const categoryExperiences = getExperiencesByCategory(categoryKey)
          
          if (categoryExperiences.length === 0) return null
          
          return (
            <CategorySection
              key={categoryKey}
              icon={category.icon}
              title={category.name}
              description={category.description}
            >
              {categoryExperiences.map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  onBookClick={handleBookClick}
                />
              ))}
            </CategorySection>
          )
        })}
      </div>
      
      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Book Your Complete Vacation?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Select your dates and choose your experiences. Save 5% on your lodging when you select 2 or more!
          </p>
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => window.location.href = '/#availability'}
          >
            <CalendarIcon className="h-5 w-5" />
            Check Availability
          </Button>
        </div>
      </section>
    </div>
  )
}
