type EventHandler = (payload: unknown) => void

const handlers = new Map<string, EventHandler[]>()

export const eventBus = {
  on(event: string, handler: EventHandler) {
    const list = handlers.get(event) ?? []
    list.push(handler)
    handlers.set(event, list)
  },

  emit(event: string, payload: unknown) {
    const list = handlers.get(event) ?? []
    for (const handler of list) {
      handler(payload)
    }
  },
}

export const DomainEvents = {
  CART_CREATED: "CartCreated",
  CART_UPDATED: "CartUpdated",
  CART_ITEM_ADDED: "CartItemAdded",
  CART_ITEM_UPDATED: "CartItemUpdated",
  CART_ITEM_REMOVED: "CartItemRemoved",
  CART_SHIPPING_METHOD_ADDED: "CartShippingMethodAdded",
  CART_SHIPPING_METHOD_REMOVED: "CartShippingMethodRemoved",
  CART_CREDIT_LINE_ADDED: "CartCreditLineAdded",
  CART_CREDIT_LINE_REMOVED: "CartCreditLineRemoved",
  CART_PRICING_RECALCULATED: "CartPricingRecalculated",
  CART_COMPLETED: "CartCompleted",
} as const
