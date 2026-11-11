# EcoGrocer BD — E-commerce storefront and backend

EcoGrocer BD is a static storefront on GitHub Pages. Customer orders are submitted to a Supabase Edge Function and stored in Supabase PostgreSQL. Netlify Functions remain in the repository for the separate Admin and payment integrations. Guest Checkout is the currently supported order flow; phone-OTP accounts require Auth/SMS setup.

## Main application

- Storefront: `index.html`, `style.css`, `script.js`, `product-detail.js`
- Checkout: `checkout.html`, `checkout.js`
- Customer account: `account.html`, `account.js`
- Order API: `supabase/functions/place-order/index.ts` (deployed as the `place-order` Supabase Edge Function)
- Database schema and seed: `supabase/migrations/20261111090000_ecommerce_core.sql`
- Order API rate limiting: `supabase/migrations/20261111090714_order_api_rate_limit.sql`
- Remaining Netlify backend: `netlify/functions/api.mjs` (Admin and optional payment processing)
- Admin dashboard: `admin.html`, `admin.js`
- Legacy optional PHP/MySQL receiver: `hosting-api/` (not used by the current Netlify API)

## Database setup (one-time)

The production database is the Supabase project `ecogrocerbd-orders` (`ucwaoytakqldicdtoran`, Mumbai region). The migrations in `supabase/migrations/` have been applied to that project. The core migration creates:
- Categories and the current 32-product starter catalogue
- Product stock tracking and transactional stock reservation
- Delivery areas and editable delivery slots
- Coupon rules and usage limits
- Orders, order items, customer account links and payment transaction records
- Restricted server-side functions for order placement, cancellation stock restoration and verified payment updates
- Row Level Security and service-role-only database access

The order Edge Function is deployed at `https://ucwaoytakqldicdtoran.supabase.co/functions/v1/place-order`. It accepts the website's public Supabase Publishable Key, rate-limits by a server-HMACed client IP (5 attempts per 10 minutes), and calls the server-only `place_ecogrocer_order` database function. The database function ignores browser-sent prices, recalculates prices, discounts and delivery charges, and writes the order and order items in one transaction. RLS is enabled on all order tables; direct `anon`/`authenticated` writes are revoked. Never expose the Supabase secret/service-role key in browser code.

## Netlify environment variables

Set these at **Project configuration → Environment variables**, with **Functions** scope, then redeploy:

### Required only if the remaining Netlify Admin/API routes are used
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — legacy public key for compatibility with the existing Netlify API
- `SUPABASE_SERVICE_ROLE_KEY` — private service-role key; server-side only
- `ADMIN_USERNAME` — Admin username (default: `admin`)
- `ADMIN_PASSWORD` — strong private Admin password
- `ADMIN_SESSION_SECRET` — long random secret used to sign 8-hour Admin sessions
- `SITE_URL` — public website origin, e.g. `https://ecogrocerbdgreen-ops.github.io/ecogrocerbd`

### Optional for SSLCOMMERZ hosted checkout
- `SSLCOMMERZ_STORE_ID`
- `SSLCOMMERZ_STORE_PASSWORD` — private merchant password
- `SSLCOMMERZ_MODE` — `sandbox` for tests, `live` only after merchant approval
- `SSLCOMMERZ_DEFAULT_CUSTOMER_EMAIL` — merchant-approved fallback email if a customer does not enter one

Never put gateway secrets or the Supabase service-role key in HTML, JavaScript, GitHub, or the public site.

## Customer phone OTP

The Customer Account uses Supabase Auth phone OTP:
1. Enable Phone sign-in under Supabase Auth Providers.
2. Configure an SMS provider in Supabase Auth (for example, Twilio, Vonage, or another supported provider).
3. Set sensible Auth OTP rate limits and enable CAPTCHA/abuse controls before public launch.

Without a working SMS provider, the Account page reports that OTP delivery is unavailable. Guest Checkout remains usable. Customer order history is available for orders linked to the verified customer phone/account.

## Order processing and inventory

The database function `place_ecogrocer_order` ignores browser-submitted prices, re-reads product prices, validates the area, slot and coupon, recalculates the total, and reserves tracked inventory inside one database transaction. Cancelling an order restores only the quantity actually reserved on that order line.

Products have inventory tracking disabled by default because the starter catalogue does not represent confirmed physical stock. Enter real stock quantities in Admin and enable tracking only after a physical count.

## Payment processing

- Cash on Delivery is available without a gateway.
- When SSLCOMMERZ merchant credentials are configured, bKash/Nagad/Rocket checkout choices open the SSLCOMMERZ hosted payment page.
- Payment is not marked paid merely because the browser returns to the site. The backend validates transaction ID, amount and BDT currency with the SSLCOMMERZ Validation API and also accepts the configured IPN callback.
- Risk-flagged transactions remain in pending verification for Admin review.
- If gateway credentials are absent, online-method orders remain in manual-verification status and the existing payer-number/Transaction-ID fields remain available.

Do not set `SSLCOMMERZ_MODE=live` until the merchant account has been approved and Sandbox callbacks have been tested.

## Admin dashboard

Open `/admin.html`. It provides:
- Dashboard metrics and recent orders
- Customer, address, delivery and order-item details
- Order status control (Pending, Confirmed, Processing, Out for Delivery, Delivered, Cancelled, Refunded)
- Payment status review and manual verification
- Product create/edit, visibility and stock tracking
- Delivery area fees and active/inactive delivery slots
- Coupon setup and usage limits

Admin API routes still use the Netlify Function and require an 8-hour HMAC-signed session plus the Netlify environment variables above. The public order intake no longer uses Netlify Forms.

## Current deployment state

- The live GitHub Pages Checkout posts directly to the Supabase `place-order` Edge Function.
- Supabase stores order headers and line items; the order RPC recalculates totals and checks delivery areas, slots and coupons.
- The legacy `ecogrocer-orders` Netlify Form is no longer used by the live Checkout.
- The Admin dashboard's Netlify API routes have not yet been moved to Supabase Edge Functions.
- Phone OTP requires a configured Supabase SMS provider; Guest Checkout does not require customer login.

## Not enabled without merchant/provider credentials

- Live SSLCOMMERZ payment collection requires an approved merchant account and its private credentials.
- Phone OTP requires a Supabase SMS provider and configured Auth Phone provider.
- Online payment is not represented as active until the credentials, callbacks and end-to-end validation have been tested.
