import { store } from "../store/store"
import { eventBus, DomainEvents } from "../events/event-bus"
import type {
  LineItemAdjustment,
  LineItemTaxLine,
  ShippingMethodAdjustment,
  ShippingMethodTaxLine,
} from "../domain/types"

export const recalculateCartPricing = async (cartId: string): Promise<void> => {
  const cart = await store.carts.get(cartId)
  if (!cart) {
    throw new Error(`Cart ${cartId} not found`)
  }

  const taxRates = await store.taxRates.getAll()
  const appliedPromos = (
    await Promise.all(
      cart.appliedPromoCodes.map((code) => store.promoCodes.get(code))
    )
  ).filter(Boolean)

  const hasFreeShipping = appliedPromos.some((p) => p!.type === "free_shipping")

  for (const item of cart.items) {
    const adjustments: LineItemAdjustment[] = []
    if (item.isDiscountable) {
      for (const promo of appliedPromos) {
        if (!promo) continue
        if (promo.type === "fixed") {
          adjustments.push({
            id: crypto.randomUUID(),
            amount: promo.amount,
            code: promo.code,
            description: promo.description,
            promotionId: promo.code,
          })
        } else if (promo.type === "percentage") {
          const discountAmount = Math.round(
            (item.unitPrice * item.quantity * promo.amount) / 100
          )
          adjustments.push({
            id: crypto.randomUUID(),
            amount: discountAmount,
            code: promo.code,
            description: promo.description,
            promotionId: promo.code,
          })
        }
      }
    }
    item.adjustments = adjustments

    const itemTaxLines: LineItemTaxLine[] = taxRates.map((tr) => ({
      id: crypto.randomUUID(),
      code: tr.code,
      rate: tr.rate,
      description: tr.description,
      taxRateId: tr.code,
    }))
    item.taxLines = itemTaxLines

    item.subtotal = item.unitPrice * item.quantity
    item.discountTotal = item.adjustments.reduce((sum, a) => sum + a.amount, 0)
    item.discountTotal = Math.min(item.discountTotal, item.subtotal)
    const taxableAmount = item.subtotal - item.discountTotal
    item.taxTotal = Math.round(
      taxableAmount * item.taxLines.reduce((sum, tl) => sum + tl.rate, 0)
    )
    item.total = item.subtotal - item.discountTotal + item.taxTotal
  }

  for (const method of cart.shippingMethods) {
    const smAdjustments: ShippingMethodAdjustment[] = []
    if (hasFreeShipping) {
      smAdjustments.push({
        id: crypto.randomUUID(),
        amount: method.amount,
        code: "FREESHIP",
        description: "Free shipping",
        promotionId: "FREESHIP",
      })
    }
    method.adjustments = smAdjustments

    const smTaxLines: ShippingMethodTaxLine[] = taxRates.map((tr) => ({
      id: crypto.randomUUID(),
      code: tr.code,
      rate: tr.rate,
      description: tr.description,
      taxRateId: tr.code,
    }))
    method.taxLines = smTaxLines

    method.discountTotal = method.adjustments.reduce((sum, a) => sum + a.amount, 0)
    method.discountTotal = Math.min(method.discountTotal, method.amount)
    const taxableShipping = method.amount - method.discountTotal
    method.taxTotal = Math.round(
      taxableShipping * method.taxLines.reduce((sum, tl) => sum + tl.rate, 0)
    )
    method.total = method.amount - method.discountTotal + method.taxTotal
  }

  cart.subtotal = cart.items.reduce((sum, i) => sum + i.subtotal, 0)
  cart.itemTotal = cart.items.reduce((sum, i) => sum + i.total, 0)
  cart.discountTotal =
    cart.items.reduce((sum, i) => sum + i.discountTotal, 0) +
    cart.shippingMethods.reduce((sum, m) => sum + m.discountTotal, 0)
  cart.shippingTotal = cart.shippingMethods.reduce((sum, m) => sum + m.total, 0)
  cart.taxTotal =
    cart.items.reduce((sum, i) => sum + i.taxTotal, 0) +
    cart.shippingMethods.reduce((sum, m) => sum + m.taxTotal, 0)
  cart.creditLineTotal = cart.creditLines.reduce((sum, cl) => sum + cl.amount, 0)
  cart.total = cart.itemTotal + cart.shippingTotal - cart.creditLineTotal

  await store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_PRICING_RECALCULATED, cart)
}
