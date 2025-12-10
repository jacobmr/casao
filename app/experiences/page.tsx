"use client"

import { useState } from "react"
import { experiences, categories, getAllCategories, getExperiencesByCategory } from "@/lib/experiences-data"
import { Button } from "@/components/ui/button"
import { Check, Send, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ExperiencesPage() {
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dates: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleToggle = (id: string) => {
    setSelectedExperiences((prev) =>
      prev.includes(id) ? prev.filter((expId) => expId !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/experience-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          experiences: selectedExperiences,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to send inquiry. Please try again.")
      }
    } catch {
      setError("Failed to send inquiry. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-4">
            Thank You!
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            We've received your experience inquiry. Our concierge team will be in touch
            within 24 hours to discuss availability and pricing for your selected experiences.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Casa Vistas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Casa Vistas
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-4">
            Curated <span className="italic">Experiences</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Make your stay unforgettable with our hand-picked local experiences.
            Select what interests you and we'll handle the rest.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Experience Selection */}
          <div className="lg:col-span-2 space-y-12">
            {getAllCategories().map((categoryKey) => {
              const category = categories[categoryKey]
              const categoryExperiences = getExperiencesByCategory(categoryKey)

              if (categoryExperiences.length === 0) return null

              return (
                <section key={categoryKey}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{category.icon}</span>
                    <div>
                      <h2 className="font-serif text-2xl font-light text-foreground">
                        {category.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {categoryExperiences.map((experience) => {
                      const isSelected = selectedExperiences.includes(experience.id)
                      return (
                        <button
                          key={experience.id}
                          onClick={() => handleToggle(experience.id)}
                          className={cn(
                            "w-full text-left p-4 rounded-xl border transition-all duration-300",
                            isSelected
                              ? "bg-primary/5 border-primary shadow-sm"
                              : "bg-card border-border hover:border-primary/30 hover:bg-accent/30"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground mb-1">
                                {experience.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {experience.description}
                              </p>
                              {experience.duration && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Duration: {experience.duration}
                                </p>
                              )}
                            </div>
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground/30"
                              )}
                            >
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary-foreground" />
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-card rounded-2xl border shadow-sm p-6">
                <h3 className="font-serif text-xl font-light text-foreground mb-2">
                  Interested?
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Tell us about your trip and we'll coordinate everything for you.
                </p>

                {selectedExperiences.length > 0 && (
                  <div className="mb-6 p-4 bg-accent/30 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Selected ({selectedExperiences.length}):
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {selectedExperiences.map((id) => {
                        const exp = experiences.find((e) => e.id === id)
                        return <li key={id}>• {exp?.name}</li>
                      })}
                    </ul>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Travel Dates *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dates}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, dates: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Dec 20-27, 2025"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Additional Details
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, message: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      placeholder="Group size, special requests, etc."
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || selectedExperiences.length === 0}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Inquiry
                      </>
                    )}
                  </Button>

                  {selectedExperiences.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Select at least one experience to continue
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
