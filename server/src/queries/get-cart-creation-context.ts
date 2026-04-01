import { store } from "../store/store.js"

export const getCartCreationContext = async () => {
  const regions = await store.regions.getAll()
  return {
    regions,
    currencies: regions.map((r) => r.currencyCode),
  }
}
