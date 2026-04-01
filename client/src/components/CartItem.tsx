import { formatCents } from "./format"

type Item = {
  id: string
  title: string
  quantity: number
  unitPrice: number
  subtotal: number
  discountTotal: number
  total: number
  adjustments: { code?: string }[]
}

type Props = {
  item: Item
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
  disabled: boolean
}

export const CartItem = ({ item, onUpdateQuantity, onRemove, disabled }: Props) => (
  <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
    <div className="bg-gray-100 rounded-lg w-16 h-16 flex items-center justify-center flex-shrink-0">
      <span className="text-2xl text-gray-400">{item.title.charAt(0)}</span>
    </div>

    <div className="flex-1 min-w-0">
      <h4 className="font-medium truncate">{item.title}</h4>
      <p className="text-sm text-gray-500">
        {formatCents(item.unitPrice)} each
      </p>
      {item.discountTotal > 0 && (
        <p className="text-xs text-green-600">
          -{formatCents(item.discountTotal)} discount
          {item.adjustments[0]?.code && ` (${item.adjustments[0].code})`}
        </p>
      )}
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => onUpdateQuantity(item.quantity - 1)}
        disabled={disabled || item.quantity <= 1}
        className="w-8 h-8 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-30"
      >
        -
      </button>
      <span className="w-8 text-center text-sm font-medium">
        {item.quantity}
      </span>
      <button
        onClick={() => onUpdateQuantity(item.quantity + 1)}
        disabled={disabled}
        className="w-8 h-8 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-30"
      >
        +
      </button>
    </div>

    <div className="text-right w-20">
      <p className="font-medium">{formatCents(item.total)}</p>
    </div>

    <button
      onClick={onRemove}
      disabled={disabled}
      className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-lg"
      title="Remove"
    >
      &times;
    </button>
  </div>
)
