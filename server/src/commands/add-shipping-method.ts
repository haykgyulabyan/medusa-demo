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

export const addShippingMethod = async (input: AddShippingMethodInput): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) {
    throw new Error(`Cart ${input.id} not found`)
  }

  if (input.shippingMethod.shippingOptionId) {
    const option = await store.shippingOptions.get(input.shippingMethod.shippingOptionId)
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

  cart.shippingMethods = [method]
  await store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_SHIPPING_METHOD_ADDED, { cart, method })
  await recalculateCartPricing(cart.id)

  return (await store.carts.get(cart.id))!
}
