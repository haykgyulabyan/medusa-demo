import { useState, useEffect } from "react"
import { api } from "../api/client"
import { OrderSummary } from "../components/OrderSummary"
import type { NavigateFunction } from "react-router-dom"

type CheckoutSummary = {
  id: string
  email?: string
  items: {
    id: string
    title: string
    quantity: number
    unitPrice: number
    subtotal: number
    discountTotal: number
    taxTotal: number
    total: number
  }[]
  shippingAddress: {
    firstName?: string
    lastName?: string
    address1?: string
    city?: string
    countryCode?: string
    postalCode?: string
  } | null
  shippingMethods: { id: string; name: string; amount: number; total: number }[]
  appliedPromoCodes: string[]
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  creditLineTotal: number
  total: number
}

type Props = {
  cart: Record<string, any> | null
  refreshCart: () => Promise<unknown>
  navigate: NavigateFunction
}

export const CheckoutPage = ({ cart, refreshCart, navigate }: Props) => {
  const [summary, setSummary] = useState<CheckoutSummary | null>(null)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!cart) return
    api.getCheckoutSummary(cart.id).then(setSummary)
  }, [cart])

  if (!cart) {
    navigate("/")
    return null
  }

  const handleComplete = async () => {
    setError("")
    setCompleting(true)
    try {
      await api.completeCart(cart.id)
      await refreshCart()
      navigate("/confirmation")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to complete order")
    } finally {
      setCompleting(false)
    }
  }

  if (!summary) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Checkout Summary</h2>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <OrderSummary summary={summary} />

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => navigate("/shipping")}
          className="flex-1 border border-gray-300 py-3 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Back to Shipping
        </button>
        <button
          onClick={handleComplete}
          disabled={completing}
          className="flex-1 bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {completing ? "Placing Order..." : "Complete Order"}
        </button>
      </div>
    </div>
  )
}
