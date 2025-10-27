"use client"

import { ReactNode } from "react"

interface CategorySectionProps {
  icon: string
  title: string
  description: string
  children: ReactNode
}

export function CategorySection({ icon, title, description, children }: CategorySectionProps) {
  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{icon}</div>
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </section>
  )
}
