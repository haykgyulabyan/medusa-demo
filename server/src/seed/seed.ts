import { store } from "../store/store.js"

export const seed = () => {
  store.products.seed([
    { id: "prod-001", title: "Blue Tee", variantId: "var-001", unitPrice: 3000, requiresShipping: true },
    { id: "prod-002", title: "Coffee Mug", variantId: "var-002", unitPrice: 1500, requiresShipping: true },
    { id: "prod-003", title: "Gift Card $50", variantId: "var-003", unitPrice: 5000, requiresShipping: false },
    { id: "prod-004", title: "Hoodie", variantId: "var-004", unitPrice: 6000, requiresShipping: true },
    { id: "prod-005", title: "Sticker Pack", variantId: "var-005", unitPrice: 500, requiresShipping: true },
  ])

  store.shippingOptions.seed([
    { id: "opt-001", name: "Standard Shipping", amount: 600 },
    { id: "opt-002", name: "Express Shipping", amount: 1300 },
  ])

  store.promoCodes.seed([
    { code: "SAVE5", type: "fixed", amount: 500, description: "$5 off per item" },
    { code: "VIP10", type: "percentage", amount: 10, description: "10% off" },
    { code: "FREESHIP", type: "free_shipping", amount: 0, description: "Free shipping" },
  ])

  store.taxRates.seed([
    { code: "VAT", rate: 0.20, description: "20% VAT" },
  ])

  store.regions.seed([
    { id: "reg-001", name: "North America", currencyCode: "usd" },
  ])
}
