"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Mail, Phone, MessageSquare } from "lucide-react"
import Link from "next/link"

export function BookingSummary() {
  return (
    <Card className="p-6 sticky top-24">
      <h2 className="text-xl font-semibold text-foreground mb-6">Guest Information</h2>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="guests" className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Number of Guests
          </Label>
          <Input id="guests" type="number" min="1" max="10" defaultValue="2" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" type="text" placeholder="John Doe" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Email Address
          </Label>
          <Input id="email" type="email" placeholder="john@example.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Phone Number
          </Label>
          <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Special Requests (Optional)
          </Label>
          <textarea
            id="message"
            rows={4}
            placeholder="Any special requests or questions?"
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
          />
        </div>

        <div className="pt-4 border-t space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">$0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cleaning Fee</span>
            <span className="font-medium text-foreground">$200</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service Fee</span>
            <span className="font-medium text-foreground">$0</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-3 border-t">
            <span className="text-foreground">Total</span>
            <span className="text-primary">$200</span>
          </div>
        </div>

        <Link href="/checkout" className="block w-full">
          <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Continue to Checkout
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground text-center">
          You won't be charged yet. Review your booking details on the next page.
        </p>
      </form>
    </Card>
  )
}
