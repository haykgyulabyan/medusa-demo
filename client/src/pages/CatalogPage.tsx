import { useState, useEffect } from "react"
import { api } from "../api/client"
import { ProductCard } from "../components/ProductCard"
import type { NavigateFunction } from "react-router-dom"

type Product = {
  id: string
  title: string
  variantId: string
  unitPrice: number
  requiresShipping: boolean
}

type Props = {
  ensureCart: () => Promise<string>
  refreshCart: () => Promise<unknown>
  navigate: NavigateFunction
}

export const CatalogPage = ({ ensureCart, refreshCart, navigate }: Props) => {
  const [products, setProducts] = useState<Product[]>([])
  const [adding, setAdding] = useState<string | null>(null)

  useEffect(() => {
    api.getProducts().then(setProducts)
  }, [])

  const handleAddToCart = async (product: Product) => {
    setAdding(product.id)
    try {
      const cartId = await ensureCart()
      await api.addItem(cartId, {
        title: product.title,
        quantity: 1,
        variantId: product.variantId,
        productId: product.id,
        requiresShipping: product.requiresShipping,
        isDiscountable: true,
        isGiftcard: false,
        isTaxInclusive: false,
        isCustomPrice: false,
        unitPrice: product.unitPrice,
      })
      await refreshCart()
      navigate("/cart")
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to add item")
    } finally {
      setAdding(null)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAdd={() => handleAddToCart(p)}
            loading={adding === p.id}
          />
        ))}
      </div>
    </div>
  )
}
