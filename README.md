# EcoGrocer BD — homepage and checkout

A standalone, mobile-first EcoGrocer BD storefront built with HTML, CSS and vanilla JavaScript. The site is published on Netlify, and customer checkout submissions are stored with Netlify Forms for review in the authenticated site dashboard.

## Main files

- index.html — storefront, navigation, category/product sections, cart drawer and checkout form.
- style.css — responsive storefront, product cards, cart and checkout styling.
- script.js — 32 sample catalogue products, search, local cart and product interactions.
- checkout.js — product-to-checkout flow, delivery-area search, running totals, sample coupons and Netlify Forms order submission.
- order-config.js — legacy PHP endpoint placeholder and WhatsApp business number setting.
- admin.html — secure shortcut to the Netlify Forms order inbox (Netlify team login required).
- hosting-api/orders.php — PHP order receiver with server-side price/coupon/delivery recalculation.
- hosting-api/schema.sql — MySQL table for order records.
- hosting-api/config.example.php — template for private DB/CORS configuration; never put real credentials in GitHub.
- PRODUCT-PRICE-SOURCES.md and IMAGE-CREDITS.md — catalogue reference notes and photo credits.

## Checkout flow included

- Clicking a product image or product name opens the order form and places one unit in the cart if it is not already there.
- Product cards use an explicit Add to Cart button; quantity controls appear after adding.
- Checkout includes customer name and mobile number, searchable Gulshan-area selection, Block, Road, House/Flat, full address, delivery time, optional notes, COD/bKash/Nagad/Rocket method selection, coupon entry and a live order summary.
- Sample delivery fees update when the area changes. Sample coupons: ECO10 and FRESH50.
- Order Confirm submits the customer details, item list, pricing snapshot, delivery data and pending status to the site's Netlify Forms inbox.

## Important before accepting real orders

Netlify Forms is enabled for the site. After the updated deployment is published, accepted checkout submissions are stored on Netlify and appear in Site Dashboard → Forms → `ecogrocer-orders`. Use the `admin.html` shortcut to open the authenticated order inbox. No cPanel database or public API URL is required for this flow.

The existing `hosting-api/` PHP/MySQL files are an optional alternative for a separately managed PHP host; they are not used by the current Netlify Forms checkout.

Delivery fees and the ECO10 / FRESH50 coupon rules are sample values; confirm the final rates and offers before launch. bKash, Nagad and Rocket are currently method selections with optional payer details, not automatic payment-gateway integrations. A WhatsApp summary link appears only after an actual order is accepted and a business WhatsApp number has been configured.

## Catalogue and pricing

The 32 products are editable in the PRODUCTS array in script.js. Values are prototype reference prices, not guaranteed EcoGrocer retail prices or live supplier stock. Submitted totals are a catalogue snapshot from the checkout page and must be checked by the admin before confirming an order.

## Run locally

Open index.html in a modern browser, or serve this folder with a local static server. No build command or package installation is required for the storefront.


## Product detail experience

- Clicking the product card or product name opens a full-screen product details view.
- Clicking the product photo opens a separate enlarged image lightbox.
- Product detail content includes the product description, unit/pack size, listed price and availability note.
- Actions are separated: Order Now opens checkout for that product; Add to Cart only adds it to the cart; WhatsApp and Call use shop contact numbers from order-config.js.
- Related products from the same category appear beneath the product description.
- Configure order-config.js with the actual shop WhatsApp number and telephone number. Contact actions intentionally show a message until real contact details are supplied.


## Dedicated checkout page

Product detail's **Order Now** action navigates to checkout.html?product=<product-id>. The dedicated page restores the browser cart from localStorage, adds the selected product if needed, and opens the full-page order form. If the cart is empty, it shows a clear link back to product browsing. The cart drawer checkout button remains available on the homepage.
