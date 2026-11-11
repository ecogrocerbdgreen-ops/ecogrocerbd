(() => {
  "use strict";
  const API = "/.netlify/functions/api?action=";
  const AUTH_API = "/.netlify/functions/auth?action=";
  const SESSION_KEY = "ecogrocer-customer-session";
  const $ = (id) => document.getElementById(id);
  let config = null;
  let phone = "";
  let session = readSession();
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
  const show = (el, message, type) => { el.textContent = message; el.className = "status" + (type ? " " + type : ""); el.classList.remove("hidden"); };
  function readSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch (_) { return null; } }
  function saveSession(value) { session = value; localStorage.setItem(SESSION_KEY, JSON.stringify(value)); }
  function formatMoney(value) { return "৳" + Number(value || 0).toLocaleString("en-US"); }
  function normalizePhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.startsWith("8801") ? "+" + digits : "+880" + digits.replace(/^0/, "");
  }
  async function authFetch(action, body, accessToken) {
    const headers = { "content-type": "application/json", "accept": "application/json" };
    if (accessToken) headers.Authorization = "Bearer " + accessToken;
    const response = await fetch(AUTH_API + encodeURIComponent(action), {
      method: "POST", headers, body: body === null ? undefined : JSON.stringify(body || {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "OTP Authentication সম্পন্ন হয়নি।");
    return data;
  }
  async function ensureSession() {
    if (!session || !session.access_token) return null;
    if (Number(session.expires_at || 0) * 1000 > Date.now() + 60000) return session;
    if (!session.refresh_token) { clearSession(); return null; }
    const refreshed = await authFetch("refresh", { refresh_token: session.refresh_token });
    refreshed.expires_at = Math.floor(Date.now() / 1000) + Number(refreshed.expires_in || 3600);
    saveSession(refreshed);
    return session;
  }
  function clearSession() { session = null; localStorage.removeItem(SESSION_KEY); }
  function statusLabel(value) {
    return ({pending:"Pending",confirmed:"Confirmed",processing:"Processing",out_for_delivery:"Out for Delivery",delivered:"Delivered",cancelled:"Cancelled",refunded:"Refunded"})[value] || value;
  }
  function paymentLabel(value) {
    return ({unpaid:"Unpaid",pending_verification:"Payment যাচাই চলছে",paid:"Paid",failed:"Payment Failed",refunded:"Refunded"})[value] || value;
  }
  async function loadOrders() {
    const active = await ensureSession();
    if (!active) { $("account-panel").classList.add("hidden"); $("auth-panel").classList.remove("hidden"); return; }
    const response = await fetch(API + "account/orders", { headers: { Authorization: "Bearer " + active.access_token, Accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) { clearSession(); $("account-panel").classList.add("hidden"); $("auth-panel").classList.remove("hidden"); throw new Error(data.error || "আবার OTP দিয়ে Login করুন।"); }
    if (!response.ok) throw new Error(data.error || "অর্ডার লোড করা যায়নি।");
    $("auth-panel").classList.add("hidden");
    $("account-panel").classList.remove("hidden");
    $("account-phone").textContent = "Verified: " + (data.phone || "");
    const orders = data.orders || [];
    if (!orders.length) { $("orders").innerHTML = '<p class="muted">এখনো কোনো অর্ডার নেই। Login করে অর্ডার দিলে এখানে দেখা যাবে।</p>'; return; }
    $("orders").innerHTML = orders.map(order => {
      const items = (order.order_items || []).map(item => escapeHtml(item.product_name) + " × " + Number(item.quantity) + " (" + formatMoney(item.line_total) + ")").join("<br>");
      return '<article class="order"><div class="order-head"><strong>' + escapeHtml(order.order_number) + '</strong><span class="pill">' + escapeHtml(statusLabel(order.status)) + '</span></div>' +
        '<p class="muted" style="margin:8px 0">' + new Date(order.created_at).toLocaleString("en-GB") + ' · ' + escapeHtml(order.delivery_area_name || "") + '</p>' +
        '<div class="items">' + items + '</div><div class="order-head" style="margin-top:12px"><span>Payment: ' + escapeHtml(paymentLabel(order.payment_status)) + '</span><strong>' + formatMoney(order.grand_total) + '</strong></div></article>';
    }).join("");
  }
  $("phone-form").addEventListener("submit", async event => {
    event.preventDefault();
    phone = normalizePhone($("phone").value);
    const button = $("send-otp"); button.disabled = true; button.textContent = "OTP পাঠানো হচ্ছে…";
    try {
      await authFetch("otp", { phone });
      $("phone-form").classList.add("hidden");
      $("otp-form").classList.remove("hidden");
      show($("auth-status"), "আপনার নম্বরে OTP পাঠানো হয়েছে।", "success");
      $("otp").focus();
    } catch (error) { show($("auth-status"), error.message, "error"); }
    finally { button.disabled = false; button.textContent = "OTP পাঠান"; }
  });
  $("otp-form").addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.submitter; if (button) button.disabled = true;
    try {
      const data = await authFetch("verify", { phone, token: $("otp").value.trim() });
      data.expires_at = Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600);
      saveSession(data);
      show($("auth-status"), "Login সফল হয়েছে। আপনার অর্ডার লোড হচ্ছে…", "success");
      await loadOrders();
    } catch (error) { show($("auth-status"), error.message, "error"); }
    finally { if (button) button.disabled = false; }
  });
  $("change-phone").addEventListener("click", () => {
    $("otp-form").classList.add("hidden"); $("phone-form").classList.remove("hidden"); $("auth-status").classList.add("hidden");
  });
  $("logout").addEventListener("click", async () => {
    try {
      const active = await ensureSession();
      if (active) await authFetch("logout", null, active.access_token);
    } catch (_) {}
    clearSession(); $("account-panel").classList.add("hidden"); $("auth-panel").classList.remove("hidden");
  });
  $("refresh-orders").addEventListener("click", () => loadOrders().catch(error => show($("account-status"), error.message, "error")));
  if (window.location.hostname.toLowerCase().endsWith(".github.io")) {
    $("phone-form").classList.add("hidden");
    $("otp-form").classList.add("hidden");
    show(
      $("auth-status"),
      "এই সাইটটি GitHub Pages-এ চলছে, তাই এখান থেকে Account OTP ও অর্ডার ইতিহাসের সার্ভার চালানো যায় না। Guest Checkout ব্যবহার করে অর্ডার দিতে পারবেন। Account চালু করতে Supabase Auth, SMS provider এবং Netlify backend configuration সম্পন্ন করতে হবে।",
      "info"
    );
  } else {
    loadOrders().catch(error => show($("auth-status"), error.message, "error"));
  }
})();
