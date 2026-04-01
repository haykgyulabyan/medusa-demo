import { formatCents } from "./format"

type Summary = {
  email?: string
  items: {
    id: string
    title: string
    quantity: number
    unitPrice: number
    total: number
    discountTotal: number
  }[]
  shippingAddress: {
    firstName?: string
    lastName?: string
    address1?: string
    city?: string
    countryCode?: string
    postalCode?: string
  } | null
  shippingMethods: { name: string; total: number }[]
  appliedPromoCodes: string[]
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  creditLineTotal: number
  total: number
}

type Props = {
  summary: Summary
}

export const OrderSummary = ({ summary }: Props) => (
  <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
    <div>
      <h3 className="font-semibold mb-2">Contact</h3>
      <p className="text-sm text-gray-600">{summary.email ?? "Not set"}</p>
    </div>

    {summary.shippingAddress && (
      <div>
        <h3 className="font-semibold mb-2">Shipping Address</h3>
        <p className="text-sm text-gray-600">
          {summary.shippingAddress.firstName} {summary.shippingAddress.lastName}
          <br />
          {summary.shippingAddress.address1}
          <br />
          {summary.shippingAddress.city}, {summary.shippingAddress.countryCode}{" "}
          {summary.shippingAddress.postalCode}
        </p>
      </div>
    )}

    <div>
      <h3 className="font-semibold mb-2">Items</h3>
      <div className="space-y-2">
        {summary.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.title} x{item.quantity}
              {item.discountTotal > 0 && (
                <span className="text-green-600 ml-2">
                  (-{formatCents(item.discountTotal)})
                </span>
              )}
            </span>
            <span className="font-medium">{formatCents(item.total)}</span>
          </div>
        ))}
      </div>
    </div>

    {summary.shippingMethods.length > 0 && (
      <div>
        <h3 className="font-semibold mb-2">Shipping</h3>
        {summary.shippingMethods.map((m, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{m.name}</span>
            <span>{formatCents(m.total)}</span>
          </div>
        ))}
      </div>
    )}

    {summary.appliedPromoCodes.length > 0 && (
      <div>
        <h3 className="font-semibold mb-2">Promo Codes</h3>
        <div className="flex gap-2">
          {summary.appliedPromoCodes.map((c) => (
            <span
              key={c}
              className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    )}

    <div className="border-t pt-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span>{formatCents(summary.subtotal)}</span>
      </div>
      {summary.discountTotal > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span>-{formatCents(summary.discountTotal)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Shipping</span>
        <span>{formatCents(summary.shippingTotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Tax</span>
        <span>{formatCents(summary.taxTotal)}</span>
      </div>
      {summary.creditLineTotal > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Credits</span>
          <span>-{formatCents(summary.creditLineTotal)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-lg pt-2 border-t">
        <span>Total</span>
        <span>{formatCents(summary.total)}</span>
      </div>
    </div>
  </div>
)
