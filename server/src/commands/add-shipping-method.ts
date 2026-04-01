import type { Cart, ShippingMethod } from "../domain/types.js"
import { store } from "../store/store.js"
import { eventBus, DomainEvents } from "../events/event-bus.js"
import { recalculateCartPricing } from "./recalculate-cart-pricing.js"

type AddShippingMethodInput = {
  id: string
  shippingMethod: {
    name: string
    amount: number
    isTaxInclusive?: boolean
    shippingOptionId?: string
  }
}

export const addShippingMethod = (input: AddShippingMethodInput): Cart => {
  // Acceptance: existing cart and available shipping option
  const cart = store.carts.get(input.id)
  if (!cart) {
    throw new Error(`Cart ${input.id} not found`)
  }

  if (input.shippingMethod.shippingOptionId) {
    const option = store.shippingOptions.get(input.shippingMethod.shippingOptionId)
    if (!option) {
      throw new Error(`Shipping option ${input.shippingMethod.shippingOptionId} not found`)
    }
  }

  const method: ShippingMethod = {
    id: crypto.randomUUID(),
    name: input.shippingMethod.name,
    amount: input.shippingMethod.amount,
    isTaxInclusive: input.shippingMethod.isTaxInclusive ?? false,
    shippingOptionId: input.shippingMethod.shippingOptionId,
    adjustments: [],
    taxLines: [],
    discountTotal: 0,
    taxTotal: 0,
    total: 0,
  }

  // Replace existing shipping methods (one at a time)
  cart.shippingMethods = [method]
  store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_SHIPPING_METHOD_ADDED, { cart, method })
  recalculateCartPricing(cart.id)

  return store.carts.get(cart.id)!
}
