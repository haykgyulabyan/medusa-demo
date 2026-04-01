import type { Cart, LineItem } from "../domain/types.js"
import { store } from "../store/store.js"
import { eventBus, DomainEvents } from "../events/event-bus.js"
import { recalculateCartPricing } from "./recalculate-cart-pricing.js"

type AddCartItemInput = {
  id: string
  lineItem: {
    title: string
    quantity: number
    variantId?: string
    productId?: string
    requiresShipping?: boolean
    isDiscountable?: boolean
    isGiftcard?: boolean
    isTaxInclusive?: boolean
    isCustomPrice?: boolean
    unitPrice: number
  }
}

export const addCartItem = async (input: AddCartItemInput): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) {
    throw new Error(`Cart ${input.id} not found`)
  }

  if (!input.lineItem.quantity || input.lineItem.quantity <= 0) {
    throw new Error("Line item quantity must be greater than zero")
  }

  if (!input.lineItem.title || input.lineItem.unitPrice === undefined) {
    throw new Error("Line item must have a title and unitPrice")
  }

  const item: LineItem = {
    id: crypto.randomUUID(),
    title: input.lineItem.title,
    quantity: input.lineItem.quantity,
    variantId: input.lineItem.variantId,
    productId: input.lineItem.productId,
    requiresShipping: input.lineItem.requiresShipping ?? true,
    isDiscountable: input.lineItem.isDiscountable ?? true,
    isGiftcard: input.lineItem.isGiftcard ?? false,
    isTaxInclusive: input.lineItem.isTaxInclusive ?? false,
    isCustomPrice: input.lineItem.isCustomPrice ?? false,
    unitPrice: input.lineItem.unitPrice,
    adjustments: [],
    taxLines: [],
    subtotal: 0,
    discountTotal: 0,
    taxTotal: 0,
    total: 0,
  }

  cart.items.push(item)
  await store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_ITEM_ADDED, { cart, item })
  await recalculateCartPricing(cart.id)

  return (await store.carts.get(cart.id))!
}
