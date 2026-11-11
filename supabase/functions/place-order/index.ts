const allowedOrigins = new Set([
  "https://ecogrocerbdgreen-ops.github.io",
]);

const encoder = new TextEncoder();

function json(data: unknown, status = 200, origin = "") {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "vary": "Origin",
  });
  if (origin && allowedOrigins.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "POST, OPTIONS");
    headers.set("access-control-allow-headers", "apikey, content-type, x-client-info");
    headers.set("access-control-max-age", "86400");
  }
  return new Response(status === 204 ? null : JSON.stringify(data), { status, headers });
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

function getPublishableKeys() {
  const values: string[] = [];
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "";
  if (raw) {
    try {
      const keys = JSON.parse(raw);
      if (keys && typeof keys === "object") {
        Object.values(keys).forEach((value) => {
          if (typeof value === "string" && value) values.push(value);
        });
      }
    } catch (_) {
      // The legacy anon key remains a compatibility option during API-key migration.
    }
  }
  const legacyAnon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (legacyAnon) values.push(legacyAnon);
  return [...new Set(values)];
}

function getSecretKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS") || "";
  if (raw) {
    try {
      const keys = JSON.parse(raw);
      if (keys && typeof keys.default === "string") return keys.default;
    } catch (_) {
      // Fall back to the legacy service-role JWT during API-key migration.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

async function callDatabaseRpc(
  supabaseUrl: string,
  serverKey: string,
  functionName: string,
  args: Record<string, unknown>,
) {
  const headers = new Headers({
    "apikey": serverKey,
    "content-type": "application/json",
    "accept": "application/json",
  });

  // Legacy service_role keys are JWTs; new sb_secret_ keys must only use apikey.
  if (serverKey.startsWith("eyJ")) {
    headers.set("authorization", "Bearer " + serverKey);
  }

  const response = await fetch(
    (supabaseUrl.endsWith("/") ? supabaseUrl.slice(0, -1) : supabaseUrl) + "/rest/v1/rpc/" + encodeURIComponent(functionName),
    { method: "POST", headers, body: JSON.stringify(args) },
  );
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!response.ok) {
    const detail = data && typeof data === "object"
      ? data as Record<string, unknown>
      : {};
    return {
      data: null,
      error: {
        code: String(detail.code || response.status),
        message: String(detail.message || detail.details || "Database request failed."),
      },
    };
  }
  return { data, error: null };
}

async function hashClientIp(ip: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(ip)),
  );
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") || "";
  if (origin && !allowedOrigins.has(origin)) {
    return json({ error: "এই ওয়েবসাইট থেকে অর্ডার গ্রহণ করা হচ্ছে না।" }, 403);
  }

  if (request.method === "OPTIONS") return json({ ok: true }, 204, origin);
  if (request.method !== "POST") {
    return json({ error: "শুধু POST request গ্রহণযোগ্য।" }, 405, origin);
  }

  const expectedKeys = getPublishableKeys();
  const providedKey = request.headers.get("apikey") || "";
  if (!expectedKeys.length || !providedKey ||
      !expectedKeys.some((expectedKey) => constantTimeEqual(providedKey, expectedKey))) {
    return json({ error: "Supabase API key সঠিক নয়।" }, 401, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = getSecretKey();
  if (!supabaseUrl || !serviceKey) {
    console.error("Order API server configuration is incomplete.");
    return json({ error: "অর্ডার সার্ভার এখনো সম্পূর্ণভাবে কনফিগার হয়নি।" }, 503, origin);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 32 * 1024) {
    return json({ error: "অর্ডারের তথ্যের আকার বেশি।" }, 413, origin);
  }

  let order: Record<string, unknown>;
  try {
    order = await request.json();
    if (!order || typeof order !== "object" || Array.isArray(order)) {
      return json({ error: "অর্ডারের তথ্য সঠিক নয়।" }, 400, origin);
    }
  } catch (_) {
    return json({ error: "অর্ডারের তথ্য পড়া যায়নি।" }, 400, origin);
  }

  const clientIp = (
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    ""
  ).split(",")[0].trim();
  if (!clientIp) {
    return json({ error: "Request verification সম্পন্ন হয়নি। আবার চেষ্টা করুন।" }, 400, origin);
  }

  try {
    const keyHash = await hashClientIp(clientIp, serviceKey);
    const rateResult = await callDatabaseRpc(supabaseUrl, serviceKey, "consume_ecogrocer_order_rate_limit", {
      p_key_hash: keyHash,
      p_max_requests: 5,
      p_window_seconds: 600,
    });

    if (rateResult.error) {
      console.error("Order rate limiter failed:", rateResult.error.code || "unknown");
      return json({ error: "অর্ডার যাচাই করা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।" }, 503, origin);
    }
    if (rateResult.data !== true) {
      return json({ error: "অল্প সময়ে অনেকগুলো অর্ডার দেওয়ার চেষ্টা হয়েছে। ১০ মিনিট পর আবার চেষ্টা করুন।" }, 429, origin);
    }

    const orderResult = await callDatabaseRpc(supabaseUrl, serviceKey, "place_ecogrocer_order", {
      p_order: order,
      p_customer_user_id: null,
    });
    const data = orderResult.data as Record<string, unknown> | null;

    if (orderResult.error) {
      console.warn("Order validation rejected:", orderResult.error.code || "unknown");
      return json({ error: orderResult.error.message || "অর্ডার গ্রহণ করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।" }, 422, origin);
    }
    if (!data || data.success !== true || !data.orderId) {
      console.error("Order RPC returned an unexpected result.");
      return json({ error: "অর্ডার গ্রহণের ফলাফল নিশ্চিত করা যায়নি।" }, 502, origin);
    }

    return json({
      success: true,
      orderId: data.orderId,
      subtotal: data.subtotal,
      deliveryCharge: data.deliveryCharge,
      discount: data.discount,
      grandTotal: data.grandTotal,
      paymentStatus: data.paymentStatus,
    }, 201, origin);
  } catch (error) {
    console.error("Order API failed:", error instanceof Error ? error.message : "unknown error");
    return json({ error: "অর্ডার সার্ভারে জমা দেওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।" }, 500, origin);
  }
});
