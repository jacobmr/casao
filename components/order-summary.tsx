"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Home, Shield, CheckCircle2 } from "lucide-react"

export function OrderSummary() {
  return (
    <Card className="p-6 sticky top-24">
      <h2 className="text-xl font-semibold text-foreground mb-6">Booking Summary</h2>

      {/* Property Info */}
      <div className="mb-6 pb-6 border-b">
        <div className="flex items-start gap-3 mb-4">
          <Home className="h-5 w-5 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">Casa Vistas</h3>
            <p className="text-sm text-muted-foreground">Luxury Villa in Costa Rica</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Check-in:</span>
            <span className="font-medium text-foreground">Nov 10, 2025</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Check-out:</span>
            <span className="font-medium text-foreground">Nov 17, 2025</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Guests:</span>
            <span className="font-medium text-foreground">4 guests</span>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6 pb-6 border-b">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">$750 x 7 nights</span>
          <span className="font-medium text-foreground">$5,250</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Cleaning fee</span>
          <span className="font-medium text-foreground">$200</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service fee</span>
          <span className="font-medium text-foreground">$315</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Taxes</span>
          <span className="font-medium text-foreground">$576.50</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between text-lg font-bold mb-6 pb-6 border-b">
        <span className="text-foreground">Total (USD)</span>
        <span className="text-primary">$6,341.50</span>
      </div>

      {/* Security Features */}
      <div className="space-y-3 mb-6">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-primary mt-0.5" />
          <p className="text-xs text-muted-foreground">Your payment information is encrypted and secure</p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
          <p className="text-xs text-muted-foreground">Free cancellation up to 48 hours before check-in</p>
        </div>
      </div>

      {/* Complete Booking Button */}
      <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-3">
        Complete Booking
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By completing this booking, you agree to our Terms of Service and Privacy Policy
      </p>
    </Card>
  )
}
