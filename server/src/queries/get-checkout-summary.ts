import { store } from "../store/store.js"

export const getCheckoutSummary = async (cartId: string) => {
  const cart = await store.carts.get(cartId)
  if (!cart) {
    throw new Error(`Cart ${cartId} not found`)
  }

  return {
    id: cart.id,
    customerId: cart.customerId,
    email: cart.email,
    items: cart.items.map((i) => ({
      id: i.id,
      title: i.title,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
      discountTotal: i.discountTotal,
      taxTotal: i.taxTotal,
      total: i.total,
    })),
    shippingAddress: cart.shippingAddress
      ? {
          firstName: cart.shippingAddress.firstName,
          lastName: cart.shippingAddress.lastName,
          address1: cart.shippingAddress.address1,
          city: cart.shippingAddress.city,
          countryCode: cart.shippingAddress.countryCode,
          postalCode: cart.shippingAddress.postalCode,
        }
      : null,
    shippingMethods: cart.shippingMethods.map((m) => ({
      id: m.id,
      name: m.name,
      amount: m.amount,
      total: m.total,
    })),
    appliedPromoCodes: cart.appliedPromoCodes,
    subtotal: cart.subtotal,
    discountTotal: cart.discountTotal,
    shippingTotal: cart.shippingTotal,
    taxTotal: cart.taxTotal,
    creditLineTotal: cart.creditLineTotal,
    total: cart.total,
  }
}
