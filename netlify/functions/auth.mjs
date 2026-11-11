const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

const env = (key) => {
  try { return Netlify.env.get(key) || ""; } catch (_) { return ""; }
};

export default async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "";
  const projectUrl = env("SUPABASE_URL").replace(/\/$/, "");
  const anonKey = env("SUPABASE_ANON_KEY");
  if (!projectUrl || !anonKey) {
    return json({ error: "Customer OTP চালু করতে Supabase URL ও Auth public key সংযুক্ত করতে হবে।" }, 503);
  }

  let body = {};
  try { body = await request.json(); } catch (_) { return json({ error: "Request data সঠিক নয়।" }, 400); }

  let endpoint = "";
  let payload = body;
  const headers = { apikey: anonKey, "content-type": "application/json" };

  if (action === "otp") {
    const phone = String(body.phone || "");
    if (!/^\+8801[3-9][0-9]{8}$/.test(phone)) return json({ error: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন।" }, 422);
    endpoint = "/auth/v1/otp";
    payload = { phone, create_user: true };
  } else if (action === "verify") {
    const phone = String(body.phone || "");
    const token = String(body.token || "");
    if (!/^\+8801[3-9][0-9]{8}$/.test(phone) || !/^[0-9]{6}$/.test(token)) {
      return json({ error: "মোবাইল নম্বর বা ৬ সংখ্যার OTP সঠিক নয়।" }, 422);
    }
    endpoint = "/auth/v1/verify";
    payload = { phone, token, type: "sms" };
  } else if (action === "refresh") {
    const refreshToken = String(body.refresh_token || "");
    if (!refreshToken) return json({ error: "Session Refresh Token পাওয়া যায়নি।" }, 422);
    endpoint = "/auth/v1/token?grant_type=refresh_token";
    payload = { refresh_token: refreshToken };
  } else if (action === "logout") {
    const bearer = request.headers.get("authorization") || "";
    if (!/^Bearer\s+.+/i.test(bearer)) return json({ success: true });
    endpoint = "/auth/v1/logout";
    headers.authorization = bearer;
    payload = null;
  } else {
    return json({ error: "Auth route not found." }, 404);
  }

  try {
    const response = await fetch(projectUrl + endpoint, {
      method: "POST",
      headers,
      body: payload === null ? undefined : JSON.stringify(payload),
    });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = {}; }
    if (!response.ok) {
      const message = data.msg || data.message || data.error_description || data.error;
      return json({ error: message || "OTP Authentication সম্পন্ন হয়নি।" }, response.status);
    }
    return json(action === "logout" ? { success: true } : data, response.status);
  } catch (error) {
    console.error("EcoGrocer Auth API error:", error);
    return json({ error: "Authentication service-এর সঙ্গে সংযোগ করা যায়নি।" }, 502);
  }
};

export const config = {
  rateLimit: {
    action: "rate_limit",
    aggregateBy: "ip",
    windowSize: 60,
    windowLimit: 12,
  },
};
