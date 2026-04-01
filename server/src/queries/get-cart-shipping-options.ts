import { store } from "../store/store.js"

export const getCartShippingOptions = (cartId: string) => {
  const cart = store.carts.get(cartId)
  if (!cart) {
    throw new Error(`Cart ${cartId} not found`)
  }

  const options = store.shippingOptions.getAll()

  return {
    cartId: cart.id,
    regionId: cart.regionId,
    currencyCode: cart.currencyCode,
    shippingAddress: cart.shippingAddress
      ? {
          countryCode: cart.shippingAddress.countryCode,
          province: cart.shippingAddress.province,
          postalCode: cart.shippingAddress.postalCode,
          city: cart.shippingAddress.city,
        }
      : null,
    currentShippingMethods: cart.shippingMethods.map((m) => ({
      id: m.id,
      name: m.name,
      shippingOptionId: m.shippingOptionId,
      amount: m.amount,
    })),
    availableOptions: options,
  }
}
