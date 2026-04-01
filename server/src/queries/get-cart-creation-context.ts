import { store } from "../store/store.js"

export const getCartCreationContext = () => {
  return {
    regions: store.regions.getAll(),
    currencies: store.regions.getAll().map((r) => r.currencyCode),
  }
}
