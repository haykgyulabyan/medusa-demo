import { useState, useCallback } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import { CatalogPage } from "./pages/CatalogPage"
import { CartPage } from "./pages/CartPage"
import { ShippingPage } from "./pages/ShippingPage"
import { CheckoutPage } from "./pages/CheckoutPage"
import { ConfirmationPage } from "./pages/ConfirmationPage"
import { api } from "./api/client"

type Cart = {
  id: string
  items: { id: string }[]
  [key: string]: unknown
}

export const App = () => {
  const [cartId, setCartId] = useState<string | null>(null)
  const [cart, setCart] = useState<Cart | null>(null)
  const navigate = useNavigate()

  const refreshCart = useCallback(async () => {
    if (!cartId) return
    const data = await api.getCart(cartId)
    setCart(data)
    return data
  }, [cartId])

  const ensureCart = useCallback(async (): Promise<string> => {
    if (cartId) return cartId
    const newCart = await api.createCart("usd")
    setCartId(newCart.id)
    setCart(newCart)
    return newCart.id
  }, [cartId])

  const itemCount = cart?.items?.length ?? 0

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-xl font-bold cursor-pointer"
            onClick={() => navigate("/")}
          >
            Medusa Cart Demo
          </h1>
          {cartId && (
            <button
              onClick={() => navigate("/cart")}
              className="relative bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <CatalogPage
                ensureCart={ensureCart}
                refreshCart={refreshCart}
                navigate={navigate}
              />
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                refreshCart={refreshCart}
                navigate={navigate}
              />
            }
          />
          <Route
            path="/shipping"
            element={
              <ShippingPage
                cart={cart}
                refreshCart={refreshCart}
                navigate={navigate}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                cart={cart}
                refreshCart={refreshCart}
                navigate={navigate}
              />
            }
          />
          <Route
            path="/confirmation"
            element={<ConfirmationPage cart={cart} navigate={navigate} />}
          />
        </Routes>
      </main>
    </div>
  )
}
