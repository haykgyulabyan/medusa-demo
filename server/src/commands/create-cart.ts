import type { Address, Cart } from "../domain/types.js"
import { store } from "../store/store.js"
import { eventBus, DomainEvents } from "../events/event-bus.js"
import { recalculateCartPricing } from "./recalculate-cart-pricing.js"

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

export const createCart = (input: CreateCartInput): Cart => {
  // Acceptance: customer has selected a currency
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

  store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_CREATED, cart)
  recalculateCartPricing(cart.id)

  return store.carts.get(cart.id)!
}
