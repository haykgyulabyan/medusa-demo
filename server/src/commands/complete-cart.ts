import type { Cart } from "../domain/types.js"
import { store } from "../store/store.js"
import { eventBus, DomainEvents } from "../events/event-bus.js"

type CompleteCartInput = {
  id: string
}

export const completeCart = (input: CompleteCartInput): Cart => {
  // Acceptance: existing cart with all required checkout information and current pricing
  const cart = store.carts.get(input.id)
  if (!cart) {
    throw new Error(`Cart ${input.id} not found`)
  }

  if (cart.completedAt) {
    throw new Error(`Cart ${input.id} is already completed`)
  }

  if (cart.items.length === 0) {
    throw new Error("Cart must have at least one item to complete")
  }

  if (!cart.email) {
    throw new Error("Cart must have an email to complete")
  }

  if (!cart.shippingAddress) {
    throw new Error("Cart must have a shipping address to complete")
  }

  // Mark as completed
  cart.completedAt = new Date().toISOString()

  store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_COMPLETED, cart)

  return cart
}
