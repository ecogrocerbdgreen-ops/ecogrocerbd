# EcoGrocer BD — PHP/MySQL order API

This folder contains the server-side order receiver for a separate PHP/MySQL hosting account. The public website is static on Netlify; Netlify does not execute PHP. Install this API on the PHP host and then set the endpoint URL in order-config.js.

## What the API does

- Receives JSON orders from the checkout form.
- Validates customer details, Bangladesh mobile number, area, address, delivery slot, payment method and cart items.
- Recalculates product prices, delivery fee, coupon discount and grand total on the server.
- Saves order details and item lines in MySQL with pending status.
- Restricts browser requests to the exact website origins in the private config.

## cPanel / PHP installation

1. Create a MySQL database and database user in cPanel; grant the user access to the database.
2. Open phpMyAdmin and run schema.sql.
3. Upload orders.php to a public HTTPS path such as public_html/api/orders.php. PHP 7.4+ and PDO MySQL must be enabled.
4. Create a private folder outside public_html, for example /home/CPANEL_USERNAME/private/.
5. Copy config.example.php to /home/CPANEL_USERNAME/private/ecogrocer-config.php. Replace the database name, username and password. Add the exact website origins to allowed_origins. Never commit real database credentials to GitHub or put the config inside public_html.
6. In order-config.js, set window.ECOGROCER_CONFIG.orderApiUrl to the full HTTPS endpoint, such as https://api.example.com/orders.php. This domain is only an example.
7. Publish the updated website and test one Cash on Delivery order. Confirm the row appears in ecogrocer_orders in phpMyAdmin.

## Still needed before live order acceptance

- The actual PHP hosting hostname / API URL.
- Database details entered privately on the hosting account.
- The production website domain added to allowed_origins.
- Final approved delivery rates and active coupon rules.
- Merchant account details and a payment gateway, if customers should pay online automatically.

## Important

- Current delivery fees and ECO10 / FRESH50 are provisional sample values; confirm them before launch.
- bKash, Nagad and Rocket currently collect a payment-method choice and optional payer number / transaction ID. This is not a live payment gateway and does not transfer money.
- WhatsApp summary opens only after a WhatsApp business number is configured in order-config.js; it is not sent automatically by the PHP API.
- Product prices in this API mirror the sample catalogue in script.js. Update both together when prices or pack sizes change.
