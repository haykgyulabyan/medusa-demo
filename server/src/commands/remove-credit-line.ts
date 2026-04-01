import type { Cart } from "../domain/types"
import { store } from "../store/store"
import { eventBus, DomainEvents } from "../events/event-bus"
import { recalculateCartPricing } from "./recalculate-cart-pricing"

type RemoveCreditLineInput = {
  id: string
  creditLineId: string
}

export const removeCreditLine = async (input: RemoveCreditLineInput): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
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
  await store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_CREDIT_LINE_REMOVED, { cart, creditLine: removed })
  await recalculateCartPricing(cart.id)

  return (await store.carts.get(cart.id))!
}
