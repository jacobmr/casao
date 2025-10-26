"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Building2, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

type PaymentMethod = "card" | "bank" | "paypal"

export function PaymentMethods() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card")

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Payment Method</h2>
      </div>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setSelectedMethod("card")}
          className={cn(
            "p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all",
            selectedMethod === "card"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent",
          )}
        >
          <CreditCard className={cn("h-6 w-6", selectedMethod === "card" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-medium", selectedMethod === "card" ? "text-primary" : "text-foreground")}>
            Credit Card
          </span>
        </button>

        <button
          onClick={() => setSelectedMethod("bank")}
          className={cn(
            "p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all",
            selectedMethod === "bank"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent",
          )}
        >
          <Building2 className={cn("h-6 w-6", selectedMethod === "bank" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-medium", selectedMethod === "bank" ? "text-primary" : "text-foreground")}>
            Bank Transfer
          </span>
        </button>

        <button
          onClick={() => setSelectedMethod("paypal")}
          className={cn(
            "p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all",
            selectedMethod === "paypal"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent",
          )}
        >
          <Wallet className={cn("h-6 w-6", selectedMethod === "paypal" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-medium", selectedMethod === "paypal" ? "text-primary" : "text-foreground")}>
            PayPal
          </span>
        </button>
      </div>

      {/* Credit Card Form */}
      {selectedMethod === "card" && (
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input id="cardNumber" type="text" placeholder="1234 5678 9012 3456" maxLength={19} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input id="cardName" type="text" placeholder="John Doe" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" type="text" placeholder="MM/YY" maxLength={5} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" type="text" placeholder="123" maxLength={4} required />
            </div>
          </div>
        </form>
      )}

      {/* Bank Transfer Info */}
      {selectedMethod === "bank" && (
        <div className="p-4 bg-accent/50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-foreground">Bank Transfer Instructions</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Bank Name:</strong> Costa Rica National Bank
            </p>
            <p>
              <strong className="text-foreground">Account Number:</strong> 1234567890
            </p>
            <p>
              <strong className="text-foreground">SWIFT Code:</strong> CRNBCRSX
            </p>
            <p>
              <strong className="text-foreground">Reference:</strong> Your booking confirmation number
            </p>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Please allow 2-3 business days for the transfer to be processed. Your booking will be confirmed once payment
            is received.
          </p>
        </div>
      )}

      {/* PayPal Info */}
      {selectedMethod === "paypal" && (
        <div className="p-4 bg-accent/50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-foreground">PayPal Payment</p>
          <p className="text-sm text-muted-foreground">
            You will be redirected to PayPal to complete your payment securely. Please have your PayPal account ready.
          </p>
          <div className="pt-3">
            <button className="w-full py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-lg transition-colors">
              Continue with PayPal
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
