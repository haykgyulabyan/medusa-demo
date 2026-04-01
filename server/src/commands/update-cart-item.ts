import type { Cart } from "../domain/types.js"
import { store } from "../store/store.js"
import { eventBus, DomainEvents } from "../events/event-bus.js"
import { recalculateCartPricing } from "./recalculate-cart-pricing.js"

type UpdateCartItemInput = {
  id: string
  lineItemId: string
  quantity?: number
  isCustomPrice?: boolean
  unitPrice?: number
}

export const updateCartItem = async (input: UpdateCartItemInput): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) {
    throw new Error(`Cart ${input.id} not found`)
  }

  const item = cart.items.find((i) => i.id === input.lineItemId)
  if (!item) {
    throw new Error(`Line item ${input.lineItemId} not found in cart ${input.id}`)
  }

  if (input.quantity !== undefined) {
    if (input.quantity <= 0) {
      throw new Error("Quantity must be greater than zero")
    }
    item.quantity = input.quantity
  }
  if (input.isCustomPrice !== undefined) item.isCustomPrice = input.isCustomPrice
  if (input.unitPrice !== undefined) item.unitPrice = input.unitPrice

  await store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_ITEM_UPDATED, { cart, item })
  await recalculateCartPricing(cart.id)

  return (await store.carts.get(cart.id))!
}
