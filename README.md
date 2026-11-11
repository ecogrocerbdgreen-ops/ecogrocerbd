# EcoGrocer BD — E-commerce storefront and backend

EcoGrocer BD is a static storefront on Netlify with a same-origin Netlify Functions API and a Supabase PostgreSQL database. The storefront keeps its static catalogue as a graceful fallback until the database connection is configured.

## Current architecture

- Storefront: `index.html`, `style.css`, `script.js`, `product-detail.js`
- Checkout: `checkout.js` posts orders to `/.netlify/functions/api?action=orders`
- Backend: `netlify/functions/api.mjs`
- Database migration: `supabase/migrations/20261111090000_ecommerce_core.sql`
- Admin dashboard: `admin.html` and `admin.js`
- Legacy optional PHP/MySQL receiver: `hosting-api/` (not used by the new API)

## First-time database connection

The database is Supabase PostgreSQL. Apply the migration in `supabase/migrations/` to the connected Supabase project. The migration creates categories, the 32-product starter catalogue, delivery areas, delivery slots, coupons, orders, order items, stock reservation logic, cancellation stock restoration, and audit logging.

Set these environment variables on the Netlify site (Functions scope required):

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service-role secret; never expose it in browser code
- `ADMIN_USERNAME` — Admin login name (defaults to `admin`)
- `ADMIN_PASSWORD` — strong, private Admin password
- `ADMIN_SESSION_SECRET` — long random secret used to sign 8-hour Admin sessions

After changing environment variables, trigger a new Netlify deploy so the Functions receive the new values.

## Order processing and stock

The database function `place_ecogrocer_order` ignores browser-submitted prices, re-reads each product price, validates the area/slot/coupon, calculates all totals and reserves tracked stock inside one database transaction. A stock shortage or invalid product rejects the order. Cancelling an order restores its reserved stock.

Products with inventory tracking disabled remain available as untracked catalogue products until the operator enters real stock figures and enables tracking in Admin.

## Admin dashboard

Open `/admin.html`. It supports:
- Dashboard totals and recent orders
- Order status updates (Pending, Confirmed, Processing, Out for Delivery, Delivered, Cancelled, Refunded)
- Product create/edit/visibility and stock tracking
- Delivery area fee and activation management
- Coupon create/edit and expiry/usage limits

The Admin API requires a short-lived HMAC-signed session. Database service credentials remain server-side in Netlify Functions. The old Netlify Forms Inbox remains linked from the Admin login panel during cutover.

## Graceful transition

Before the Supabase connection is ready:
- The storefront continues to use its local 32-product catalogue.
- Checkout temporarily falls back to the already registered `ecogrocer-orders` Netlify Form.
- The Admin page keeps the old Netlify Forms Inbox link.

Once `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set and the SQL migration is applied, the storefront switches to live database products and the checkout writes to PostgreSQL automatically.

## Not activated yet

A real bKash/Nagad/Rocket payment gateway needs merchant onboarding credentials and server-side callback/IPN configuration. The current payment method selections are still marked for manual verification, not automatic money transfer. Customer OTP accounts and customer order history are the next delivery after the core store backend is connected. Do not accept online-payment selections as proof of payment until a gateway is configured.
