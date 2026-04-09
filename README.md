# Medusa Cart Demo

A DDD-modeled e-commerce cart and checkout flow, generated from a [Qlerify](https://qlerify.com) domain model. Built with TypeScript, Express, React, and TailwindCSS.

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Express](https://img.shields.io/badge/Express-4.21-green)
![React](https://img.shields.io/badge/React-18.3-61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8)

## Overview

This project implements a complete cart/checkout bounded context following Domain-Driven Design principles. The domain model (`domain-model.json`) defines all entities, commands, queries, domain events, and acceptance criteria — the code is a direct implementation of that specification.

### Features

- Product catalog with 5 seeded products
- Cart management (add, update quantity, remove items)
- Promo code system (fixed discount, percentage, free shipping)
- Shipping method selection
- Tax calculation (20% VAT)
- Credit line support
- Full checkout flow with order confirmation

## Quick Start

```bash
# Clone the repo
git clone https://github.com/haykgyulabyan/medusa-demo.git
cd medusa-demo

# Set up server env vars (data lives in Supabase)
# Option A — pull from the linked Vercel project (requires team access):
vercel env pull server/.env
# Option B — copy the template and fill in SUPABASE_URL + SUPABASE_ANON_KEY:
cp server/.env.example server/.env

# Start the server (port 3001)
cd server
npm install
npm run dev

# In a new terminal — start the client (port 5173)
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the app.

## Architecture

```
server/src/
├── domain/       # Pure types — zero framework dependencies
├── commands/     # State mutations (11 command handlers)
├── queries/      # Read-only projections (5 query handlers)
├── events/       # Domain event bus
├── store/        # Supabase-backed data store
└── routes/       # Express REST API

client/src/
├── pages/        # Catalog → Cart → Shipping → Checkout → Confirmation
├── components/   # ProductCard, CartItem, PromoCodeInput, OrderSummary
└── api/          # API client
```

### Key Design Decisions

- **Commands are the only way to mutate state** — routes never modify the store directly
- **Every mutation triggers price recalculation** — totals are always consistent
- **Every command emits a domain event** — enabling future event-driven extensions
- **Domain layer is pure** — no Express, no React, just types and functions

## API

| Method | Endpoint | Command/Query |
|--------|----------|---------------|
| `POST` | `/api/carts` | CreateCart |
| `GET` | `/api/carts/:id` | GetCartDetails |
| `PUT` | `/api/carts/:id` | UpdateCart |
| `POST` | `/api/carts/:id/items` | AddCartItem |
| `PUT` | `/api/carts/:id/items/:itemId` | UpdateCartItem |
| `DELETE` | `/api/carts/:id/items/:itemId` | RemoveCartItem |
| `POST` | `/api/carts/:id/shipping-methods` | AddShippingMethod |
| `DELETE` | `/api/carts/:id/shipping-methods/:methodId` | RemoveShippingMethod |
| `POST` | `/api/carts/:id/credit-lines` | AddCreditLine |
| `DELETE` | `/api/carts/:id/credit-lines/:creditLineId` | RemoveCreditLine |
| `POST` | `/api/carts/:id/complete` | CompleteCart |
| `GET` | `/api/carts/:id/shipping-options` | GetCartShippingOptions |
| `GET` | `/api/carts/:id/checkout-summary` | GetCheckoutSummary |

## Pricing

All amounts are in **cents**. Displayed as dollars in the UI.

```
item.subtotal       = unitPrice × quantity
item.discountTotal  = sum(adjustments)
item.taxTotal       = (subtotal − discountTotal) × taxRate
item.total          = subtotal − discountTotal + taxTotal

cart.total          = sum(item.total) + shippingTotal − creditLineTotal
```

## Promo Codes

| Code | Type | Effect |
|------|------|--------|
| `SAVE5` | Fixed | $5 off per item |
| `VIP10` | Percentage | 10% off |
| `FREESHIP` | Free shipping | Removes shipping cost |

## License

MIT
