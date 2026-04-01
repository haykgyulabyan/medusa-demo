import type { Cart } from "../domain/types"
import { store } from "../store/store"
import { eventBus, DomainEvents } from "../events/event-bus"

type CompleteCartInput = {
  id: string
}

export const completeCart = async (input: CompleteCartInput): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
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

  cart.completedAt = new Date().toISOString()

  await store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_COMPLETED, cart)

  return cart
}
