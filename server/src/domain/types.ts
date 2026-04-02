// Value Objects

export type Address = {
  customerId?: string
  firstName?: string
  lastName?: string
  company?: string
  address1?: string
  address2?: string
  city?: string
  countryCode?: string
  province?: string
  postalCode?: string
  phone?: string
}

export type LineItemAdjustment = {
  id: string
  amount: number
  code?: string
  isTaxInclusive?: boolean
  description?: string
  promotionId?: string
  providerId?: string
}

export type LineItemTaxLine = {
  id: string
  code: string
  rate: number
  description?: string
  taxRateId?: string
  providerId?: string
}

export type ShippingMethodAdjustment = {
  id: string
  amount: number
  code?: string
  description?: string
  promotionId?: string
  providerId?: string
}

export type ShippingMethodTaxLine = {
  id: string
  code: string
  rate: number
  description?: string
  taxRateId?: string
  providerId?: string
}

// Entities

export type LineItem = {
  id: string
  title: string
  quantity: number
  variantId?: string
  productId?: string
  requiresShipping: boolean
  isDiscountable: boolean
  isGiftcard: boolean
  isTaxInclusive: boolean
  isCustomPrice: boolean
  unitPrice: number
  adjustments: LineItemAdjustment[]
  taxLines: LineItemTaxLine[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  total: number
}

export type ShippingMethod = {
  id: string
  name: string
  amount: number
  isTaxInclusive: boolean
  shippingOptionId?: string
  adjustments: ShippingMethodAdjustment[]
  taxLines: ShippingMethodTaxLine[]
  discountTotal: number
  taxTotal: number
  total: number
}

export type CreditLine = {
  id: string
  amount: number
  reference?: string
  referenceId?: string
}

export type Cart = {
  id: string
  regionId?: string
  customerId?: string
  salesChannelId?: string
  email?: string
  locale?: string
  currencyCode: string
  shippingAddress?: Address
  billingAddress?: Address
  items: LineItem[]
  shippingMethods: ShippingMethod[]
  creditLines: CreditLine[]
  appliedPromoCodes: string[]
  completedAt?: string
  subtotal: number
  itemTotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  creditLineTotal: number
  total: number
}

// Seed / reference data types

export type Product = {
  id: string
  title: string
  variantId: string
  unitPrice: number
  requiresShipping: boolean
}

export type ShippingOption = {
  id: string
  name: string
  amount: number
}

export type PromoCode = {
  code: string
  type: "fixed" | "percentage" | "free_shipping"
  amount: number
  description: string
}

export type TaxRate = {
  code: string
  rate: number
  description: string
  appliesTo: "all" | "physical" | "digital"
}

export type Region = {
  id: string
  name: string
  currencyCode: string
}
