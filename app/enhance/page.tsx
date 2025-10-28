"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { experiences, categories, getAllCategories, getExperiencesByCategory } from "@/lib/experiences-data"
import { ExperienceListItem } from "@/components/experiences/experience-list-item"
import { DiscountBanner } from "@/components/experiences/discount-banner"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

function EnhanceContent() {
  const searchParams = useSearchParams()
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([])
  
  // Get booking details from URL params
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const guests = searchParams.get('guests') || searchParams.get('adults') || '2'
  
  const handleToggle = (id: string) => {
    setSelectedExperiences(prev => 
      prev.includes(id) 
        ? prev.filter(expId => expId !== id)
        : [...prev, id]
    )
  }
  
  const handleContinue = () => {
    // Build handoff URL with selections
    const params = new URLSearchParams()
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    params.set('adults', guests)
    
    // Add selected experiences as comma-separated list
    if (selectedExperiences.length > 0) {
      params.set('experiences', selectedExperiences.join(','))
    }
    
    // Redirect to handoff
    window.location.href = `/api/handoff?${params.toString()}`
  }
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } catch {
      return dateStr
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            Enhance Your Stay
          </h1>
          <p className="text-lg text-muted-foreground">
            Select experiences to make your vacation unforgettable
          </p>
          {checkIn && checkOut && (
            <p className="text-sm text-muted-foreground mt-2">
              {formatDate(checkIn)} - {formatDate(checkOut)} • {guests} {guests === '1' ? 'guest' : 'guests'}
            </p>
          )}
        </div>
        
        {/* Discount Banner */}
        <DiscountBanner selectedCount={selectedExperiences.length} />
        
        {/* Experiences by Category */}
        <div className="space-y-12">
          {getAllCategories().map((categoryKey) => {
            const category = categories[categoryKey]
            const categoryExperiences = getExperiencesByCategory(categoryKey)
            
            if (categoryExperiences.length === 0) return null
            
            return (
              <section key={categoryKey}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{category.icon}</span>
                  <div>
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                      {category.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {categoryExperiences.map((experience) => (
                    <ExperienceListItem
                      key={experience.id}
                      experience={experience}
                      selected={selectedExperiences.includes(experience.id)}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
        
        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50">
          <div className="container mx-auto max-w-5xl flex items-center justify-between gap-4">
            <div className="text-sm">
              <p className="font-semibold">
                {selectedExperiences.length === 0 && "No experiences selected"}
                {selectedExperiences.length === 1 && "1 experience selected"}
                {selectedExperiences.length > 1 && `${selectedExperiences.length} experiences selected`}
              </p>
              {selectedExperiences.length >= 2 && (
                <p className="text-green-600 dark:text-green-400 text-xs">
                  5% discount applied!
                </p>
              )}
            </div>
            
            <Button 
              size="lg" 
              onClick={handleContinue}
              className="gap-2"
            >
              Continue to Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Spacer for sticky footer */}
        <div className="h-24" />
      </div>
    </div>
  )
}

export default function EnhancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading experiences...</p>
        </div>
      </div>
    }>
      <EnhanceContent />
    </Suspense>
  )
}
