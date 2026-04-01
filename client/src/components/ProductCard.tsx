import { formatCents } from "./format"

type Product = {
  id: string
  title: string
  unitPrice: number
  requiresShipping: boolean
}

type Props = {
  product: Product
  onAdd: () => void
  loading: boolean
}

export const ProductCard = ({ product, onAdd, loading }: Props) => (
  <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
    <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-4">
      <span className="text-4xl text-gray-400">
        {product.title.charAt(0)}
      </span>
    </div>
    <h3 className="font-semibold text-lg">{product.title}</h3>
    <p className="text-gray-600 text-sm mt-1">
      {formatCents(product.unitPrice)}
    </p>
    {!product.requiresShipping && (
      <p className="text-xs text-blue-600 mt-1">Digital delivery</p>
    )}
    <button
      onClick={onAdd}
      disabled={loading}
      className="mt-auto pt-4 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
    >
      {loading ? "Adding..." : "Add to Cart"}
    </button>
  </div>
)
