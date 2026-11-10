# EcoGrocer BD — Mobile-first homepage package

A standalone Phase 1 website build based on the HTML/CSS structure shared in the conversation, redesigned around EcoGrocer BD and its four agreed product categories.

## Included files

- `index.html` — mobile-first homepage, desktop navigation, mobile drawer, search, category anchors, featured section, category product sections, footer, cart drawer, and login preview.
- `style.css` — responsive design system, mobile-safe spacing, two-column product cards on phones, desktop breakpoints, fixed mobile bottom navigation, menu/cart panels, and blank image canvases.
- `script.js` — 32 editable sample products (8 per category), Bangla/English/Banglish search, category filtering via anchors, local browser cart, quantity changes, subtotal, hero slider, and menu/cart interactions.
- `PRODUCT-PRICE-SOURCES.md` — dated reference notes for starter product prices and pack sizes.
- `netlify.toml` — static publish configuration; no build command is required.
- `.gitignore` — excludes local Netlify state and common editor/OS files.

## Categories and starter products

| Category | Product count |
|---|---:|
| Grocery | 8 |
| Vegetables | 8 |
| Meat | 8 |
| Fish | 8 |
| **Total** | **32** |

All product and category image areas are intentionally blank placeholder canvases. No real product photography has been added.

## Run locally

Open `index.html` directly in a modern browser, or serve this folder with a local static server. No Node build, package install, Firebase setup, or API key is required for the current phase.

## Implemented in this package

- Responsive mobile-first homepage and desktop layout.
- Sticky compact header and desktop navigation.
- Three-slide hero carousel with manual dots, timed rotation, and reduced-motion support.
- Mobile slide-out menu with Home, Category, Search, Products, How to Order, and Login/Account links.
- Fixed mobile bottom navigation: Home, Category, Search, Cart, Account.
- Search across Bangla, English, and common Banglish product terms.
- 4 category sections with 8 products per category.
- Product cards with blank image canvases, sample unit/price, and add/quantity controls.
- Cart drawer with localStorage persistence, line totals, item count, and subtotal.
- Accessible labels, focus states, Escape key handling, and reduced-motion support.

## Not connected / next phase

- Login and customer registration are UI previews only; Firebase Authentication is not connected.
- Checkout, payment, order creation, order tracking, delivery fees, Market Request, wishlist, chatbot, and Admin Dashboard are not implemented in this Phase 1 homepage package.
- Cart data remains in the visitor's current browser only. It is not sent to any server.
- Product names, pack sizes, and prices are directly editable in the `PRODUCTS` array near the top of `script.js`. They are reference values, not confirmed EcoGrocer selling prices or live data. Confirm each price with suppliers before taking real orders.

## Security and branding notes

- No old EkNok branding, address, WhatsApp number, payment number, Firebase config, or customer data has been carried into this package.
- Do not add Firebase credentials or payment secrets to frontend code. Use Firebase Security Rules and trusted server-side validation in the later backend phase.

## Netlify deployment

This is a static site. Publish the contents of this folder as the site root (the directory containing `index.html`). The code package is not deployed to the existing Netlify project from this step.