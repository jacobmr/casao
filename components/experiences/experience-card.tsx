"use client"

import { Experience } from "@/lib/experiences-data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Check } from "lucide-react"
import Image from "next/image"

interface ExperienceCardProps {
  experience: Experience
  onBookClick?: () => void
}

export function ExperienceCard({ experience, onBookClick }: ExperienceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      {/* Image */}
      <div className="relative h-48 w-full bg-gradient-to-br from-blue-500 to-green-500">
        <div className="h-full w-full flex items-center justify-center text-6xl bg-black/20">
          {experience.icon}
        </div>
        {experience.seasonal && (
          <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600">
            Seasonal
          </Badge>
        )}
      </div>
      
      {/* Content */}
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{experience.icon}</span>
          <h3 className="font-semibold text-lg">{experience.name}</h3>
        </div>
        
        <p className="text-muted-foreground text-sm mb-3 flex-1">
          {experience.shortDescription}
        </p>
        
        {experience.duration && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Clock className="h-4 w-4" />
            {experience.duration}
          </div>
        )}
        
        {experience.seasonal && experience.seasonalNote && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
            {experience.seasonalNote}
          </p>
        )}
        
        <div className="space-y-1 mb-4">
          {experience.inclusions.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
          {experience.inclusions.length > 3 && (
            <p className="text-xs text-muted-foreground pl-6">
              +{experience.inclusions.length - 3} more
            </p>
          )}
        </div>
        
        <Button 
          onClick={onBookClick} 
          variant="outline" 
          className="w-full mt-auto"
        >
          Book Your Stay
        </Button>
      </CardContent>
    </Card>
  )
}
