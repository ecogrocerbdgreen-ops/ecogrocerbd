# EcoGrocer BD — GitHub Pages storefront and Supabase backend

EcoGrocer BD's public storefront is served from GitHub Pages. GitHub is the source of truth for website code and version history; Supabase is the source of truth for live catalogue, delivery settings, order validation and order storage.

Netlify is intentionally left connected for the separate legacy Admin/API and optional payment integration. The public storefront does not require Netlify to render products or submit guest orders.

## Main application

- Public storefront: `index.html`, `style.css`, `script.js`, `product-detail.js`
- Product/category/cart pages: `product.html`, `category.html`, `cart.html`
- Checkout: `checkout.html`, `checkout.js`
- Public Supabase settings: `order-config.js` (publishable key only; safe for browser use)
- Order API: `supabase/functions/place-order/index.ts` (deployed as the `place-order` Supabase Edge Function)
- Database migrations: `supabase/migrations/`
- Separate legacy Netlify backend: `netlify/functions/api.mjs` and `netlify/functions/auth.mjs`
- Admin dashboard: `admin.html`, `admin.js`
- Legacy optional PHP/MySQL receiver: `hosting-api/` (not used by the public checkout)

## GitHub Pages and Supabase connection

The public website is served from the repository's GitHub Pages deployment. Its browser-side configuration in `order-config.js` uses only the Supabase project URL and a publishable API key.

The storefront reads active rows from Supabase through the Data API:
- `categories` — active category labels
- `products` — live price, unit, product image, featured flag and stock settings
- `delivery_areas` — active areas and current delivery charges
- `delivery_slots` — available delivery time slots

The migration `20261111113516_public_storefront_read_policies.sql` grants the browser roles read-only access to these four tables and limits the RLS policies to active rows. No public insert, update or delete permission is granted. The order, order-item, payment and admin-audit tables remain private to server-side functions.

The checkout sends guest orders to:

`https://ucwaoytakqldicdtoran.supabase.co/functions/v1/place-order`

The Edge Function checks the site's allowed origin and public API key, applies an IP-based rate limit, and calls the server-only `place_ecogrocer_order` database function. The database function ignores browser-sent prices, re-reads product prices, validates delivery areas, slots and coupons, recalculates the final total, and writes the order and items in one transaction. Never expose a Supabase secret/service-role key in browser code.

If Supabase catalogue reads are temporarily unavailable, the storefront keeps its bundled local catalogue and the checkout keeps its last-known HTML defaults. The order server remains authoritative for price, delivery fee, discount and inventory validation.

## Supabase project

- Project name: `ecogrocerbd-orders`
- Project ref: `ucwaoytakqldicdtoran`
- Region: Mumbai (`ap-south-1`)
- Database: PostgreSQL 17

The current schema includes:
- Categories and the 32-product starter catalogue
- Product stock tracking and transactional stock reservation
- Delivery areas and editable delivery slots
- Coupon rules and usage limits
- Orders, order items, customer account links and payment transaction records
- Server-only database functions for order placement, cancellation stock restoration and verified payment updates
- Row Level Security on all application tables

## Netlify retained as a separate legacy service

Netlify is not being disconnected as part of the current GitHub Pages + Supabase operating model. Its repository folder and site configuration are intentionally retained without modification.

The existing Netlify Functions are still used by the separate Admin dashboard API, customer OTP/order-history routes and optional SSLCOMMERZ processing. Those paths are not required for the public product catalogue or guest checkout. Do not delete the Netlify site or functions until those separate features have been migrated and tested.

Netlify environment variables, when those legacy endpoints are used, belong only in Netlify's secure environment settings. Never put Admin passwords, session secrets, payment gateway passwords or Supabase secret/service-role keys in GitHub or browser code.

## Customer phone OTP and account history

The account page still uses the legacy Netlify Auth/API routes. On the GitHub Pages domain it directs customers to Guest Checkout instead of calling those legacy routes. This remains separate from the public order flow and can be migrated to Supabase Auth in a later, independently tested change.

## Order processing and inventory

The database function `place_ecogrocer_order` ignores browser-submitted prices, re-reads product prices, validates the area, slot and coupon, recalculates the total, and reserves tracked inventory inside one database transaction. Cancelling an order restores only the quantity actually reserved on that order line.

Products have inventory tracking disabled by default because the starter catalogue does not represent confirmed physical stock. Enter real stock quantities and enable tracking only after a physical count.

## Payment processing

- Cash on Delivery is available without a gateway.
- The existing optional SSLCOMMERZ flow is in the retained Netlify backend and is not part of the GitHub Pages guest-order request.
- Live SSLCOMMERZ collection requires an approved merchant account, private credentials and tested callbacks.
- Do not set `SSLCOMMERZ_MODE=live` until the merchant account is approved and Sandbox callbacks have been tested.

## Ongoing development

1. Make website source-code changes in this GitHub repository.
2. Commit changes to the Pages production branch to publish the public storefront.
3. Make catalogue, delivery-area, slot and order-system changes in the Supabase project through reviewed SQL migrations and Edge Function deployments.
4. Verify GitHub Pages, Supabase Data API reads, and the `place-order` Edge Function after each relevant change.

The public order intake does not use Netlify Forms. The legacy Netlify Admin and payment functions remain intact as a separate service.
