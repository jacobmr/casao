import { Card } from "@/components/ui/card"
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react"

const pricingTiers = [
  { season: "Peak Season", months: "Dec - Apr", price: 850, icon: TrendingUp, color: "text-destructive" },
  { season: "High Season", months: "Jul - Aug", price: 750, icon: TrendingUp, color: "text-secondary" },
  { season: "Low Season", months: "May - Jun, Sep - Nov", price: 650, icon: TrendingDown, color: "text-primary" },
]

export function PricingCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Nightly Rates</h2>
      </div>

      <div className="space-y-4">
        {pricingTiers.map((tier) => (
          <div key={tier.season} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
            <div className="flex items-center gap-3">
              <tier.icon className={cn("h-5 w-5", tier.color)} />
              <div>
                <p className="font-semibold text-foreground">{tier.season}</p>
                <p className="text-sm text-muted-foreground">{tier.months}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">${tier.price}</p>
              <p className="text-sm text-muted-foreground">per night</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
        <p className="text-sm font-medium text-foreground">Additional Information</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Minimum stay: 3 nights</li>
          <li>• Minimum stay during holidays: 7 nights</li>
          <li>• Cleaning fee: $200</li>
          <li>• Security deposit: $500 (refundable)</li>
        </ul>
      </div>
    </Card>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
