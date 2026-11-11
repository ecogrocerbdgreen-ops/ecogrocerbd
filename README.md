# EcoGrocer BD — E-commerce storefront and backend

EcoGrocer BD is a static storefront on Netlify with a same-origin Netlify Functions API and a Supabase PostgreSQL database. It supports Guest Checkout and phone-OTP customer accounts. Online payments use the SSLCOMMERZ hosted checkout flow when merchant credentials are configured; otherwise manual payment verification and Cash on Delivery remain available.

## Main application

- Storefront: `index.html`, `style.css`, `script.js`, `product-detail.js`
- Checkout: `checkout.html`, `checkout.js`
- Customer account: `account.html`, `account.js`
- Backend: `netlify/functions/api.mjs`
- Database schema and seed: `supabase/migrations/20261111090000_ecommerce_core.sql`
- Admin dashboard: `admin.html`, `admin.js`
- Legacy optional PHP/MySQL receiver: `hosting-api/` (not used by the current Netlify API)

## Database setup (one-time)

The database is Supabase PostgreSQL. Run the migration `supabase/migrations/20261111090000_ecommerce_core.sql` in the connected Supabase project's SQL Editor. It creates:
- Categories and the current 32-product starter catalogue
- Product stock tracking and transactional stock reservation
- Delivery areas and editable delivery slots
- Coupon rules and usage limits
- Orders, order items, customer account links and payment transaction records
- Restricted server-side functions for order placement, cancellation stock restoration and verified payment updates
- Row Level Security and service-role-only database access

The migration is self-contained. Do not expose the Supabase service-role key in browser code.

## Netlify environment variables

Set these at **Project configuration → Environment variables**, with **Functions** scope, then redeploy:

### Required for the live database and store admin
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — public/anon key, used only for Supabase Auth client flows
- `SUPABASE_SERVICE_ROLE_KEY` — private service-role key; server-side only
- `ADMIN_USERNAME` — Admin username (default: `admin`)
- `ADMIN_PASSWORD` — strong private Admin password
- `ADMIN_SESSION_SECRET` — long random secret used to sign 8-hour Admin sessions
- `SITE_URL` — public website origin, e.g. `https://ecogrocerbd.netlify.app`

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

Admin API routes require an 8-hour HMAC-signed session. During database setup, the previous Netlify Forms inbox remains linked from the Admin login panel.

## Graceful transition

Until Supabase credentials and migration are in place:
- The storefront uses the local catalogue fallback.
- Checkout falls back to the registered `ecogrocer-orders` Netlify Form when the database reports it is not configured.
- Customer OTP and Payment Gateway remain unavailable until their respective provider configuration is complete.
- The old Netlify Forms inbox remains accessible.

When the database is connected, the storefront automatically loads live products, checkout writes transactional orders, and Admin reads/writes the same database.

## Not enabled without merchant/provider credentials

- Live SSLCOMMERZ payment collection requires an approved merchant account and its private credentials.
- Phone OTP requires a Supabase SMS provider and configured Auth Phone provider.
- Online payment is not represented as active until the credentials, callbacks and end-to-end validation have been tested.
