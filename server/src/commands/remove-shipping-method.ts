import type { Cart } from "../domain/types.js"
import { store } from "../store/store.js"
import { eventBus, DomainEvents } from "../events/event-bus.js"
import { recalculateCartPricing } from "./recalculate-cart-pricing.js"

type RemoveShippingMethodInput = {
  id: string
  shippingMethodId: string
}

export const removeShippingMethod = async (input: RemoveShippingMethodInput): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) {
    throw new Error(`Cart ${input.id} not found`)
  }

  const idx = cart.shippingMethods.findIndex((m) => m.id === input.shippingMethodId)
  if (idx === -1) {
    throw new Error(
      `Shipping method ${input.shippingMethodId} not found in cart ${input.id}`
    )
  }

  const [removed] = cart.shippingMethods.splice(idx, 1)
  await store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_SHIPPING_METHOD_REMOVED, { cart, method: removed })
  await recalculateCartPricing(cart.id)

  return (await store.carts.get(cart.id))!
}
