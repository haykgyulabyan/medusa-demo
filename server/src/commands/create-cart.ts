import type { Address, Cart } from "../domain/types"
import { store } from "../store/store"
import { eventBus, DomainEvents } from "../events/event-bus"
import { recalculateCartPricing } from "./recalculate-cart-pricing"

type CreateCartInput = {
  currencyCode: string
  regionId?: string
  customerId?: string
  salesChannelId?: string
  email?: string
  locale?: string
  shippingAddress?: Address
  billingAddress?: Address
}

export const createCart = async (input: CreateCartInput): Promise<Cart> => {
  if (!input.currencyCode) {
    throw new Error("currencyCode is required to create a cart")
  }

  const cart: Cart = {
    id: crypto.randomUUID(),
    currencyCode: input.currencyCode,
    regionId: input.regionId,
    customerId: input.customerId,
    salesChannelId: input.salesChannelId,
    email: input.email,
    locale: input.locale,
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress,
    items: [],
    shippingMethods: [],
    creditLines: [],
    appliedPromoCodes: [],
    subtotal: 0,
    itemTotal: 0,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    creditLineTotal: 0,
    total: 0,
  }

  await store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_CREATED, cart)
  await recalculateCartPricing(cart.id)

  return (await store.carts.get(cart.id))!
}
