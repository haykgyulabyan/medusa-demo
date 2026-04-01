import type { Cart, CreditLine } from "../domain/types"
import { store } from "../store/store"
import { eventBus, DomainEvents } from "../events/event-bus"
import { recalculateCartPricing } from "./recalculate-cart-pricing"

type AddCreditLineInput = {
  id: string
  creditLine: {
    amount: number
    reference?: string
    referenceId?: string
  }
}

export const addCreditLine = async (input: AddCreditLineInput): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) {
    throw new Error(`Cart ${input.id} not found`)
  }

  if (!input.creditLine.amount || input.creditLine.amount <= 0) {
    throw new Error("Credit line amount must be greater than zero")
  }

  const creditLine: CreditLine = {
    id: crypto.randomUUID(),
    amount: input.creditLine.amount,
    reference: input.creditLine.reference,
    referenceId: input.creditLine.referenceId,
  }

  cart.creditLines.push(creditLine)
  await store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_CREDIT_LINE_ADDED, { cart, creditLine })
  await recalculateCartPricing(cart.id)

  return (await store.carts.get(cart.id))!
}
