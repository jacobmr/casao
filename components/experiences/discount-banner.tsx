"use client"

import { Sparkles, TrendingUp, PartyPopper } from "lucide-react"

interface DiscountBannerProps {
  selectedCount: number
  lodgingTotal?: number
}

export function DiscountBanner({ selectedCount, lodgingTotal = 0 }: DiscountBannerProps) {
  const discountApplies = selectedCount >= 2
  const discountAmount = discountApplies ? lodgingTotal * 0.05 : 0
  
  if (selectedCount === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              Special Offer: Save 5% on Your Stay
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Select 2 or more experiences to unlock your discount on lodging
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (selectedCount === 1) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              You're almost there!
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Select 1 more experience to save 5% on your lodging
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <PartyPopper className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
            <span>🎉</span> Discount Unlocked!
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            You've selected {selectedCount} experiences — Save{' '}
            {lodgingTotal > 0 && `$${discountAmount.toFixed(2)} `}
            (5%) on your lodging!
          </p>
        </div>
      </div>
    </div>
  )
}
