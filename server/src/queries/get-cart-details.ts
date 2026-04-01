import { store } from "../store/store"
import type { Cart } from "../domain/types"

export const getCartDetails = async (cartId: string): Promise<Cart> => {
  const cart = await store.carts.get(cartId)
  if (!cart) {
    throw new Error(`Cart ${cartId} not found`)
  }
  return cart
}
