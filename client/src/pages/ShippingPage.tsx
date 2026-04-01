import { useState, useEffect } from "react"
import { api } from "../api/client"
import { formatCents } from "../components/format"
import type { NavigateFunction } from "react-router-dom"

type ShippingOption = {
  id: string
  name: string
  amount: number
}

type CartData = {
  id: string
  shippingMethods: { id: string; shippingOptionId?: string }[]
  email?: string
  shippingAddress?: Record<string, string>
  [key: string]: unknown
}

type Props = {
  cart: CartData | null
  refreshCart: () => Promise<unknown>
  navigate: NavigateFunction
}

export const ShippingPage = ({ cart, refreshCart, navigate }: Props) => {
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [email, setEmail] = useState(cart?.email ?? "")
  const [address, setAddress] = useState({
    firstName: cart?.shippingAddress?.firstName ?? "",
    lastName: cart?.shippingAddress?.lastName ?? "",
    address1: cart?.shippingAddress?.address1 ?? "",
    city: cart?.shippingAddress?.city ?? "",
    countryCode: cart?.shippingAddress?.countryCode ?? "US",
    postalCode: cart?.shippingAddress?.postalCode ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!cart) return
    api.getShippingOptions(cart.id).then((data) => {
      setOptions(data.availableOptions)
      if (cart.shippingMethods.length > 0) {
        setSelectedOption(cart.shippingMethods[0].shippingOptionId ?? "")
      }
    })
  }, [cart])

  if (!cart) {
    navigate("/")
    return null
  }

  const handleContinue = async () => {
    setError("")
    if (!email) {
      setError("Email is required")
      return
    }
    if (!address.firstName || !address.address1 || !address.city || !address.postalCode) {
      setError("Please fill in all address fields")
      return
    }
    if (!selectedOption) {
      setError("Please select a shipping method")
      return
    }

    setSaving(true)
    try {
      await api.updateCart(cart.id, {
        email,
        shippingAddress: address,
        billingAddress: address,
      })

      const option = options.find((o) => o.id === selectedOption)!
      // Remove existing shipping method if any
      for (const m of cart.shippingMethods) {
        await api.removeShippingMethod(cart.id, m.id)
      }
      await api.addShippingMethod(cart.id, {
        name: option.name,
        amount: option.amount,
        shippingOptionId: option.id,
      })
      await refreshCart()
      navigate("/checkout")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Shipping</h2>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="you@example.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              value={address.firstName}
              onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              value={address.lastName}
              onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            value={address.address1}
            onChange={(e) => setAddress({ ...address, address1: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              value={address.countryCode}
              onChange={(e) => setAddress({ ...address, countryCode: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code
            </label>
            <input
              value={address.postalCode}
              onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3">Shipping Method</h3>
          <div className="space-y-2">
            {options.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                  selectedOption === opt.id
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={selectedOption === opt.id}
                    onChange={() => setSelectedOption(opt.id)}
                    className="accent-gray-900"
                  />
                  <span className="text-sm font-medium">{opt.name}</span>
                </div>
                <span className="text-sm font-medium">{formatCents(opt.amount)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/cart")}
            className="flex-1 border border-gray-300 py-3 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Back to Cart
          </button>
          <button
            onClick={handleContinue}
            disabled={saving}
            className="flex-1 bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Continue to Checkout"}
          </button>
        </div>
      </div>
    </div>
  )
}
