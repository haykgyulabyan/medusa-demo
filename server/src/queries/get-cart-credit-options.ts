import { store } from "../store/store.js"

export const getCartCreditOptions = async (cartId: string) => {
  const cart = await store.carts.get(cartId)
  if (!cart) {
    throw new Error(`Cart ${cartId} not found`)
  }

  return {
    id: cart.id,
    currencyCode: cart.currencyCode,
    total: cart.total,
    creditLineTotal: cart.creditLineTotal,
    creditLines: cart.creditLines.map((cl) => ({
      id: cl.id,
      reference: cl.reference,
      referenceId: cl.referenceId,
      amount: cl.amount,
    })),
  }
}
