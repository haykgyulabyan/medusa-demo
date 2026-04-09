# Medusa Cart Demo

## What this is
A demo application showcasing a DDD-modeled e-commerce cart, generated from                                                                                                                                      
a Qlerify domain model (`domain-model.json`). The domain model defines all                                                                                                                                       
entities, value objects, commands, queries, domain events, and acceptance criteria.

## Tech Stack
- **Runtime:** Node.js + TypeScript
- **Backend:** Express. Two storage backends behind a single `Store` interface:
  - **SQLite** (`better-sqlite3`) — local default. File at `server/data/cart.db`, gitignored, auto-created and seeded on first startup from `server/src/store/seed-data.ts`.
  - **Supabase Postgres** — used in production on Vercel and locally if you drop a `server/.env` with `SUPABASE_URL` set (e.g. via `vercel env pull server/.env`).
- The selector is in `server/src/store/store.ts`: `process.env.SUPABASE_URL ? createSupabaseStore() : createSqliteStore()`. Local clones get SQLite by default with zero configuration.
- **Frontend:** React + Vite + TailwindCSS
- **Monorepo:** Single repo, two packages: `server/` and `client/`
- **Deployment:** Vercel — `api/index.ts` is a self-contained serverless handler that mirrors `server/src` (kept self-contained because Vercel's build couldn't resolve cross-directory imports). It is hardcoded to Supabase and does **not** use the store selector. Any change to the storage interface needs to be mirrored there manually.

## Project Structure
server/                                                                                                                                                                                                          
├── src/                                                                                                                                                                                                         
│   ├── domain/          # Entities, value objects, types (from domain-model.json schemas)
│   ├── commands/        # Command handlers (from domain-model.json commands)                                                                                                                                    
│   ├── queries/         # Query handlers (from domain-model.json queries)                                                                                                                                       
│   ├── events/          # Domain event definitions and simple event bus                                                                                                                                         
│   ├── store/           # Store interface + SQLite (default) and Supabase implementations + seed-data.ts
│   ├── routes/          # Express routes mapping to commands/queries
│   └── index.ts         # Express app entry point (loads dotenv before app)                                                                                                                                                               
client/                                                                                                                                                                                                          
├── src/                                                                                                                                                                                                         
│   ├── pages/           # Cart flow pages                                                                                                                                                                       
│   ├── components/      # Reusable UI components                                                                                                                                                                
│   ├── api/             # API client                                                                                                                                                                            
│   └── App.tsx

## Architecture Rules

- **Domain layer has zero dependencies** on Express, React, or any framework
- Commands are the only way to mutate state — never modify the store directly from routes
- Every command handler emits the corresponding domain event after success
- Every cart mutation automatically triggers RecalculateCartPricing before returning
- Queries are read-only projections of the store
- Use the acceptance criteria from domain-model.json as validation rules

## API Routes

Map commands to REST endpoints:
- `POST /api/carts` → CreateCart
- `GET /api/carts/:id` → GetCartDetails
- `PUT /api/carts/:id` → UpdateCart
- `POST /api/carts/:id/items` → AddCartItem
- `PUT /api/carts/:id/items/:itemId` → UpdateCartItem
- `DELETE /api/carts/:id/items/:itemId` → RemoveCartItem
- `POST /api/carts/:id/shipping-methods` → AddShippingMethod
- `DELETE /api/carts/:id/shipping-methods/:methodId` → RemoveShippingMethod
- `POST /api/carts/:id/credit-lines` → AddCreditLine
- `DELETE /api/carts/:id/credit-lines/:creditLineId` → RemoveCreditLine
- `POST /api/carts/:id/complete` → CompleteCart
- `GET /api/carts/:id/shipping-options` → GetCartShippingOptions
- `GET /api/carts/:id/checkout-summary` → GetCheckoutSummary

## Pricing Formulas

These are computed by RecalculateCartPricing and stored on the cart:

item.subtotal = item.unitPrice * item.quantity                                                                                                                                                                   
item.discount_total = sum(item.adjustments[].amount)
item.tax_total = (item.subtotal - item.discount_total) * sum(item.taxLines[].rate)                                                                                                                               
item.total = item.subtotal - item.discount_total + item.tax_total

cart.subtotal = sum(items[].subtotal)                                                                                                                                                                            
cart.item_total = sum(items[].total)                                                                                                                                                                             
cart.discount_total = sum(items[].discount_total) + sum(shippingMethods[].adjustments[].amount)                                                                                                                  
cart.shipping_total = sum(shippingMethods[].amount - shippingMethod.adjustments[].amount + shippingMethod.tax)                                                                                                   
cart.tax_total = sum(items[].tax_total) + sum(shippingMethods[].tax_total)                                                                                                                                       
cart.credit_line_total = sum(creditLines[].amount)                                                                                                                                                               
cart.total = cart.item_total + cart.shipping_total - cart.credit_line_total

## Reference Data

The following lives in Supabase tables (`products`, `shipping_options`, `promo_codes`, `tax_rates`, `regions`) — not seeded by the server at startup:

**Products (5):**                                                                                                                                                                                                
| id | title | variant_id | unit_price | requires_shipping |
|----|-------|-----------|------------|-------------------|                                                                                                                                                      
| prod-001 | Blue Tee | var-001 | 2999 | true |                                                                                                                                                                  
| prod-002 | Coffee Mug | var-002 | 1250 | true |                                                                                                                                                                
| prod-003 | Gift Card $50 | var-003 | 5000 | false |                                                                                                                                                            
| prod-004 | Hoodie | var-004 | 5999 | true |                                                                                                                                                                    
| prod-005 | Sticker Pack | var-005 | 499 | true |

**Shipping Options (2):**                                                                                                                                                                                        
| id | name | amount |                                                                                                                                                                                           
|----|------|--------|                                                                                                                                                                                           
| opt-001 | Standard Shipping | 599 |                                                                                                                                                                            
| opt-002 | Express Shipping | 1299 |

**Promo Codes (3):**                                                                                                                                                                                             
| code | type | amount | description |                                                                                                                                                                           
|------|------|--------|-------------|                                                                                                                                                                           
| SAVE5 | fixed | 500 | $5 off per item |                                                                                                                                                                        
| VIP10 | percentage | 10 | 10% off |                                                                                                                                                                            
| FREESHIP | free_shipping | 0 | Free shipping |

**Tax Rate:**                                                                                                                                                                                                    
| code | rate | description |                                                                                                                                                                                    
|------|------|-------------|                                                                                                                                                                                    
| VAT | 0.20 | 20% VAT |

**Region:**                                                                                                                                                                                                      
| id | name | currency_code |                                                                                                                                                                                    
|----|------|--------------|                                                                                                                                                                                     
| reg-001 | North America | usd |

All amounts are in cents (integer). Display as dollars in the UI.

## UI Flow

The frontend should be a single-page checkout flow with these steps:
1. **Product catalog** — grid of seeded products with "Add to Cart" buttons
2. **Cart view** — shows items, quantities, adjustments, totals. Can update quantity or remove items.
3. **Promo code input** — text field to enter a promo code, applied via cart update
4. **Shipping selection** — radio buttons for shipping options
5. **Checkout summary** — final totals, addresses, "Complete Order" button
6. **Order confirmation** — shows completed_at timestamp and final summary

## Code Style
- No semicolons
- Double quotes for strings
- 2-space indent
- Prefer `const` and arrow functions
- No classes in the domain layer — use plain objects and functions                                                                                                                                               
