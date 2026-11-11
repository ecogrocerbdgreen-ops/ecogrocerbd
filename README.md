# EcoGrocer BD — homepage and checkout

A standalone, mobile-first EcoGrocer BD storefront built with HTML, CSS and vanilla JavaScript. The site is published as a static Netlify site; the optional PHP/MySQL order API is intended for the separate hosting account.

## Main files

- index.html — storefront, navigation, category/product sections, cart drawer and checkout form.
- style.css — responsive storefront, product cards, cart and checkout styling.
- script.js — 32 sample catalogue products, search, local cart and product interactions.
- checkout.js — product-to-checkout flow, delivery-area search, running totals, sample coupons and order API client.
- order-config.js — safe placeholders for the PHP order API URL and WhatsApp business number.
- hosting-api/orders.php — PHP order receiver with server-side price/coupon/delivery recalculation.
- hosting-api/schema.sql — MySQL table for order records.
- hosting-api/config.example.php — template for private DB/CORS configuration; never put real credentials in GitHub.
- PRODUCT-PRICE-SOURCES.md and IMAGE-CREDITS.md — catalogue reference notes and photo credits.

## Checkout flow included

- Clicking a product image or product name opens the order form and places one unit in the cart if it is not already there.
- Product cards use an explicit Add to Cart button; quantity controls appear after adding.
- Checkout includes customer name and mobile number, searchable Gulshan-area selection, Block, Road, House/Flat, full address, delivery time, optional notes, COD/bKash/Nagad/Rocket method selection, coupon entry and a live order summary.
- Sample delivery fees update when the area changes. Sample coupons: ECO10 and FRESH50.
- The PHP API validates the cart and recalculates all prices on the server before saving an order to MySQL.

## Important before accepting real orders

The current Netlify website is static. It does not run PHP or write orders to your separate hosting server by itself. The checkout UI is in place, but order submission stays safely disabled until the PHP API is installed and its HTTPS URL is added to order-config.js.

Follow hosting-api/README.md to install the PHP endpoint and MySQL table on cPanel/PHP hosting. Do not share database passwords in chat or commit them to GitHub.

Delivery fees and the ECO10 / FRESH50 coupon rules are sample values; confirm the final rates and offers before launch. bKash, Nagad and Rocket are currently method selections with optional payer details, not automatic payment-gateway integrations. A WhatsApp summary link appears only after an actual order is accepted and a business WhatsApp number has been configured.

## Catalogue and pricing

The 32 products are editable in the PRODUCTS array in script.js. Values are prototype reference prices, not guaranteed EcoGrocer retail prices or live supplier stock. The PHP product-price allowlist in hosting-api/orders.php must be kept in sync with script.js when prices or pack sizes change.

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
