"use client"

import { Experience } from "@/lib/experiences-data"
import { Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExperienceListItemProps {
  experience: Experience
  selected: boolean
  onToggle: (id: string) => void
}

export function ExperienceListItem({ 
  experience, 
  selected, 
  onToggle 
}: ExperienceListItemProps) {
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50"
      )}
      onClick={() => onToggle(experience.id)}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
          "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
          selected 
            ? "bg-primary border-primary" 
            : "border-muted-foreground"
        )}>
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{experience.icon}</span>
          <h4 className="font-semibold">{experience.name}</h4>
          {experience.seasonal && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
              Seasonal
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">
          {experience.shortDescription}
        </p>
        
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {experience.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {experience.duration}
            </span>
          )}
          {experience.inclusions.slice(0, 2).map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-600" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
