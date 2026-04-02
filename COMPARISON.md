# Cart Implementation Comparison: Our Demo vs MedusaJS

This document provides a detailed comparison between the Cart Service built from the Qlerify domain model (`medusa-demo`) and the actual MedusaJS v2 Cart module. It identifies architectural differences, capability gaps, and improvement opportunities.

## Executive Summary

Our demo captures the **core domain concepts** accurately — entities, commands, pricing formulas, and the checkout flow all map correctly to the real Medusa Cart module. Where the two diverge is in **production-grade concerns**: precision arithmetic, concurrency control, multi-step workflow orchestration, and integration with the broader commerce ecosystem (inventory, payments, promotions, tax providers).

---

## 1. Domain Model Accuracy

### What We Got Right

| Concept | Our Demo | Real Medusa | Match? |
|---------|----------|-------------|--------|
| Cart as aggregate root | Cart owns items, shipping, credits | Same | Yes |
| LineItem fields | title, quantity, unitPrice, variantId, productId, isDiscountable, isGiftcard, isTaxInclusive, isCustomPrice | Same + subtitle, thumbnail, product metadata (product_title, variant_sku, variant_barcode, variant_option_values, compare_at_unit_price) | Partial |
| ShippingMethod fields | name, amount, isTaxInclusive, shippingOptionId | Same + description, data (arbitrary JSON) | Partial |
| CreditLine fields | amount, reference, referenceId | Same + raw_amount (BigNumber JSON) | Partial |
| Address as value object | Embedded on cart, no ID | Same — Address is a separate entity but used as value object with hasOne relationship | Yes |
| Adjustments on items | LineItemAdjustment with amount, code, promotionId | Same + is_tax_inclusive per adjustment, provider_id | Partial |
| Tax lines on items | LineItemTaxLine with code, rate, taxRateId | Same structure | Yes |
| Domain events | 11 events emitted on mutations | Similar events, but emitted through workflow engine | Yes |
| Cart completion | Sets completedAt, validates email + address + items | Same validations + payment authorization + inventory reservation + order creation | Partial |

### What We're Missing in the Domain Model

| Missing Concept | What Medusa Has |
|----------------|-----------------|
| **Product snapshot fields** | `product_title`, `product_description`, `product_subtitle`, `product_type`, `product_collection`, `product_handle`, `variant_sku`, `variant_barcode`, `variant_title`, `variant_option_values` — Medusa snapshots full product data on the line item so the cart is self-contained even if the product changes later |
| **Compare-at price** | `compare_at_unit_price` — the original/MSRP price shown with strikethrough, separate from the selling `unit_price` |
| **Metadata everywhere** | Every entity (Cart, LineItem, ShippingMethod, CreditLine, Address, Adjustments) has a `metadata: JSON` field for extensibility |
| **Soft deletes** | All entities have `deleted_at` timestamps; queries filter on `deleted_at IS NULL`; indexes are partial indexes excluding deleted records |
| **ID prefixes** | Cart: `cart_*`, LineItem: `cali_*`, ShippingMethod: `casm_*`, CreditLine: `cacl_*` — prefixed IDs make debugging and log analysis easier |
| **BigNumber / raw_amount** | Monetary values stored as `BigNumber` with a parallel `raw_amount` JSON field for lossless precision across currency conversions |

---

## 2. Pricing & Totals Calculation

### Our Approach (Simple)

```
item.subtotal      = unitPrice × quantity
item.discountTotal = sum(adjustments[].amount)      // capped at subtotal
item.taxTotal      = (subtotal - discountTotal) × sum(taxLines[].rate)
item.total         = subtotal - discountTotal + taxTotal
```

All values are **integers (cents)**, computed synchronously, no special rounding logic.

### Medusa's Approach (Production-Grade)

```
// Tax-inclusive pricing (prices include tax):
subtotal = (unitPrice × quantity) / (1 + taxRate)

// Tax-exclusive pricing (prices exclude tax):
subtotal = unitPrice × quantity

// Discount proration (handles partial returns):
discountPerUnit = totalAdjustments / originalQuantity
currentDiscount = discountPerUnit × currentQuantity

// Two parallel tax calculations:
taxTotal         = (subtotal - currentDiscount) × taxRate    // actual tax
originalTaxTotal = subtotal × taxRate                        // tax before discounts

// Discount total includes tax savings:
discountTotal = discountSubtotal + (originalTaxTotal - taxTotal)
```

### Key Differences

| Aspect | Our Demo | Medusa |
|--------|----------|--------|
| **Precision** | JavaScript integers (cents) | BigNumber arbitrary precision with `MathBN` operations |
| **Tax-inclusive prices** | Not handled — always tax-exclusive | Full support: divides out tax from inclusive prices via `price / (1 + rate)` |
| **Discount proration** | Full adjustment amount applied regardless of quantity | Per-unit proration: `discountPerUnit × currentQuantity` — handles returns correctly |
| **"Original" totals** | Not tracked | Tracks `original_total`, `original_subtotal`, `original_tax_total` — the undiscounted values for display and refund calculation |
| **Discount tax tracking** | Not tracked | `discount_tax_total = originalTaxTotal - taxTotal` — shows how much tax was saved by the discount |
| **Per-unit total** | Not computed | `totalPerUnit = fullNetTotal / quantity` — used for fulfillment and return calculations |
| **Refundable amount** | Not computed | Calculated based on `currentQuantity` after returns, with prorated discounts |
| **Currency rounding** | `Math.round()` | Currency-aware rounding via BigNumber with epsilon handling |

### Impact

Our pricing is correct for a demo but would fail in production with:
- Tax-inclusive regions (EU, UK, Australia)
- Partial returns (discount proration would be wrong)
- Multi-currency operations (floating-point drift)
- Audit/accounting requirements (no original totals for reconciliation)

---

## 3. Architecture & Patterns

### Command Handling

| Aspect | Our Demo | Medusa |
|--------|----------|--------|
| **Pattern** | Direct function calls: `route → command → store → response` | Workflow engine: `route → workflow → steps → services → response` |
| **Compensation** | None — if a step fails, previous steps aren't rolled back | Full compensation: each workflow step has a rollback function |
| **Concurrency** | None — concurrent requests can corrupt cart state | Distributed locks per cart with configurable timeout/TTL |
| **Idempotency** | None — duplicate requests create duplicate effects | `completeCart` is idempotent: checks if order already linked |
| **Hooks/extensibility** | None | Workflow hooks at key points: `validate`, `setPricingContext`, `cartUpdated`, `beforePaymentAuthorization`, `orderCreated` |

### Medusa's Locking Strategy

```
// Normal operations (add item, update, apply promo):
acquireLock({ key: cart_id, timeout: 2s, ttl: 10s })

// Cart completion (longer operation):
acquireLock({ key: cart_id, timeout: 30s, ttl: 2min })
```

This ensures exactly one mutation per cart at any time. Our demo has no such protection.

### Data Storage

| Aspect | Our Demo | Medusa |
|--------|----------|--------|
| **Cart storage** | Single JSONB document in Supabase | Normalized PostgreSQL tables via MikroORM (cart, cart_line_item, cart_line_item_adjustment, cart_line_item_tax_line, cart_shipping_method, etc.) |
| **Indexes** | Primary key only | 6 indexes on cart (region, customer, sales_channel, currency, addresses), 4 on line_item (cart, variant, product, product_type), all partial indexes filtering soft-deleted rows |
| **Relationships** | Embedded in JSONB | Proper foreign keys with CASCADE DELETE |
| **Querying** | Full document read/write every time | Field-level selects with configurable projections (133 default fields, client can customize) |

### API Layer

| Aspect | Our Demo | Medusa |
|--------|----------|--------|
| **Validation** | Manual `if` checks in command handlers | Zod schemas applied via middleware (`validateAndTransformBody`) |
| **Route pattern** | Express Router with try/catch | File-based routing with named exports (GET, POST, DELETE) |
| **Field selection** | Returns full cart always | Configurable field projection — client can request specific fields via query params |
| **Response shape** | Raw cart object | Decorated with computed totals only when requested, auto-includes required relations |
| **Auth** | None | Customer auth optional for store routes, RBAC for admin |

---

## 4. Integration Points We Don't Have

### Payment System
Medusa's `completeCart` workflow:
1. Validates payment sessions exist
2. Creates the order
3. Reserves inventory
4. Registers promotion usage
5. **Authorizes payment** (last step to minimize compensation risk)
6. Creates order transactions from captures

Our demo: just sets `completedAt`.

### Inventory Management
Medusa's `addToCart` workflow:
1. Checks variant inventory availability via `confirmVariantInventoryWorkflow`
2. On cart completion, reserves inventory via `reserveInventoryStep`
3. Compensation releases reservation if order creation fails

Our demo: no inventory awareness.

### Promotion Engine
Medusa:
- Full promotion module with rules engine
- Promotions linked to carts via relationship table
- Actions computed dynamically: `getActionsToComputeFromPromotionsStep`
- Adjustments rebuilt on every cart change
- Supports ADD/REMOVE/REPLACE semantics for promo codes
- Tracks promotion usage per customer

Our demo: hardcoded promo codes with simple fixed/percentage/free_shipping types.

### Tax Provider System
Medusa:
- Pluggable tax providers
- Tax lines computed by external tax service
- Region-level `automatic_taxes` flag
- Per-item and per-shipping-method tax inclusivity

Our demo: single hardcoded 20% VAT rate applied uniformly.

### Pricing Module
Medusa:
- Dedicated pricing module with context-aware pricing
- Prices vary by: region, customer group, sales channel, quantity, currency
- `setPricingContext` hook for custom pricing rules
- `compare_at_unit_price` for sale display

Our demo: fixed prices from seed data.

---

## 5. What Our Domain Model Should Add

Based on this comparison, the Qlerify domain model (`qlerify-domain-model.json`) should be enriched with:

### High Priority
1. **Product snapshot fields on LineItem** — `productTitle`, `variantSku`, `variantTitle`, `variantOptionValues` (the cart should be self-contained)
2. **Tax-inclusive flag per item and shipping method** — already in our model but our pricing engine ignores it
3. **Metadata field on all entities** — JSON extensibility (partially added in latest model update)
4. **Compare-at price** — `compareAtUnitPrice` on LineItem for sale display

### Medium Priority
5. **Original totals** — `originalTotal`, `originalSubtotal`, `originalTaxTotal` on items, shipping, and cart level
6. **Discount tax tracking** — `discountTaxTotal` showing tax savings from discounts
7. **Soft delete support** — `deletedAt` timestamp in entity definitions
8. **ID prefix convention** — specify prefix per entity for debuggability

### Lower Priority (Ecosystem Integration)
9. **Payment collection** — new entity representing payment state
10. **Inventory reservation** — command/event for reserving stock on completion
11. **Promotion links** — relationship between Cart and applied Promotions (vs our embedded string array)

---

## 6. Scoring Summary

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Domain model accuracy** | 8/10 | Core entities and relationships are correct. Missing product snapshots and metadata. |
| **Pricing correctness** | 6/10 | Formulas are right for tax-exclusive, integer math. Missing tax-inclusive, BigNumber, proration, original totals. |
| **API completeness** | 8/10 | All 13 endpoints match. Missing field projection and Zod validation. |
| **Architecture patterns** | 5/10 | Direct commands work for a demo but lack compensation, locking, idempotency, and hooks. |
| **Production readiness** | 3/10 | No auth, no payments, no inventory, no soft deletes, JSONB storage, no concurrency control. |
| **Code quality** | 8/10 | Clean DDD separation, pure domain layer, clear naming, consistent patterns. |
| **Deployment** | 7/10 | Working Vercel + Supabase deployment. Duplicated API handler is a maintainability concern. |

**Overall: The domain model successfully captures the Cart bounded context at a conceptual level. The generated code is a faithful implementation of that model. The gaps are primarily in production-grade concerns that go beyond what a domain model typically specifies.**

---

## 7. Recommendations for Qlerify

Based on this exercise, here are suggestions for improving the domain model → code generation pipeline:

1. **Schema should support `metadata` as a first-class concept** — every entity should optionally include a metadata JSON field
2. **Pricing mode should be configurable** — the schema should indicate whether amounts are tax-inclusive or tax-exclusive, and the generated code should handle both
3. **Acceptance criteria should cover edge cases** — "quantity greater than zero" is good, but should also cover "quantity must be an integer", "unit_price must be non-negative", etc.
4. **The schema should express concurrency requirements** — e.g., "Cart mutations must be serialized" could generate locking code
5. **Compensation/rollback should be expressible** — the schema could indicate which commands have compensation actions, enabling workflow-style code generation
6. **Product snapshots should be a pattern** — when a LineItem references a Product, the schema should indicate which fields to snapshot at creation time vs. reference dynamically
