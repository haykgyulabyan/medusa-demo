import { formatCents } from "../components/format"
import type { NavigateFunction } from "react-router-dom"

type CartData = {
  id: string
  completedAt?: string
  items: { id: string; title: string; quantity: number; total: number }[]
  shippingMethods: { name: string; total: number }[]
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  total: number
  [key: string]: unknown
}

type Props = {
  cart: CartData | null
  navigate: NavigateFunction
}

export const ConfirmationPage = ({ cart, navigate }: Props) => {
  if (!cart || !cart.completedAt) {
    navigate("/")
    return null
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-green-600 text-5xl mb-4">&#10003;</div>
        <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
        <p className="text-gray-600 mb-1">
          Order ID: <span className="font-mono text-sm">{cart.id}</span>
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Completed at: {new Date(cart.completedAt).toLocaleString()}
        </p>

        <div className="text-left border-t pt-6 space-y-3">
          <h3 className="font-semibold">Items</h3>
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.title} x{item.quantity}
              </span>
              <span>{formatCents(item.total)}</span>
            </div>
          ))}

          {cart.shippingMethods.map((m, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{m.name}</span>
              <span>{formatCents(m.total)}</span>
            </div>
          ))}

          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCents(cart.subtotal)}</span>
            </div>
            {cart.discountTotal > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCents(cart.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span>{formatCents(cart.shippingTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span>{formatCents(cart.taxTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCents(cart.total)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-8 bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800"
        >
          Back to Shop
        </button>
      </div>
    </div>
  )
}
