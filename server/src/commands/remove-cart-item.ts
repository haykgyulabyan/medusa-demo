import type { Cart } from "../domain/types.js"
import { store } from "../store/store.js"
import { eventBus, DomainEvents } from "../events/event-bus.js"
import { recalculateCartPricing } from "./recalculate-cart-pricing.js"

type RemoveCartItemInput = {
  id: string
  lineItemId: string
}

export const removeCartItem = (input: RemoveCartItemInput): Cart => {
  // Acceptance: existing cart that contains a specific line item
  const cart = store.carts.get(input.id)
  if (!cart) {
    throw new Error(`Cart ${input.id} not found`)
  }

  const idx = cart.items.findIndex((i) => i.id === input.lineItemId)
  if (idx === -1) {
    throw new Error(`Line item ${input.lineItemId} not found in cart ${input.id}`)
  }

  const [removed] = cart.items.splice(idx, 1)
  store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_ITEM_REMOVED, { cart, item: removed })
  recalculateCartPricing(cart.id)

  return store.carts.get(cart.id)!
}
