const BASE = "/api"

const request = async (path: string, options?: RequestInit) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Request failed")
  return data
}

export const api = {
  getProducts: () => request("/products"),

  createCart: (currencyCode: string) =>
    request("/carts", {
      method: "POST",
      body: JSON.stringify({ currencyCode }),
    }),

  getCart: (id: string) => request(`/carts/${id}`),

  updateCart: (id: string, data: Record<string, unknown>) =>
    request(`/carts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  addItem: (cartId: string, item: Record<string, unknown>) =>
    request(`/carts/${cartId}/items`, {
      method: "POST",
      body: JSON.stringify(item),
    }),

  updateItem: (cartId: string, itemId: string, data: Record<string, unknown>) =>
    request(`/carts/${cartId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  removeItem: (cartId: string, itemId: string) =>
    request(`/carts/${cartId}/items/${itemId}`, { method: "DELETE" }),

  getShippingOptions: (cartId: string) =>
    request(`/carts/${cartId}/shipping-options`),

  addShippingMethod: (cartId: string, method: Record<string, unknown>) =>
    request(`/carts/${cartId}/shipping-methods`, {
      method: "POST",
      body: JSON.stringify(method),
    }),

  removeShippingMethod: (cartId: string, methodId: string) =>
    request(`/carts/${cartId}/shipping-methods/${methodId}`, {
      method: "DELETE",
    }),

  getCheckoutSummary: (cartId: string) =>
    request(`/carts/${cartId}/checkout-summary`),

  completeCart: (cartId: string) =>
    request(`/carts/${cartId}/complete`, { method: "POST" }),
}
