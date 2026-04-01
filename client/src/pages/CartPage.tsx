import { useState, useEffect } from "react"
import { api } from "../api/client"
import { CartItem } from "../components/CartItem"
import { PromoCodeInput } from "../components/PromoCodeInput"
import { formatCents } from "../components/format"
import type { NavigateFunction } from "react-router-dom"

type CartData = {
  id: string
  items: {
    id: string
    title: string
    quantity: number
    unitPrice: number
    subtotal: number
    discountTotal: number
    taxTotal: number
    total: number
    adjustments: { code?: string }[]
  }[]
  appliedPromoCodes: string[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  total: number
  [key: string]: unknown
}

type Props = {
  cart: CartData | null
  refreshCart: () => Promise<unknown>
  navigate: NavigateFunction
}

export const CartPage = ({ cart, refreshCart, navigate }: Props) => {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
        >
          Browse Products
        </button>
      </div>
    )
  }

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    setLoading(true)
    try {
      await api.updateItem(cart.id, itemId, { quantity })
      await refreshCart()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setLoading(true)
    try {
      await api.removeItem(cart.id, itemId)
      await refreshCart()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to remove")
    } finally {
      setLoading(false)
    }
  }

  const handleApplyPromo = async (code: string) => {
    await api.updateCart(cart.id, { promoCode: code })
    await refreshCart()
  }

  const handleRemovePromo = async (code: string) => {
    await api.updateCart(cart.id, { removePromoCode: code })
    await refreshCart()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Cart</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={(q) => handleUpdateQuantity(item.id, q)}
              onRemove={() => handleRemoveItem(item.id)}
              disabled={loading}
            />
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 h-fit space-y-4">
          <h3 className="font-semibold text-lg">Order Summary</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCents(cart.subtotal)}</span>
            </div>
            {cart.discountTotal > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCents(cart.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>{formatCents(cart.taxTotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t">
              <span>Total</span>
              <span>{formatCents(cart.total)}</span>
            </div>
          </div>

          <PromoCodeInput
            appliedCodes={cart.appliedPromoCodes}
            onApply={handleApplyPromo}
            onRemove={handleRemovePromo}
          />

          <button
            onClick={() => navigate("/shipping")}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800"
          >
            Continue to Shipping
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full text-gray-600 py-2 text-sm hover:text-gray-900"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
