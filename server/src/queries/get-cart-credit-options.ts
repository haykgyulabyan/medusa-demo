import { store } from "../store/store.js"

export const getCartCreditOptions = (cartId: string) => {
  const cart = store.carts.get(cartId)
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
