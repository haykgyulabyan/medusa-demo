import type { Product, ShippingOption, PromoCode, TaxRate, Region } from "../domain/types"

// Reference data shipped with the SQLite store. Mirrors what lives in the
// production Supabase tables, so the local demo behaves the same as the
// deployed app on first run.

export const seedProducts: Product[] = [
  { id: "prod-001", title: "Blue Tee", variantId: "var-001", unitPrice: 3000, requiresShipping: true },
  { id: "prod-002", title: "Coffee Mug", variantId: "var-002", unitPrice: 1500, requiresShipping: true },
  { id: "prod-003", title: "Gift Card $50", variantId: "var-003", unitPrice: 5000, requiresShipping: false },
  { id: "prod-004", title: "Hoodie", variantId: "var-004", unitPrice: 6000, requiresShipping: true },
  { id: "prod-005", title: "Sticker Pack", variantId: "var-005", unitPrice: 500, requiresShipping: true },
]

export const seedShippingOptions: ShippingOption[] = [
  { id: "opt-001", name: "Standard Shipping", amount: 600 },
  { id: "opt-002", name: "Express Shipping", amount: 1300 },
]

export const seedPromoCodes: PromoCode[] = [
  { code: "SAVE5", type: "fixed", amount: 500, description: "$5 off per item" },
  { code: "VIP10", type: "percentage", amount: 10, description: "10% off" },
  { code: "FREESHIP", type: "free_shipping", amount: 0, description: "Free shipping" },
]

export const seedTaxRates: TaxRate[] = [
  { code: "VAT", rate: 0.20, description: "20% VAT", appliesTo: "all" },
  { code: "ECO", rate: 0.02, description: "2% Eco Tax", appliesTo: "physical" },
  { code: "DIGITAL", rate: 0.05, description: "5% Digital Services Tax", appliesTo: "digital" },
]

export const seedRegions: Region[] = [
  { id: "reg-001", name: "North America", currencyCode: "usd" },
]
