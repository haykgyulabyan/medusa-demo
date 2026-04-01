import { useState } from "react"

type Props = {
  appliedCodes: string[]
  onApply: (code: string) => Promise<void>
  onRemove: (code: string) => Promise<void>
}

export const PromoCodeInput = ({ appliedCodes, onApply, onRemove }: Props) => {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleApply = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError("")
    try {
      await onApply(code.trim().toUpperCase())
      setCode("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          placeholder="Promo code"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
        >
          Apply
        </button>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      {appliedCodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {appliedCodes.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full"
            >
              {c}
              <button
                onClick={() => onRemove(c)}
                className="hover:text-green-900"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
