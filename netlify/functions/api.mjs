const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

const env = (key) => {
  try { return Netlify.env.get(key) || ""; } catch (_) { return ""; }
};

const baseUrl = () => env("SUPABASE_URL").replace(/\/$/, "");
const serviceKey = () => env("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = () => env("SUPABASE_ANON_KEY");
const siteUrl = () => (env("SITE_URL") || "https://ecogrocerbd.netlify.app").replace(/\/$/, "");

const b64url = (bytes) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromB64url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

async function issueAdminToken() {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ role: "admin", exp: Date.now() + 8 * 60 * 60 * 1000 })));
  const signature = b64url(await hmac(payload, env("ADMIN_SESSION_SECRET")));
  return payload + "." + signature;
}

async function requireAdmin(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (parts.length !== 2 || !env("ADMIN_SESSION_SECRET")) return false;
  try {
    const expected = await hmac(parts[0], env("ADMIN_SESSION_SECRET"));
    const actual = fromB64url(parts[1]);
    if (expected.length !== actual.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) mismatch |= expected[i] ^ actual[i];
    if (mismatch !== 0) return false;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
    return payload.role === "admin" && payload.exp > Date.now();
  } catch (_) {
    return false;
  }
}

async function sb(path, options = {}) {
  const url = baseUrl();
  const key = serviceKey();
  if (!url || !key) throw new Error("Database connection is not configured yet.");
  const response = await fetch(url + "/rest/v1/" + path, {
    method: options.method || "GET",
    headers: {
      apikey: key,
      authorization: "Bearer " + key,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!response.ok) {
    const message = data && typeof data === "object" ? (data.message || data.hint || data.details) : "";
    throw new Error(message || "Database request failed (" + response.status + ").");
  }
  return { data, response };
}

async function adminLogin(body) {
  const username = env("ADMIN_USERNAME") || "admin";
  const expectedPassword = env("ADMIN_PASSWORD");
  if (!expectedPassword || !env("ADMIN_SESSION_SECRET")) {
    return json({ error: "Admin credentials are not configured yet." }, 503);
  }
  const suppliedUser = String(body.username || "");
  const suppliedPassword = String(body.password || "");
  const encoder = new TextEncoder();
  const [expected, supplied] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(expectedPassword)),
    crypto.subtle.digest("SHA-256", encoder.encode(suppliedPassword)),
  ]);
  const a = new Uint8Array(expected);
  const b = new Uint8Array(supplied);
  let diff = suppliedUser === username ? 0 : 1;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return json({ error: "লগইন তথ্য সঠিক নয়।" }, 401);
  return json({ success: true, token: await issueAdminToken(), expiresIn: 28800 });
}

async function publicProducts() {
  const result = await sb("products?select=id,category_id,name,english_name,description,aliases,price,compare_at_price,unit,image_url,featured,track_inventory,stock_quantity&is_active=eq.true&order=sort_order.asc");
  return json({ products: result.data || [] }, 200, { "cache-control": "public, max-age=30, s-maxage=60" });
}

async function publicDeliveryAreas() {
  const result = await sb("delivery_areas?select=id,name,fee&is_active=eq.true&order=sort_order.asc");
  return json({ areas: result.data || [] }, 200, { "cache-control": "public, max-age=60, s-maxage=120" });
}

async function getCustomer(request) {
  const bearer = request.headers.get("authorization") || "";
  if (!/^Bearer\s+.+/i.test(bearer)) return null;
  if (!baseUrl() || !anonKey()) throw new Error("Customer account authentication is not configured yet.");
  const response = await fetch(baseUrl() + "/auth/v1/user", {
    headers: { apikey: anonKey(), authorization: bearer }
  });
  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user.id) throw new Error("আপনার Login মেয়াদ শেষ। আবার OTP দিয়ে Login করুন।");
  return user;
}

const normalizedPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("8801") && digits.length === 13) return "0" + digits.slice(3);
  return digits;
};

async function publicConfig() {
  return json({
    supabaseUrl: baseUrl(),
    supabaseAnonKey: anonKey(),
    phoneOtpEnabled: Boolean(baseUrl() && anonKey())
  });
}

async function customerOrders(request) {
  const user = await getCustomer(request);
  if (!user) return json({ error: "অর্ডার দেখতে আগে মোবাইল OTP দিয়ে Login করুন।" }, 401);
  const phone = normalizedPhone(user.phone);
  const query = new URLSearchParams({
    select: "id,order_number,status,payment_method,payment_status,grand_total,created_at,delivery_area_name,delivery_slot_id,order_items(product_name,unit,quantity,unit_price,line_total)",
    order: "created_at.desc",
    limit: "100",
  });
  if (phone) query.set("or", "(customer_user_id.eq." + user.id + ",customer_phone.eq." + phone + ")");
  else query.set("customer_user_id", "eq." + user.id);
  const result = await sb("orders?" + query.toString());
  return json({ orders: result.data || [], phone: user.phone || "" });
}

async function placeOrder(body, request) {
  const user = await getCustomer(request);
  if (user) {
    const verifiedPhone = normalizedPhone(user.phone);
    const orderPhone = normalizedPhone(body && body.customer && body.customer.phone);
    if (!verifiedPhone || verifiedPhone !== orderPhone) {
      return json({ error: "আপনার Account-এর Verified মোবাইল নম্বরের সঙ্গে Checkout নম্বর মিলছে না। একই নম্বর ব্যবহার করুন অথবা Logout করে Guest Checkout করুন।" }, 422);
    }
  }
  const result = await sb("rpc/place_ecogrocer_order", {
    method: "POST",
    body: { p_order: body, p_customer_user_id: user ? user.id : null }
  });
  return json(result.data, 201);
}

const sslConfig = () => ({
  storeId: env("SSLCOMMERZ_STORE_ID"),
  storePassword: env("SSLCOMMERZ_STORE_PASSWORD"),
  defaultEmail: env("SSLCOMMERZ_DEFAULT_CUSTOMER_EMAIL"),
  mode: (env("SSLCOMMERZ_MODE") || "sandbox").toLowerCase(),
});

const sslBase = () => sslConfig().mode === "live"
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";

async function initSslPayment(orderNumber) {
  const cfg = sslConfig();
  if (!cfg.storeId || !cfg.storePassword) {
    return json({ enabled: false, message: "অনলাইন Payment Gateway এখনো Merchant Credentials দিয়ে চালু করা হয়নি। আপাতত Manual Payment ব্যবহার করুন।" });
  }
  const orders = await sb("orders?select=id,order_number,customer_name,customer_email,customer_phone,full_address,grand_total,payment_status,payment_method&order_number=eq." + encodeURIComponent(orderNumber) + "&limit=1");
  const order = (orders.data || [])[0];
  if (!order) return json({ error: "অর্ডার পাওয়া যায়নি।" }, 404);
  if (order.payment_method === "cod") return json({ error: "Cash on Delivery অর্ডারে Online Payment প্রয়োজন নেই।" }, 422);
  if (order.payment_status === "paid") return json({ error: "এই অর্ডারের পেমেন্ট ইতিমধ্যে সম্পন্ন হয়েছে।" }, 409);
  if (!order.customer_email && !cfg.defaultEmail) {
    return json({ enabled: false, message: "Online Payment-এর জন্য একটি ইমেইল ঠিকানা প্রয়োজন। Checkout-এ ইমেইল দিন অথবা Admin-এর মাধ্যমে Default Email সেট করুন।" });
  }

  const tranId = order.order_number + "-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const apiUrl = siteUrl() + "/.netlify/functions/api";
  const fields = new URLSearchParams({
    store_id: cfg.storeId,
    store_passwd: cfg.storePassword,
    total_amount: Number(order.grand_total).toFixed(2),
    currency: "BDT",
    tran_id: tranId,
    success_url: apiUrl + "?action=payments/callback&type=success",
    fail_url: apiUrl + "?action=payments/callback&type=fail",
    cancel_url: apiUrl + "?action=payments/callback&type=cancel",
    ipn_url: apiUrl + "?action=payments/ipn",
    cus_name: order.customer_name,
    cus_email: order.customer_email || cfg.defaultEmail,
    cus_add1: String(order.full_address || "Dhaka").slice(0, 120),
    cus_city: "Dhaka",
    cus_postcode: "1212",
    cus_country: "Bangladesh",
    cus_phone: order.customer_phone,
    shipping_method: "NO",
    num_of_item: "1",
    product_name: "EcoGrocer BD Order " + order.order_number,
    product_category: "Grocery",
    product_profile: "general",
  });
  const response = await fetch(sslBase() + "/gwprocess/v4/api.php", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: fields.toString(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.GatewayPageURL || data.status !== "SUCCESS") {
    console.error("SSLCOMMERZ session creation failed:", data);
    return json({ error: "Payment Session তৈরি করা যায়নি। Merchant Settings যাচাই করে আবার চেষ্টা করুন।" }, 502);
  }
  await sb("payment_transactions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: {
      order_id: order.id,
      gateway: "sslcommerz",
      gateway_transaction_id: tranId,
      session_key: data.sessionkey || "",
      amount: Number(order.grand_total),
      currency: "BDT",
      status: "initiated",
      raw_response: { status: data.status, sessionkey: data.sessionkey || "" },
    },
  });
  await sb("orders?id=eq." + encodeURIComponent(order.id), {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { payment_gateway: "sslcommerz", payment_gateway_transaction_id: tranId }
  });
  return json({ enabled: true, paymentUrl: data.GatewayPageURL, transactionId: tranId });
}

async function readGatewayPayload(request) {
  if (request.method === "GET") return Object.fromEntries(new URL(request.url).searchParams.entries());
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await request.json().catch(() => ({}));
  const form = await request.formData().catch(() => null);
  return form ? Object.fromEntries(form.entries()) : {};
}

async function setPaymentStatus(orderId, paymentStatus, tranId, valId, bankTranId, raw) {
  const params = {
    p_order_id: orderId,
    p_payment_status: paymentStatus,
    p_gateway: "sslcommerz",
    p_gateway_transaction_id: tranId,
    p_validation_id: valId || "",
    p_bank_transaction_id: bankTranId || "",
    p_response: raw || {},
  };
  const result = await sb("rpc/set_ecogrocer_payment_status", { method: "POST", body: params });
  return result.data;
}

async function validateSslPayment(payload) {
  const cfg = sslConfig();
  if (!cfg.storeId || !cfg.storePassword) throw new Error("Payment Gateway is not configured.");
  const valId = String(payload.val_id || "");
  const tranId = String(payload.tran_id || "");
  if (!valId || !tranId) throw new Error("Payment Validation তথ্য অসম্পূর্ণ।");
  const attempts = await sb("payment_transactions?select=id,order_id,gateway_transaction_id,amount,currency,status&gateway_transaction_id=eq." + encodeURIComponent(tranId) + "&limit=1");
  const attempt = (attempts.data || [])[0];
  if (!attempt || attempt.gateway_transaction_id !== tranId) throw new Error("Payment Transaction রেকর্ড পাওয়া যায়নি।");

  const validationUrl = sslBase() + "/validator/api/validationserverAPI.php?" + new URLSearchParams({
    val_id: valId,
    store_id: cfg.storeId,
    store_passwd: cfg.storePassword,
    format: "json",
  }).toString();
  const response = await fetch(validationUrl, { headers: { accept: "application/json" } });
  const validation = await response.json().catch(() => ({}));
  const status = String(validation.status || "").toUpperCase();
  const amount = Number(validation.amount);
  const amountMatches = Number.isFinite(amount) && Math.abs(amount - Number(attempt.amount)) < 0.01;
  const currencyMatches = String(validation.currency || "").toUpperCase() === "BDT";
  const transactionMatches = String(validation.tran_id || "") === tranId;
  const valid = response.ok && ["VALID", "VALIDATED"].includes(status) && amountMatches && currencyMatches && transactionMatches;

  const risk = String(validation.risk_level || "0") === "1";
  const paymentStatus = valid ? (risk ? "pending_verification" : "paid") : "failed";
  await setPaymentStatus(
    attempt.order_id, paymentStatus, tranId, valId,
    String(validation.bank_tran_id || ""), validation
  );
  return { valid, risk, paymentStatus, orderId: tranId.split("-").slice(0, 2).join("-"), validation };
}

function paymentResultPage(title, message, orderNumber, success = false) {
  const safe = (value) => String(value || "").replace(/[&<>"']/g, (ch) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
  return new Response("<!doctype html><html lang='bn'><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'><title>EcoGrocer BD Payment</title><body style='font-family:system-ui,sans-serif;background:#f4f8f4;color:#183329;display:grid;place-items:center;min-height:100vh;margin:0'><main style='max-width:520px;margin:24px;background:white;padding:32px;border-radius:20px;box-shadow:0 12px 40px #18332914'><h1>" + safe(title) + "</h1><p>" + safe(message) + "</p><p>Order: <strong>" + safe(orderNumber) + "</strong></p><a href='" + siteUrl() + "'>EcoGrocer BD-তে ফিরে যান</a></main></body></html>", {
    status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });
}

async function handlePaymentCallback(request, type) {
  const payload = await readGatewayPayload(request);
  const tranId = String(payload.tran_id || "");
  if (type === "success") {
    const result = await validateSslPayment(payload);
    const orderNumber = tranId.split("-").slice(0, 2).join("-");
    if (result.valid && !result.risk) {
      return paymentResultPage("পেমেন্ট সফল হয়েছে", "আপনার পেমেন্ট যাচাই করে গ্রহণ করা হয়েছে।", orderNumber, true);
    }
    if (result.valid && result.risk) {
      return paymentResultPage("পেমেন্ট যাচাই চলছে", "লেনদেনটি অতিরিক্ত যাচাইয়ের জন্য রাখা হয়েছে। EcoGrocer BD টিম নিশ্চিত করে জানাবে।", orderNumber);
    }
    return paymentResultPage("পেমেন্ট যাচাই হয়নি", "লেনদেনটি সফল হিসেবে নিশ্চিত করা যায়নি। অর্ডারটি নিশ্চিত করতে আমাদের টিমের সঙ্গে যোগাযোগ করুন।", orderNumber);
  }

  if (tranId) {
    const attempts = await sb("payment_transactions?select=order_id,gateway_transaction_id&gateway_transaction_id=eq." + encodeURIComponent(tranId) + "&limit=1");
    const attempt = (attempts.data || [])[0];
    if (attempt) {
      await setPaymentStatus(attempt.order_id, "failed", tranId, "", "", { callback: type });
    }
  }
  return paymentResultPage(type === "cancel" ? "পেমেন্ট বাতিল হয়েছে" : "পেমেন্ট সম্পন্ন হয়নি",
    "আপনার অর্ডারটি সংরক্ষিত আছে। প্রয়োজনে আবার চেষ্টা করুন বা Cash on Delivery বেছে নিন।",
    tranId.split("-").slice(0, 2).join("-"));
}

async function handlePaymentIpn(request) {
  const payload = await readGatewayPayload(request);
  const result = await validateSslPayment(payload);
  return new Response(result.valid ? "IPN processed" : "IPN rejected", {
    status: result.valid ? 200 : 400,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
  });
}

async function adminPaymentStatus(body) {
  const orderId = String(body.orderId || "");
  const status = String(body.paymentStatus || "");
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !["paid","failed","refunded","pending_verification"].includes(status)) {
    return json({ error: "পেমেন্ট Status বা Order ID সঠিক নয়।" }, 422);
  }
  const result = await sb("orders?id=eq." + encodeURIComponent(orderId), {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: { payment_status: status, updated_at: new Date().toISOString() }
  });
  await sb("admin_audit_log", {
    method: "POST", headers: { Prefer: "return=minimal" },
    body: { action: "manual_payment_status_changed", entity_type: "order", entity_id: orderId, details: { payment_status: status } }
  });
  return json({ success: true, order: (result.data || [])[0] || null });
}

async function exactCount(path) {
  const result = await sb(path, { headers: { Prefer: "count=exact", Range: "0-0" } });
  const range = result.response.headers.get("content-range") || "";
  const total = Number(range.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

async function adminDashboard() {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
  const dayStart = new Date(dateParts + "T00:00:00+06:00").toISOString();
  const dayEnd = new Date(new Date(dayStart).getTime() + 86400000).toISOString();
  const todayQuery = new URLSearchParams({
    select: "grand_total",
    created_at: "gte." + dayStart,
  }).toString() + "&created_at=lt." + encodeURIComponent(dayEnd);

  const [orders, totalOrders, pendingOrders, todayOrders, products] = await Promise.all([
    sb("orders?select=id,order_number,status,payment_status,grand_total,created_at,customer_name,customer_phone&order=created_at.desc&limit=12"),
    exactCount("orders?select=id"),
    exactCount("orders?select=id&status=eq.pending"),
    sb("orders?" + todayQuery),
    sb("products?select=id,is_active,track_inventory,stock_quantity")
  ]);
  const todayList = todayOrders.data || [];
  const productList = products.data || [];
  return json({
    orders: orders.data || [],
    metrics: {
      totalOrders,
      pendingOrders,
      todaysOrders: todayList.length,
      todaysSales: todayList.reduce((sum, order) => sum + Number(order.grand_total || 0), 0),
      activeProducts: productList.filter((product) => product.is_active).length,
      lowStock: productList.filter((product) => product.track_inventory && product.stock_quantity <= 5).length,
    }
  });
}

async function adminOrders(url) {
  const status = url.searchParams.get("status");
  const query = new URLSearchParams({ select: "*,order_items(*)", order: "created_at.desc", limit: "200" });
  if (status && status !== "all") query.set("status", "eq." + status);
  const result = await sb("orders?" + query.toString());
  return json({ orders: result.data || [] });
}

async function adminProducts() {
  const result = await sb("products?select=*&order=category_id.asc,sort_order.asc,name.asc");
  return json({ products: result.data || [] });
}

async function saveProduct(body) {
  const id = String(body.id || "").trim();
  if (!/^[a-z0-9-]{2,32}$/i.test(id)) return json({ error: "Product ID সঠিক নয়।" }, 422);
  const price = Number(body.price);
  const stock = Number(body.stock_quantity || 0);
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    return json({ error: "Price বা Stock Quantity সঠিক নয়।" }, 422);
  }
  const product = {
    id,
    category_id: String(body.category_id || "grocery"),
    name: String(body.name || "").trim(),
    english_name: String(body.english_name || "").trim(),
    description: String(body.description || "").trim(),
    price,
    unit: String(body.unit || "").trim(),
    image_url: String(body.image_url || "").trim(),
    featured: Boolean(body.featured),
    is_active: body.is_active !== false,
    track_inventory: Boolean(body.track_inventory),
    stock_quantity: stock,
    updated_at: new Date().toISOString(),
  };
  if (!product.name || !product.unit) return json({ error: "পণ্যের নাম ও Unit দিন।" }, 422);
  const result = await sb("products?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: product,
  });
  return json({ success: true, product: (result.data || [])[0] || product });
}

async function updateOrderStatus(body) {
  const orderId = String(body.orderId || "");
  const status = String(body.status || "");
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: "Order ID সঠিক নয়।" }, 422);
  const result = await sb("rpc/set_ecogrocer_order_status", {
    method: "POST",
    body: { p_order_id: orderId, p_status: status },
  });
  return json(result.data);
}

async function saveCoupon(body) {
  const code = String(body.code || "").trim().toUpperCase();
  const type = String(body.discount_type || "");
  const value = Number(body.discount_value);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code) || !["fixed", "percent"].includes(type) || !Number.isFinite(value) || value <= 0) {
    return json({ error: "কুপনের তথ্য সঠিক নয়।" }, 422);
  }
  const coupon = {
    code,
    discount_type: type,
    discount_value: value,
    max_discount: body.max_discount === "" || body.max_discount == null ? null : Number(body.max_discount),
    minimum_order: Number(body.minimum_order || 0),
    usage_limit: body.usage_limit === "" || body.usage_limit == null ? null : Number(body.usage_limit),
    expires_at: body.expires_at || null,
    is_active: body.is_active !== false,
  };
  const result = await sb("coupons?on_conflict=code", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: coupon,
  });
  return json({ success: true, coupon: (result.data || [])[0] || coupon });
}

async function adminCoupons() {
  const result = await sb("coupons?select=*&order=code.asc");
  return json({ coupons: result.data || [] });
}

async function saveDeliveryArea(body) {
  const id = String(body.id || "");
  const fee = Number(body.fee);
  if (!/^[a-z0-9-]{2,40}$/i.test(id) || !Number.isFinite(fee) || fee < 0) {
    return json({ error: "Delivery Area তথ্য সঠিক নয়।" }, 422);
  }
  const area = { id, name: String(body.name || "").trim(), fee, is_active: body.is_active !== false };
  if (!area.name) return json({ error: "এলাকার নাম দিন।" }, 422);
  const result = await sb("delivery_areas?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: area,
  });
  return json({ success: true, area: (result.data || [])[0] || area });
}

async function adminDeliveryAreas() {
  const result = await sb("delivery_areas?select=*&order=sort_order.asc");
  return json({ areas: result.data || [] });
}

export default async (request) => {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "";
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

  try {
    if (action === "admin/login" && method === "POST") {
      return await adminLogin(await request.json());
    }

    if (action === "public-config" && method === "GET") return await publicConfig();
    if (action === "account/orders" && method === "GET") return await customerOrders(request);
    if (action === "payments/callback") return await handlePaymentCallback(request, url.searchParams.get("type") || "success");
    if (action === "payments/ipn" && method === "POST") return await handlePaymentIpn(request);
    if (action === "payments/init" && method === "POST") {
      const body = await request.json();
      return await initSslPayment(String(body.orderId || ""));
    }

    const publicActions = action === "products" || action === "delivery-areas" || action === "orders";
    if (!publicActions && !(await requireAdmin(request))) {
      return json({ error: "Admin session expired. আবার Login করুন।" }, 401);
    }

    if (action === "products" && method === "GET") return await publicProducts();
    if (action === "delivery-areas" && method === "GET") return await publicDeliveryAreas();
    if (action === "orders" && method === "POST") return await placeOrder(await request.json(), request);

    if (action === "admin/dashboard" && method === "GET") return await adminDashboard();
    if (action === "admin/orders" && method === "GET") return await adminOrders(url);
    if (action === "admin/products" && method === "GET") return await adminProducts();
    if (action === "admin/products" && (method === "POST" || method === "PUT")) return await saveProduct(await request.json());
    if (action === "admin/products" && method === "DELETE") {
      const id = url.searchParams.get("id") || "";
      await sb("products?id=eq." + encodeURIComponent(id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: { is_active: false } });
      return json({ success: true });
    }
    if (action === "admin/order-status" && method === "POST") return await updateOrderStatus(await request.json());
    if (action === "admin/payment-status" && method === "POST") return await adminPaymentStatus(await request.json());
    if (action === "admin/coupons" && method === "GET") return await adminCoupons();
    if (action === "admin/coupons" && method === "POST") return await saveCoupon(await request.json());
    if (action === "admin/delivery-areas" && method === "GET") return await adminDeliveryAreas();
    if (action === "admin/delivery-areas" && method === "POST") return await saveDeliveryArea(await request.json());

    return json({ error: "API route not found." }, 404);
  } catch (error) {
    console.error("EcoGrocer API error:", error);
    const message = error && error.message ? error.message : "Request could not be completed.";
    const status = /not configured/i.test(message) ? 503 : 400;
    return json({ error: message }, status);
  }
};



export const config = {
  rateLimit: {
    action: "rate_limit",
    aggregateBy: "ip",
    windowSize: 60,
    windowLimit: 180,
  },
};
