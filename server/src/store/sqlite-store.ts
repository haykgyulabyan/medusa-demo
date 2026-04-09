import Database from "better-sqlite3"
import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import type { Cart, Product, ShippingOption, PromoCode, TaxRate, Region } from "../domain/types"
import {
  seedProducts,
  seedShippingOptions,
  seedPromoCodes,
  seedTaxRates,
  seedRegions,
} from "./seed-data"
import type { Store } from "./store"

const DB_PATH = resolve(process.cwd(), "data", "cart.db")

export const createSqliteStore = (): Store => {
  mkdirSync(dirname(DB_PATH), { recursive: true })
  const db = new Database(DB_PATH)
  db.pragma("journal_mode = WAL")

  db.exec(`
    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      requires_shipping INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shipping_options (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tax_rates (
      code TEXT PRIMARY KEY,
      rate REAL NOT NULL,
      description TEXT NOT NULL,
      applies_to TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS regions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      currency_code TEXT NOT NULL
    );
  `)

  // Seed reference data on first run (carts table is left empty).
  const productCount = (db.prepare("SELECT COUNT(*) AS c FROM products").get() as { c: number }).c
  if (productCount === 0) {
    const insertProduct = db.prepare(
      "INSERT INTO products (id, title, variant_id, unit_price, requires_shipping) VALUES (?, ?, ?, ?, ?)"
    )
    const insertShipping = db.prepare(
      "INSERT INTO shipping_options (id, name, amount) VALUES (?, ?, ?)"
    )
    const insertPromo = db.prepare(
      "INSERT INTO promo_codes (code, type, amount, description) VALUES (?, ?, ?, ?)"
    )
    const insertTax = db.prepare(
      "INSERT INTO tax_rates (code, rate, description, applies_to) VALUES (?, ?, ?, ?)"
    )
    const insertRegion = db.prepare(
      "INSERT INTO regions (id, name, currency_code) VALUES (?, ?, ?)"
    )

    const seed = db.transaction(() => {
      for (const p of seedProducts) {
        insertProduct.run(p.id, p.title, p.variantId, p.unitPrice, p.requiresShipping ? 1 : 0)
      }
      for (const s of seedShippingOptions) insertShipping.run(s.id, s.name, s.amount)
      for (const p of seedPromoCodes) insertPromo.run(p.code, p.type, p.amount, p.description)
      for (const t of seedTaxRates) insertTax.run(t.code, t.rate, t.description, t.appliesTo)
      for (const r of seedRegions) insertRegion.run(r.id, r.name, r.currencyCode)
    })
    seed()
  }

  const rowToProduct = (row: any): Product => ({
    id: row.id,
    title: row.title,
    variantId: row.variant_id,
    unitPrice: row.unit_price,
    requiresShipping: !!row.requires_shipping,
  })

  return {
    carts: {
      async get(id: string): Promise<Cart | undefined> {
        const row = db.prepare("SELECT data FROM carts WHERE id = ?").get(id) as
          | { data: string }
          | undefined
        return row ? (JSON.parse(row.data) as Cart) : undefined
      },
      async set(id: string, cart: Cart): Promise<void> {
        db.prepare(
          "INSERT INTO carts (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data"
        ).run(id, JSON.stringify(cart))
      },
    },

    products: {
      async getAll(): Promise<Product[]> {
        const rows = db.prepare("SELECT * FROM products").all() as any[]
        return rows.map(rowToProduct)
      },
      async getByVariantId(variantId: string): Promise<Product | undefined> {
        const row = db.prepare("SELECT * FROM products WHERE variant_id = ?").get(variantId) as any
        return row ? rowToProduct(row) : undefined
      },
    },

    shippingOptions: {
      async getAll(): Promise<ShippingOption[]> {
        return db.prepare("SELECT * FROM shipping_options").all() as ShippingOption[]
      },
      async get(id: string): Promise<ShippingOption | undefined> {
        return db.prepare("SELECT * FROM shipping_options WHERE id = ?").get(id) as
          | ShippingOption
          | undefined
      },
    },

    promoCodes: {
      async get(code: string): Promise<PromoCode | undefined> {
        return db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(code) as
          | PromoCode
          | undefined
      },
    },

    taxRates: {
      async getAll(): Promise<TaxRate[]> {
        const rows = db.prepare("SELECT * FROM tax_rates").all() as any[]
        return rows.map((tr) => ({
          code: tr.code,
          rate: Number(tr.rate),
          description: tr.description,
          appliesTo: tr.applies_to,
        }))
      },
    },

    regions: {
      async getAll(): Promise<Region[]> {
        const rows = db.prepare("SELECT * FROM regions").all() as any[]
        return rows.map((r) => ({
          id: r.id,
          name: r.name,
          currencyCode: r.currency_code,
        }))
      },
    },
  }
}
