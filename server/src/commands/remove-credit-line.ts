import type { Cart } from "../domain/types.js"
import { store } from "../store/store.js"
import { eventBus, DomainEvents } from "../events/event-bus.js"
import { recalculateCartPricing } from "./recalculate-cart-pricing.js"

type RemoveCreditLineInput = {
  id: string
  creditLineId: string
}

export const removeCreditLine = (input: RemoveCreditLineInput): Cart => {
  // Acceptance: existing cart that contains a credit line
  const cart = store.carts.get(input.id)
  if (!cart) {
    throw new Error(`Cart ${input.id} not found`)
  }

  const idx = cart.creditLines.findIndex((cl) => cl.id === input.creditLineId)
  if (idx === -1) {
    throw new Error(
      `Credit line ${input.creditLineId} not found in cart ${input.id}`
    )
  }

  const [removed] = cart.creditLines.splice(idx, 1)
  store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_CREDIT_LINE_REMOVED, { cart, creditLine: removed })
  recalculateCartPricing(cart.id)

  return store.carts.get(cart.id)!
}
