import express from "express"
import cors from "cors"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_ANON_KEY ?? ""
)

// ─── Domain types ────────────────────────────────────────────────

type Address = {
  customerId?: string; firstName?: string; lastName?: string
  company?: string; address1?: string; address2?: string
  city?: string; countryCode?: string; province?: string
  postalCode?: string; phone?: string
}

type LineItemAdjustment = {
  id: string; amount: number; code?: string; isTaxInclusive?: boolean
  description?: string; promotionId?: string; providerId?: string
}

type LineItemTaxLine = {
  id: string; code: string; rate: number; description?: string
  taxRateId?: string; providerId?: string
}

type ShippingMethodAdjustment = {
  id: string; amount: number; code?: string; description?: string
  promotionId?: string; providerId?: string
}

type ShippingMethodTaxLine = {
  id: string; code: string; rate: number; description?: string
  taxRateId?: string; providerId?: string
}

type LineItem = {
  id: string; title: string; quantity: number; variantId?: string
  productId?: string; requiresShipping: boolean; isDiscountable: boolean
  isGiftcard: boolean; isTaxInclusive: boolean; isCustomPrice: boolean
  unitPrice: number; adjustments: LineItemAdjustment[]
  taxLines: LineItemTaxLine[]; subtotal: number; discountTotal: number
  taxTotal: number; total: number
}

type ShippingMethod = {
  id: string; name: string; amount: number; isTaxInclusive: boolean
  shippingOptionId?: string; adjustments: ShippingMethodAdjustment[]
  taxLines: ShippingMethodTaxLine[]; discountTotal: number
  taxTotal: number; total: number
}

type CreditLine = {
  id: string; amount: number; reference?: string; referenceId?: string
}

type Cart = {
  id: string; regionId?: string; customerId?: string
  salesChannelId?: string; email?: string; locale?: string
  currencyCode: string; shippingAddress?: Address
  billingAddress?: Address; items: LineItem[]
  shippingMethods: ShippingMethod[]; creditLines: CreditLine[]
  appliedPromoCodes: string[]; completedAt?: string
  subtotal: number; itemTotal: number; discountTotal: number
  shippingTotal: number; taxTotal: number; creditLineTotal: number
  total: number
}

type PromoCode = {
  code: string; type: "fixed" | "percentage" | "free_shipping"
  amount: number; description: string
}

// ─── Store ───────────────────────────────────────────────────────

const store = {
  carts: {
    async get(id: string): Promise<Cart | undefined> {
      const { data } = await supabase.from("carts").select("data").eq("id", id).single()
      return data?.data as Cart | undefined
    },
    async set(id: string, cart: Cart) {
      await supabase.from("carts").upsert({ id, data: cart })
    },
  },
  products: {
    async getAll() {
      const { data } = await supabase.from("products").select("*")
      return (data ?? []).map((p: any) => ({
        id: p.id, title: p.title, variantId: p.variant_id,
        unitPrice: p.unit_price, requiresShipping: p.requires_shipping,
      }))
    },
  },
  shippingOptions: {
    async getAll() {
      const { data } = await supabase.from("shipping_options").select("*")
      return data ?? []
    },
    async get(id: string) {
      const { data } = await supabase.from("shipping_options").select("*").eq("id", id).single()
      return data ?? undefined
    },
  },
  promoCodes: {
    async get(code: string): Promise<PromoCode | undefined> {
      const { data } = await supabase.from("promo_codes").select("*").eq("code", code).single()
      return data as PromoCode | undefined
    },
  },
  taxRates: {
    async getAll() {
      const { data } = await supabase.from("tax_rates").select("*")
      return (data ?? []).map((tr: any) => ({
        code: tr.code, rate: Number(tr.rate), description: tr.description, appliesTo: tr.applies_to,
      }))
    },
  },
  regions: {
    async getAll() {
      const { data } = await supabase.from("regions").select("*")
      return (data ?? []).map((r: any) => ({
        id: r.id, name: r.name, currencyCode: r.currency_code,
      }))
    },
  },
}

// ─── Event bus ───────────────────────────────────────────────────

type EventHandler = (payload: unknown) => void
const handlers = new Map<string, EventHandler[]>()
const eventBus = {
  emit(event: string, payload: unknown) {
    for (const h of handlers.get(event) ?? []) h(payload)
  },
}

// ─── Recalculate pricing ─────────────────────────────────────────

const recalculateCartPricing = async (cartId: string) => {
  const cart = await store.carts.get(cartId)
  if (!cart) throw new Error(`Cart ${cartId} not found`)

  const taxRates = await store.taxRates.getAll()
  const appliedPromos = (await Promise.all(
    cart.appliedPromoCodes.map((code) => store.promoCodes.get(code))
  )).filter(Boolean) as PromoCode[]

  const hasFreeShipping = appliedPromos.some((p) => p.type === "free_shipping")

  for (const item of cart.items) {
    const adjustments: LineItemAdjustment[] = []
    if (item.isDiscountable) {
      for (const promo of appliedPromos) {
        if (promo.type === "fixed") {
          adjustments.push({ id: crypto.randomUUID(), amount: promo.amount, code: promo.code, description: promo.description, promotionId: promo.code })
        } else if (promo.type === "percentage") {
          adjustments.push({ id: crypto.randomUUID(), amount: Math.round((item.unitPrice * item.quantity * promo.amount) / 100), code: promo.code, description: promo.description, promotionId: promo.code })
        }
      }
    }
    item.adjustments = adjustments
    const applicableTaxRates = taxRates.filter((tr: any) => tr.appliesTo === "all" || (tr.appliesTo === "physical" && item.requiresShipping) || (tr.appliesTo === "digital" && !item.requiresShipping))
    item.taxLines = applicableTaxRates.map((tr: any) => ({ id: crypto.randomUUID(), code: tr.code, rate: Number(tr.rate), description: tr.description, taxRateId: tr.code }))
    item.subtotal = item.unitPrice * item.quantity
    item.discountTotal = Math.min(item.adjustments.reduce((s, a) => s + a.amount, 0), item.subtotal)
    item.taxTotal = Math.round((item.subtotal - item.discountTotal) * item.taxLines.reduce((s, tl) => s + tl.rate, 0))
    item.total = item.subtotal - item.discountTotal + item.taxTotal
  }

  for (const method of cart.shippingMethods) {
    method.adjustments = hasFreeShipping ? [{ id: crypto.randomUUID(), amount: method.amount, code: "FREESHIP", description: "Free shipping", promotionId: "FREESHIP" }] : []
    const shippingTaxRates = taxRates.filter((tr: any) => tr.appliesTo === "all")
    method.taxLines = shippingTaxRates.map((tr: any) => ({ id: crypto.randomUUID(), code: tr.code, rate: Number(tr.rate), description: tr.description, taxRateId: tr.code }))
    method.discountTotal = Math.min(method.adjustments.reduce((s, a) => s + a.amount, 0), method.amount)
    method.taxTotal = Math.round((method.amount - method.discountTotal) * method.taxLines.reduce((s, tl) => s + tl.rate, 0))
    method.total = method.amount - method.discountTotal + method.taxTotal
  }

  cart.subtotal = cart.items.reduce((s, i) => s + i.subtotal, 0)
  cart.itemTotal = cart.items.reduce((s, i) => s + i.total, 0)
  cart.discountTotal = cart.items.reduce((s, i) => s + i.discountTotal, 0) + cart.shippingMethods.reduce((s, m) => s + m.discountTotal, 0)
  cart.shippingTotal = cart.shippingMethods.reduce((s, m) => s + m.total, 0)
  cart.taxTotal = cart.items.reduce((s, i) => s + i.taxTotal, 0) + cart.shippingMethods.reduce((s, m) => s + m.taxTotal, 0)
  cart.creditLineTotal = cart.creditLines.reduce((s, cl) => s + cl.amount, 0)
  cart.total = cart.itemTotal + cart.shippingTotal - cart.creditLineTotal

  await store.carts.set(cart.id, cart)
  eventBus.emit("CartPricingRecalculated", cart)
}

// ─── Commands ────────────────────────────────────────────────────

const createCart = async (input: any): Promise<Cart> => {
  if (!input.currencyCode) throw new Error("currencyCode is required to create a cart")
  const cart: Cart = {
    id: crypto.randomUUID(), currencyCode: input.currencyCode,
    regionId: input.regionId, customerId: input.customerId,
    salesChannelId: input.salesChannelId, email: input.email,
    locale: input.locale, shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress, items: [], shippingMethods: [],
    creditLines: [], appliedPromoCodes: [], subtotal: 0, itemTotal: 0,
    discountTotal: 0, shippingTotal: 0, taxTotal: 0, creditLineTotal: 0, total: 0,
  }
  await store.carts.set(cart.id, cart)
  eventBus.emit("CartCreated", cart)
  await recalculateCartPricing(cart.id)
  return (await store.carts.get(cart.id))!
}

const updateCart = async (input: any): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) throw new Error(`Cart ${input.id} not found`)
  if (input.regionId !== undefined) cart.regionId = input.regionId
  if (input.customerId !== undefined) cart.customerId = input.customerId
  if (input.salesChannelId !== undefined) cart.salesChannelId = input.salesChannelId
  if (input.email !== undefined) cart.email = input.email
  if (input.locale !== undefined) cart.locale = input.locale
  if (input.shippingAddress !== undefined) cart.shippingAddress = input.shippingAddress
  if (input.billingAddress !== undefined) cart.billingAddress = input.billingAddress
  if (input.promoCode) {
    const promo = await store.promoCodes.get(input.promoCode)
    if (!promo) throw new Error(`Promo code "${input.promoCode}" not found`)
    if (!cart.appliedPromoCodes.includes(input.promoCode)) cart.appliedPromoCodes.push(input.promoCode)
  }
  if (input.removePromoCode) cart.appliedPromoCodes = cart.appliedPromoCodes.filter((c: string) => c !== input.removePromoCode)
  await store.carts.set(cart.id, cart)
  eventBus.emit("CartUpdated", cart)
  await recalculateCartPricing(cart.id)
  return (await store.carts.get(cart.id))!
}

const addCartItem = async (input: any): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) throw new Error(`Cart ${input.id} not found`)
  if (!input.lineItem.quantity || input.lineItem.quantity <= 0) throw new Error("Line item quantity must be greater than zero")
  if (!input.lineItem.title || input.lineItem.unitPrice === undefined) throw new Error("Line item must have a title and unitPrice")
  const item: LineItem = {
    id: crypto.randomUUID(), title: input.lineItem.title, quantity: input.lineItem.quantity,
    variantId: input.lineItem.variantId, productId: input.lineItem.productId,
    requiresShipping: input.lineItem.requiresShipping ?? true, isDiscountable: input.lineItem.isDiscountable ?? true,
    isGiftcard: input.lineItem.isGiftcard ?? false, isTaxInclusive: input.lineItem.isTaxInclusive ?? false,
    isCustomPrice: input.lineItem.isCustomPrice ?? false, unitPrice: input.lineItem.unitPrice,
    adjustments: [], taxLines: [], subtotal: 0, discountTotal: 0, taxTotal: 0, total: 0,
  }
  cart.items.push(item)
  await store.carts.set(cart.id, cart)
  eventBus.emit("CartItemAdded", { cart, item })
  await recalculateCartPricing(cart.id)
  return (await store.carts.get(cart.id))!
}

const updateCartItem = async (input: any): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) throw new Error(`Cart ${input.id} not found`)
  const item = cart.items.find((i: LineItem) => i.id === input.lineItemId)
  if (!item) throw new Error(`Line item ${input.lineItemId} not found in cart ${input.id}`)
  if (input.quantity !== undefined) { if (input.quantity <= 0) throw new Error("Quantity must be greater than zero"); item.quantity = input.quantity }
  if (input.isCustomPrice !== undefined) item.isCustomPrice = input.isCustomPrice
  if (input.unitPrice !== undefined) item.unitPrice = input.unitPrice
  await store.carts.set(cart.id, cart)
  eventBus.emit("CartItemUpdated", { cart, item })
  await recalculateCartPricing(cart.id)
  return (await store.carts.get(cart.id))!
}

const removeCartItem = async (input: any): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) throw new Error(`Cart ${input.id} not found`)
  const idx = cart.items.findIndex((i: LineItem) => i.id === input.lineItemId)
  if (idx === -1) throw new Error(`Line item ${input.lineItemId} not found in cart ${input.id}`)
  cart.items.splice(idx, 1)
  await store.carts.set(cart.id, cart)
  eventBus.emit("CartItemRemoved", cart)
  await recalculateCartPricing(cart.id)
  return (await store.carts.get(cart.id))!
}

const addShippingMethod = async (input: any): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) throw new Error(`Cart ${input.id} not found`)
  if (input.shippingMethod.shippingOptionId) {
    const opt = await store.shippingOptions.get(input.shippingMethod.shippingOptionId)
    if (!opt) throw new Error(`Shipping option ${input.shippingMethod.shippingOptionId} not found`)
  }
  const method: ShippingMethod = {
    id: crypto.randomUUID(), name: input.shippingMethod.name, amount: input.shippingMethod.amount,
    isTaxInclusive: input.shippingMethod.isTaxInclusive ?? false,
    shippingOptionId: input.shippingMethod.shippingOptionId,
    adjustments: [], taxLines: [], discountTotal: 0, taxTotal: 0, total: 0,
  }
  cart.shippingMethods = [method]
  await store.carts.set(cart.id, cart)
  eventBus.emit("CartShippingMethodAdded", { cart, method })
  await recalculateCartPricing(cart.id)
  return (await store.carts.get(cart.id))!
}

const removeShippingMethod = async (input: any): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) throw new Error(`Cart ${input.id} not found`)
  const idx = cart.shippingMethods.findIndex((m: ShippingMethod) => m.id === input.shippingMethodId)
  if (idx === -1) throw new Error(`Shipping method ${input.shippingMethodId} not found`)
  cart.shippingMethods.splice(idx, 1)
  await store.carts.set(cart.id, cart)
  eventBus.emit("CartShippingMethodRemoved", cart)
  await recalculateCartPricing(cart.id)
  return (await store.carts.get(cart.id))!
}

const addCreditLine = async (input: any): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) throw new Error(`Cart ${input.id} not found`)
  if (!input.creditLine.amount || input.creditLine.amount <= 0) throw new Error("Credit line amount must be greater than zero")
  cart.creditLines.push({ id: crypto.randomUUID(), amount: input.creditLine.amount, reference: input.creditLine.reference, referenceId: input.creditLine.referenceId })
  await store.carts.set(cart.id, cart)
  eventBus.emit("CartCreditLineAdded", cart)
  await recalculateCartPricing(cart.id)
  return (await store.carts.get(cart.id))!
}

const removeCreditLine = async (input: any): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) throw new Error(`Cart ${input.id} not found`)
  const idx = cart.creditLines.findIndex((cl: CreditLine) => cl.id === input.creditLineId)
  if (idx === -1) throw new Error(`Credit line ${input.creditLineId} not found`)
  cart.creditLines.splice(idx, 1)
  await store.carts.set(cart.id, cart)
  eventBus.emit("CartCreditLineRemoved", cart)
  await recalculateCartPricing(cart.id)
  return (await store.carts.get(cart.id))!
}

const completeCart = async (input: any): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) throw new Error(`Cart ${input.id} not found`)
  if (cart.completedAt) throw new Error(`Cart ${input.id} is already completed`)
  if (cart.items.length === 0) throw new Error("Cart must have at least one item to complete")
  if (!cart.email) throw new Error("Cart must have an email to complete")
  if (!cart.shippingAddress) throw new Error("Cart must have a shipping address to complete")
  cart.completedAt = new Date().toISOString()
  await store.carts.set(cart.id, cart)
  eventBus.emit("CartCompleted", cart)
  return cart
}

// ─── Queries ─────────────────────────────────────────────────────

const getCartDetails = async (cartId: string) => {
  const cart = await store.carts.get(cartId)
  if (!cart) throw new Error(`Cart ${cartId} not found`)
  return cart
}

const getCartShippingOptions = async (cartId: string) => {
  const cart = await store.carts.get(cartId)
  if (!cart) throw new Error(`Cart ${cartId} not found`)
  const options = await store.shippingOptions.getAll()
  return {
    cartId: cart.id, regionId: cart.regionId, currencyCode: cart.currencyCode,
    shippingAddress: cart.shippingAddress ? { countryCode: cart.shippingAddress.countryCode, province: cart.shippingAddress.province, postalCode: cart.shippingAddress.postalCode, city: cart.shippingAddress.city } : null,
    currentShippingMethods: cart.shippingMethods.map((m) => ({ id: m.id, name: m.name, shippingOptionId: m.shippingOptionId, amount: m.amount })),
    availableOptions: options,
  }
}

const getCheckoutSummary = async (cartId: string) => {
  const cart = await store.carts.get(cartId)
  if (!cart) throw new Error(`Cart ${cartId} not found`)
  return {
    id: cart.id, customerId: cart.customerId, email: cart.email,
    items: cart.items.map((i) => ({ id: i.id, title: i.title, quantity: i.quantity, unitPrice: i.unitPrice, subtotal: i.subtotal, discountTotal: i.discountTotal, taxTotal: i.taxTotal, total: i.total })),
    shippingAddress: cart.shippingAddress ? { firstName: cart.shippingAddress.firstName, lastName: cart.shippingAddress.lastName, address1: cart.shippingAddress.address1, city: cart.shippingAddress.city, countryCode: cart.shippingAddress.countryCode, postalCode: cart.shippingAddress.postalCode } : null,
    shippingMethods: cart.shippingMethods.map((m) => ({ id: m.id, name: m.name, amount: m.amount, total: m.total })),
    appliedPromoCodes: cart.appliedPromoCodes, subtotal: cart.subtotal, discountTotal: cart.discountTotal,
    shippingTotal: cart.shippingTotal, taxTotal: cart.taxTotal, creditLineTotal: cart.creditLineTotal, total: cart.total,
  }
}

// ─── Express app ─────────────────────────────────────────────────

const app = express()
app.use(cors())
app.use(express.json())

const r = express.Router()

r.get("/products", async (_req, res) => { res.json(await store.products.getAll()) })
r.get("/shipping-options", async (_req, res) => { res.json(await store.shippingOptions.getAll()) })

r.post("/carts", async (req, res) => { try { res.status(201).json(await createCart(req.body)) } catch (e: any) { res.status(400).json({ error: e.message }) } })
r.get("/carts/:id", async (req, res) => { try { res.json(await getCartDetails(req.params.id)) } catch (e: any) { res.status(404).json({ error: e.message }) } })
r.put("/carts/:id", async (req, res) => { try { res.json(await updateCart({ id: req.params.id, ...req.body })) } catch (e: any) { res.status(400).json({ error: e.message }) } })
r.post("/carts/:id/items", async (req, res) => { try { res.status(201).json(await addCartItem({ id: req.params.id, lineItem: req.body })) } catch (e: any) { res.status(400).json({ error: e.message }) } })
r.put("/carts/:id/items/:itemId", async (req, res) => { try { res.json(await updateCartItem({ id: req.params.id, lineItemId: req.params.itemId, ...req.body })) } catch (e: any) { res.status(400).json({ error: e.message }) } })
r.delete("/carts/:id/items/:itemId", async (req, res) => { try { res.json(await removeCartItem({ id: req.params.id, lineItemId: req.params.itemId })) } catch (e: any) { res.status(400).json({ error: e.message }) } })
r.post("/carts/:id/shipping-methods", async (req, res) => { try { res.status(201).json(await addShippingMethod({ id: req.params.id, shippingMethod: req.body })) } catch (e: any) { res.status(400).json({ error: e.message }) } })
r.delete("/carts/:id/shipping-methods/:methodId", async (req, res) => { try { res.json(await removeShippingMethod({ id: req.params.id, shippingMethodId: req.params.methodId })) } catch (e: any) { res.status(400).json({ error: e.message }) } })
r.post("/carts/:id/credit-lines", async (req, res) => { try { res.status(201).json(await addCreditLine({ id: req.params.id, creditLine: req.body })) } catch (e: any) { res.status(400).json({ error: e.message }) } })
r.delete("/carts/:id/credit-lines/:creditLineId", async (req, res) => { try { res.json(await removeCreditLine({ id: req.params.id, creditLineId: req.params.creditLineId })) } catch (e: any) { res.status(400).json({ error: e.message }) } })
r.post("/carts/:id/complete", async (req, res) => { try { res.json(await completeCart({ id: req.params.id })) } catch (e: any) { res.status(400).json({ error: e.message }) } })
r.get("/carts/:id/shipping-options", async (req, res) => { try { res.json(await getCartShippingOptions(req.params.id)) } catch (e: any) { res.status(404).json({ error: e.message }) } })
r.get("/carts/:id/checkout-summary", async (req, res) => { try { res.json(await getCheckoutSummary(req.params.id)) } catch (e: any) { res.status(404).json({ error: e.message }) } })

app.use("/api", r)

export default app
