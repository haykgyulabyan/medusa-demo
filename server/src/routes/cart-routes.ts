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
} from "../commands/index.js"
import {
  getCartDetails,
  getCartShippingOptions,
  getCartCreditOptions,
  getCheckoutSummary,
} from "../queries/index.js"
import { store } from "../store/store.js"

export const cartRouter = Router()

// Products endpoint (needed for catalog UI)
cartRouter.get("/products", (_req, res) => {
  res.json(store.products.getAll())
})

// Shipping options list
cartRouter.get("/shipping-options", (_req, res) => {
  res.json(store.shippingOptions.getAll())
})

// POST /api/carts → CreateCart
cartRouter.post("/carts", (req, res) => {
  try {
    const cart = createCart(req.body)
    res.status(201).json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// GET /api/carts/:id → GetCartDetails
cartRouter.get("/carts/:id", (req, res) => {
  try {
    const cart = getCartDetails(req.params.id)
    res.json(cart)
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})

// PUT /api/carts/:id → UpdateCart
cartRouter.put("/carts/:id", (req, res) => {
  try {
    const cart = updateCart({ id: req.params.id, ...req.body })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// POST /api/carts/:id/items → AddCartItem
cartRouter.post("/carts/:id/items", (req, res) => {
  try {
    const cart = addCartItem({ id: req.params.id, lineItem: req.body })
    res.status(201).json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// PUT /api/carts/:id/items/:itemId → UpdateCartItem
cartRouter.put("/carts/:id/items/:itemId", (req, res) => {
  try {
    const cart = updateCartItem({
      id: req.params.id,
      lineItemId: req.params.itemId,
      ...req.body,
    })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// DELETE /api/carts/:id/items/:itemId → RemoveCartItem
cartRouter.delete("/carts/:id/items/:itemId", (req, res) => {
  try {
    const cart = removeCartItem({
      id: req.params.id,
      lineItemId: req.params.itemId,
    })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// POST /api/carts/:id/shipping-methods → AddShippingMethod
cartRouter.post("/carts/:id/shipping-methods", (req, res) => {
  try {
    const cart = addShippingMethod({
      id: req.params.id,
      shippingMethod: req.body,
    })
    res.status(201).json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// DELETE /api/carts/:id/shipping-methods/:methodId → RemoveShippingMethod
cartRouter.delete("/carts/:id/shipping-methods/:methodId", (req, res) => {
  try {
    const cart = removeShippingMethod({
      id: req.params.id,
      shippingMethodId: req.params.methodId,
    })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// POST /api/carts/:id/credit-lines → AddCreditLine
cartRouter.post("/carts/:id/credit-lines", (req, res) => {
  try {
    const cart = addCreditLine({
      id: req.params.id,
      creditLine: req.body,
    })
    res.status(201).json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// DELETE /api/carts/:id/credit-lines/:creditLineId → RemoveCreditLine
cartRouter.delete("/carts/:id/credit-lines/:creditLineId", (req, res) => {
  try {
    const cart = removeCreditLine({
      id: req.params.id,
      creditLineId: req.params.creditLineId,
    })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// POST /api/carts/:id/complete → CompleteCart
cartRouter.post("/carts/:id/complete", (req, res) => {
  try {
    const cart = completeCart({ id: req.params.id })
    res.json(cart)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// GET /api/carts/:id/shipping-options → GetCartShippingOptions
cartRouter.get("/carts/:id/shipping-options", (req, res) => {
  try {
    const options = getCartShippingOptions(req.params.id)
    res.json(options)
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})

// GET /api/carts/:id/credit-options → GetCartCreditOptions
cartRouter.get("/carts/:id/credit-options", (req, res) => {
  try {
    const options = getCartCreditOptions(req.params.id)
    res.json(options)
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})

// GET /api/carts/:id/checkout-summary → GetCheckoutSummary
cartRouter.get("/carts/:id/checkout-summary", (req, res) => {
  try {
    const summary = getCheckoutSummary(req.params.id)
    res.json(summary)
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})
