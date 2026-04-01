import type { Cart, Product, ShippingOption, PromoCode, TaxRate, Region } from "../domain/types.js"

const carts = new Map<string, Cart>()
const products: Product[] = []
const shippingOptions: ShippingOption[] = []
const promoCodes: PromoCode[] = []
const taxRates: TaxRate[] = []
const regions: Region[] = []

export const store = {
  carts: {
    get: (id: string) => carts.get(id),
    set: (id: string, cart: Cart) => { carts.set(id, cart) },
    has: (id: string) => carts.has(id),
  },
  products: {
    getAll: () => products,
    getByVariantId: (variantId: string) => products.find((p) => p.variantId === variantId),
    getById: (id: string) => products.find((p) => p.id === id),
    seed: (items: Product[]) => { products.push(...items) },
  },
  shippingOptions: {
    getAll: () => shippingOptions,
    get: (id: string) => shippingOptions.find((o) => o.id === id),
    seed: (items: ShippingOption[]) => { shippingOptions.push(...items) },
  },
  promoCodes: {
    get: (code: string) => promoCodes.find((p) => p.code === code),
    seed: (items: PromoCode[]) => { promoCodes.push(...items) },
  },
  taxRates: {
    getAll: () => taxRates,
    seed: (items: TaxRate[]) => { taxRates.push(...items) },
  },
  regions: {
    get: (id: string) => regions.find((r) => r.id === id),
    getAll: () => regions,
    seed: (items: Region[]) => { regions.push(...items) },
  },
}
