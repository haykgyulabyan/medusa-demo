import type { Cart, Product, ShippingOption, PromoCode, TaxRate, Region } from "../domain/types"
import { createSupabaseStore } from "./supabase-store"
import { createSqliteStore } from "./sqlite-store"

// The interface every backing store must implement. The rest of the app
// (commands, queries, routes) talks to this shape only — it never knows or
// cares whether it's hitting Supabase or a local SQLite file.
export type Store = {
  carts: {
    get(id: string): Promise<Cart | undefined>
    set(id: string, cart: Cart): Promise<void>
  }
  products: {
    getAll(): Promise<Product[]>
    getByVariantId(variantId: string): Promise<Product | undefined>
  }
  shippingOptions: {
    getAll(): Promise<ShippingOption[]>
    get(id: string): Promise<ShippingOption | undefined>
  }
  promoCodes: {
    get(code: string): Promise<PromoCode | undefined>
  }
  taxRates: {
    getAll(): Promise<TaxRate[]>
  }
  regions: {
    getAll(): Promise<Region[]>
  }
}

// Backend selection:
//   - SUPABASE_URL set (Vercel prod, or local with `vercel env pull`) → Supabase
//   - SUPABASE_URL unset (the default local clone)                    → SQLite
export const store: Store = process.env.SUPABASE_URL
  ? createSupabaseStore()
  : createSqliteStore()
