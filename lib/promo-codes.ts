// Promo code configuration
// These codes must match what's configured in Blue Zone's Guesty

export interface PromoCode {
  code: string
  discount: number // percentage (0.20 = 20%)
  label: string
  description?: string
}

export const PROMO_CODES: Record<string, PromoCode> = {
  CASAO20: {
    code: "CasaO20",
    discount: 0.20,
    label: "20% Off",
    description: "20% discount on accommodation",
  },
  CASAO30: {
    code: "CasaO30",
    discount: 0.30,
    label: "30% Off",
    description: "30% discount on accommodation",
  },
  CASAO40: {
    code: "CasaO40",
    discount: 0.40,
    label: "40% Off",
    description: "40% discount on accommodation",
  },
  CASAO50: {
    code: "CasaO50",
    discount: 0.50,
    label: "50% Off",
    description: "50% discount on accommodation",
  },
  // Aliases for URL-friendly versions
  FRIENDS20: {
    code: "CasaO20",
    discount: 0.20,
    label: "Friends & Family 20% Off",
    description: "Special rate for friends and family",
  },
  FRIENDS30: {
    code: "CasaO30",
    discount: 0.30,
    label: "Friends & Family 30% Off",
    description: "Special rate for friends and family",
  },
}

export function getPromoCode(code: string | null | undefined): PromoCode | null {
  if (!code) return null
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "")
  return PROMO_CODES[normalized] || null
}

export function calculateDiscountedPrice(price: number, promo: PromoCode | null): number {
  if (!promo) return price
  return price * (1 - promo.discount)
}
