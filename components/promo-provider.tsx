"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import { getPromoCode, PromoCode } from "@/lib/promo-codes"

interface PromoContextType {
  promo: PromoCode | null
  promoParam: string | null
}

const PromoContext = createContext<PromoContextType>({
  promo: null,
  promoParam: null,
})

export function usePromo() {
  return useContext(PromoContext)
}

export function PromoProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const [promo, setPromo] = useState<PromoCode | null>(null)
  const [promoParam, setPromoParam] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get("promo")
    if (code) {
      const promoCode = getPromoCode(code)
      setPromo(promoCode)
      setPromoParam(code)

      // Store in sessionStorage so it persists during the session
      if (promoCode) {
        sessionStorage.setItem("casavistas_promo", code)
      }
    } else {
      // Check sessionStorage for existing promo
      const stored = sessionStorage.getItem("casavistas_promo")
      if (stored) {
        const promoCode = getPromoCode(stored)
        setPromo(promoCode)
        setPromoParam(stored)
      }
    }
  }, [searchParams])

  return (
    <PromoContext.Provider value={{ promo, promoParam }}>
      {children}
    </PromoContext.Provider>
  )
}

// Banner component to show active promo
export function PromoBanner() {
  const { promo } = usePromo()

  if (!promo) return null

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm font-medium">
      <span className="inline-flex items-center gap-2">
        🎉 {promo.label} applied! Use code <code className="bg-white/20 px-2 py-0.5 rounded font-mono">{promo.code}</code> at checkout
      </span>
    </div>
  )
}
