import { createClient } from "@supabase/supabase-js"
import type { Cart, Product, ShippingOption, PromoCode, TaxRate, Region } from "../domain/types"
import type { Store } from "./store"

export const createSupabaseStore = (): Store => {
  // Client is created lazily inside the factory so that importing this module
  // does not require SUPABASE_URL to be set. The store selector in store.ts
  // imports both backends eagerly (ESM rules) and only calls the factory it
  // actually wants — so the SQLite path must not blow up at import time.
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.STORAGE_URL ?? "",
    process.env.SUPABASE_ANON_KEY ?? process.env.STORAGE_ANON_KEY ?? ""
  )

  return {
    carts: {
    async get(id: string): Promise<Cart | undefined> {
      const { data } = await supabase
        .from("carts")
        .select("data")
        .eq("id", id)
        .single()
      return data?.data as Cart | undefined
    },

    async set(id: string, cart: Cart): Promise<void> {
      await supabase.from("carts").upsert({ id, data: cart })
    },
  },

  products: {
    async getAll(): Promise<Product[]> {
      const { data } = await supabase.from("products").select("*")
      return (data ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        variantId: p.variant_id,
        unitPrice: p.unit_price,
        requiresShipping: p.requires_shipping,
      }))
    },

    async getByVariantId(variantId: string): Promise<Product | undefined> {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("variant_id", variantId)
        .single()
      if (!data) return undefined
      return {
        id: data.id,
        title: data.title,
        variantId: data.variant_id,
        unitPrice: data.unit_price,
        requiresShipping: data.requires_shipping,
      }
    },
  },

  shippingOptions: {
    async getAll(): Promise<ShippingOption[]> {
      const { data } = await supabase.from("shipping_options").select("*")
      return (data ?? []) as ShippingOption[]
    },

    async get(id: string): Promise<ShippingOption | undefined> {
      const { data } = await supabase
        .from("shipping_options")
        .select("*")
        .eq("id", id)
        .single()
      return data as ShippingOption | undefined
    },
  },

  promoCodes: {
    async get(code: string): Promise<PromoCode | undefined> {
      const { data } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .single()
      return data as PromoCode | undefined
    },
  },

  taxRates: {
    async getAll(): Promise<TaxRate[]> {
      const { data } = await supabase.from("tax_rates").select("*")
      return (data ?? []).map((tr) => ({
        code: tr.code,
        rate: Number(tr.rate),
        description: tr.description,
        appliesTo: tr.applies_to,
      }))
    },
  },

  regions: {
    async getAll(): Promise<Region[]> {
      const { data } = await supabase.from("regions").select("*")
      return (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        currencyCode: r.currency_code,
      }))
    },
  },
  }
}
