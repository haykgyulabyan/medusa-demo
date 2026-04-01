import { store } from "../store/store.js"
import type { Cart } from "../domain/types.js"

export const getCartDetails = (cartId: string): Cart => {
  const cart = store.carts.get(cartId)
  if (!cart) {
    throw new Error(`Cart ${cartId} not found`)
  }
  return cart
}
