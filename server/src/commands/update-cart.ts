import type { Address, Cart } from "../domain/types.js"
import { store } from "../store/store.js"
import { eventBus, DomainEvents } from "../events/event-bus.js"
import { recalculateCartPricing } from "./recalculate-cart-pricing.js"

type UpdateCartInput = {
  id: string
  regionId?: string
  customerId?: string
  salesChannelId?: string
  email?: string
  locale?: string
  shippingAddress?: Address
  billingAddress?: Address
  promoCode?: string
  removePromoCode?: string
}

export const updateCart = async (input: UpdateCartInput): Promise<Cart> => {
  const cart = await store.carts.get(input.id)
  if (!cart) {
    throw new Error(`Cart ${input.id} not found`)
  }

  if (input.regionId !== undefined) cart.regionId = input.regionId
  if (input.customerId !== undefined) cart.customerId = input.customerId
  if (input.salesChannelId !== undefined) cart.salesChannelId = input.salesChannelId
  if (input.email !== undefined) cart.email = input.email
  if (input.locale !== undefined) cart.locale = input.locale
  if (input.shippingAddress !== undefined) cart.shippingAddress = input.shippingAddress
  if (input.billingAddress !== undefined) cart.billingAddress = input.billingAddress

  if (input.promoCode) {
    const promo = await store.promoCodes.get(input.promoCode)
    if (!promo) {
      throw new Error(`Promo code "${input.promoCode}" not found`)
    }
    if (!cart.appliedPromoCodes.includes(input.promoCode)) {
      cart.appliedPromoCodes.push(input.promoCode)
    }
  }

  if (input.removePromoCode) {
    cart.appliedPromoCodes = cart.appliedPromoCodes.filter(
      (c) => c !== input.removePromoCode
    )
  }

  await store.carts.set(cart.id, cart)
  eventBus.emit(DomainEvents.CART_UPDATED, cart)
  await recalculateCartPricing(cart.id)

  return (await store.carts.get(cart.id))!
}
