import { Router } from "express"
import {
  createCart,
  updateCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  addShippingMethod,
  removeShippingMethod,
  addCreditLine,
  removeCreditLine,
  completeCart,
} from "../commands/index"
import {
  getCartDetails,
  getCartShippingOptions,
  getCartCreditOptions,
  getCheckoutSummary,
} from "../queries/index"
import { store } from "../store/store"

export const cartRouter = Router()

cartRouter.get("/products", async (_req, res) => {
  const products = await store.products.getAll()
  res.json(products)
})

cartRouter.get("/shipping-options", async (_req, res) => {
  const options = await store.shippingOptions.getAll()
  res.json(options)
})

cartRouter.post("/carts", async (req, res) => {
  try {
    const cart = await createCart(req.body)
    res.status(201).json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

cartRouter.get("/carts/:id", async (req, res) => {
  try {
    const cart = await getCartDetails(req.params.id)
    res.json(cart)
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})

cartRouter.put("/carts/:id", async (req, res) => {
  try {
    const cart = await updateCart({ id: req.params.id, ...req.body })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

cartRouter.post("/carts/:id/items", async (req, res) => {
  try {
    const cart = await addCartItem({ id: req.params.id, lineItem: req.body })
    res.status(201).json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

cartRouter.put("/carts/:id/items/:itemId", async (req, res) => {
  try {
    const cart = await updateCartItem({
      id: req.params.id,
      lineItemId: req.params.itemId,
      ...req.body,
    })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

cartRouter.delete("/carts/:id/items/:itemId", async (req, res) => {
  try {
    const cart = await removeCartItem({
      id: req.params.id,
      lineItemId: req.params.itemId,
    })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

cartRouter.post("/carts/:id/shipping-methods", async (req, res) => {
  try {
    const cart = await addShippingMethod({
      id: req.params.id,
      shippingMethod: req.body,
    })
    res.status(201).json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

cartRouter.delete("/carts/:id/shipping-methods/:methodId", async (req, res) => {
  try {
    const cart = await removeShippingMethod({
      id: req.params.id,
      shippingMethodId: req.params.methodId,
    })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

cartRouter.post("/carts/:id/credit-lines", async (req, res) => {
  try {
    const cart = await addCreditLine({
      id: req.params.id,
      creditLine: req.body,
    })
    res.status(201).json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

cartRouter.delete("/carts/:id/credit-lines/:creditLineId", async (req, res) => {
  try {
    const cart = await removeCreditLine({
      id: req.params.id,
      creditLineId: req.params.creditLineId,
    })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

cartRouter.post("/carts/:id/complete", async (req, res) => {
  try {
    const cart = await completeCart({ id: req.params.id })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

cartRouter.get("/carts/:id/shipping-options", async (req, res) => {
  try {
    const options = await getCartShippingOptions(req.params.id)
    res.json(options)
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})

cartRouter.get("/carts/:id/credit-options", async (req, res) => {
  try {
    const options = await getCartCreditOptions(req.params.id)
    res.json(options)
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})

cartRouter.get("/carts/:id/checkout-summary", async (req, res) => {
  try {
    const summary = await getCheckoutSummary(req.params.id)
    res.json(summary)
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})
