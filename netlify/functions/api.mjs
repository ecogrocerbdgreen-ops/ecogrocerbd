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

async function placeOrder(body) {
  const result = await sb("rpc/place_ecogrocer_order", { method: "POST", body: { p_order: body } });
  return json(result.data, 201);
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

    const publicActions = action === "products" || action === "delivery-areas" || action === "orders";
    if (!publicActions && !(await requireAdmin(request))) {
      return json({ error: "Admin session expired. আবার Login করুন।" }, 401);
    }

    if (action === "products" && method === "GET") return await publicProducts();
    if (action === "delivery-areas" && method === "GET") return await publicDeliveryAreas();
    if (action === "orders" && method === "POST") return await placeOrder(await request.json());

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
