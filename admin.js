(() => {
  "use strict";
  const API = "/.netlify/functions/api?action=";
  const tokenKey = "ecogrocer-admin-token";
  let token = sessionStorage.getItem(tokenKey) || "";
  let products = [];
  let areas = [];
  const $ = (id) => document.getElementById(id);
  const money = (value) => "৳" + Number(value || 0).toLocaleString("en-US");
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
  const showMessage = (element, message, type = "") => {
    element.textContent = message;
    element.className = "status" + (type ? " " + type : "");
    element.classList.remove("hidden");
  };
  async function api(action, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = "Bearer " + token;
    if (options.body) headers["Content-Type"] = "application/json";
    const actionParts = String(action).split("&");
    const route = encodeURIComponent(actionParts.shift());
    const query = actionParts.length ? "&" + actionParts.join("&") : "";
    const response = await fetch(API + route + query, {
      method: options.method || "GET", headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed (" + response.status + ")");
    return data;
  }
  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }
  function showApp(ready) {
    $("login-panel").classList.toggle("hidden", ready);
    $("dashboard-panel").classList.toggle("hidden", !ready);
    $("logout").classList.toggle("hidden", !ready);
  }
  function metric(label, value) {
    return '<article class="metric"><small>' + escapeHtml(label) + '</small><strong>' + escapeHtml(value) + '</strong></article>';
  }
  async function loadDashboard() {
    const [dashboard, orderResult, productResult, areaResult, couponResult, slotResult] = await Promise.all([
      api("admin/dashboard"), api("admin/orders"), api("admin/products"),
      api("admin/delivery-areas"), api("admin/coupons"), api("admin/delivery-slots")
    ]);
    const m = dashboard.metrics;
    $("metrics").innerHTML = [
      metric("মোট অর্ডার", m.totalOrders), metric("Pending Orders", m.pendingOrders),
      metric("আজকের অর্ডার", m.todaysOrders), metric("আজকের বিক্রি", money(m.todaysSales)),
      metric("Active Products / Low stock", m.activeProducts + " / " + m.lowStock)
    ].join("");
    renderOrders(orderResult.orders || []);
    products = productResult.products || [];
    renderProducts();
    areas = areaResult.areas || [];
    renderAreas();
    renderCoupons(couponResult.coupons || []);
    window.__ecoSlots = slotResult.slots || [];
    renderSlots(window.__ecoSlots);
  }
  function statusLabel(status) {
    return ({
      pending:"Pending",confirmed:"Confirmed",processing:"Processing",
      out_for_delivery:"Out for delivery",delivered:"Delivered",
      cancelled:"Cancelled",refunded:"Refunded"
    })[status] || status;
  }
  function renderOrders(orders) {
    const target = $("orders-table");
    if (!orders.length) {
      target.innerHTML = '<tr><td colspan="7">এখনো কোনো অর্ডার নেই।</td></tr>';
      return;
    }
    target.innerHTML = orders.map((order) => {
      const items = (order.order_items || []).map((item) =>
        escapeHtml(item.product_name) + " × " + Number(item.quantity)
      ).join(", ");
      const options = ["pending","confirmed","processing","out_for_delivery","delivered","cancelled","refunded"]
        .map((status) => '<option value="' + status + '"' + (order.status === status ? " selected" : "") + '>' + statusLabel(status) + '</option>').join("");
      const paymentOptions = ["pending_verification","paid","failed","refunded"]
        .map((status) => '<option value="' + status + '"' + (order.payment_status === status ? " selected" : "") + '>' + status.replaceAll("_"," ") + '</option>').join("");
      const delivery = [order.delivery_area_name, order.block_name, order.road_name, order.house_number, order.full_address].filter(Boolean).join(", ");
      return '<tr><td><strong>' + escapeHtml(order.order_number) + '</strong><br><small>' + new Date(order.created_at).toLocaleString("en-GB") + '</small></td>' +
        '<td>' + escapeHtml(order.customer_name) + '<br><small>' + escapeHtml(order.customer_phone) + '</small><br><small>' + escapeHtml(delivery) + '</small></td>' +
        '<td>' + items + '</td><td>' + money(order.grand_total) + '</td>' +
        '<td><span class="pill ' + escapeHtml(order.status) + '">' + statusLabel(order.status) + '</span></td>' +
        '<td><span class="pill">' + escapeHtml(order.payment_status || "unpaid") + '</span><br><small>' + escapeHtml(order.payment_gateway || order.payment_method) + '</small></td>' +
        '<td><div class="actions"><select data-order-status="' + escapeHtml(order.id) + '">' + options + '</select><button class="btn" type="button" data-save-status="' + escapeHtml(order.id) + '">Save</button></div>' +
        '<div class="actions" style="margin-top:6px"><select data-payment-status="' + escapeHtml(order.id) + '">' + paymentOptions + '</select><button class="btn" type="button" data-save-payment="' + escapeHtml(order.id) + '">Save payment</button></div></td></tr>';
    }).join("");
  }
  function renderProducts() {
    $("products-table").innerHTML = products.map((product) =>
      '<tr><td><strong>' + escapeHtml(product.name) + '</strong><br><small>' + escapeHtml(product.id) + '</small></td>' +
      '<td>' + escapeHtml(product.category_id) + '</td><td>' + money(product.price) + ' / ' + escapeHtml(product.unit) + '</td>' +
      '<td>' + (product.track_inventory ? Number(product.stock_quantity) + " pcs" : "Not tracked") + '</td>' +
      '<td>' + (product.is_active ? "Active" : "Hidden") + '</td><td><button class="btn" type="button" data-edit-product="' + escapeHtml(product.id) + '">Edit</button></td></tr>'
    ).join("");
  }
  function renderAreas() {
    $("delivery-table").innerHTML = areas.map((area) =>
      '<tr><td>' + escapeHtml(area.name) + '<br><small>' + escapeHtml(area.id) + '</small></td><td>' + money(area.fee) +
      '</td><td>' + (area.is_active ? "Active" : "Off") + '</td><td><button class="btn" type="button" data-edit-area="' + escapeHtml(area.id) + '">Edit</button></td></tr>'
    ).join("");
  }
  function renderSlots(slots) {
    $("slots-table").innerHTML = slots.map((slot) =>
      '<tr><td><strong>' + escapeHtml(slot.label) + '</strong><br><small>' + escapeHtml(slot.id) + '</small></td>' +
      '<td>' + (slot.is_active ? "Active" : "Off") + '</td><td><button class="btn" type="button" data-edit-slot="' + escapeHtml(slot.id) + '">Edit</button></td></tr>'
    ).join("");
  }
  function renderCoupons(coupons) {
    $("coupons-table").innerHTML = coupons.map((coupon) =>
      '<tr><td><strong>' + escapeHtml(coupon.code) + '</strong></td><td>' +
      (coupon.discount_type === "percent" ? coupon.discount_value + "%" : money(coupon.discount_value)) +
      '</td><td>' + money(coupon.minimum_order) + '</td><td>' + coupon.usage_count +
      '</td><td>' + (coupon.is_active ? "Active" : "Off") + '</td></tr>'
    ).join("");
  }
  function editProduct(product) {
    const form = $("product-form");
    form.classList.remove("hidden");
    form.elements.id.value = product ? product.id : "new-" + Math.random().toString(36).slice(2, 7);
    form.elements.id_display.value = form.elements.id.value;
    form.elements.category_id.value = product ? product.category_id : "grocery";
    form.elements.name.value = product ? product.name : "";
    form.elements.english_name.value = product ? product.english_name : "";
    form.elements.price.value = product ? product.price : "";
    form.elements.unit.value = product ? product.unit : "";
    form.elements.image_url.value = product ? product.image_url : "";
    form.elements.description.value = product ? product.description : "";
    form.elements.stock_quantity.value = product ? product.stock_quantity : 0;
    form.elements.featured.checked = product ? product.featured : false;
    form.elements.track_inventory.checked = product ? product.track_inventory : false;
    form.elements.is_active.checked = product ? product.is_active : true;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = $("login-status");
    try {
      const body = formData(event.currentTarget);
      const response = await fetch(API + "admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "লগইন করা যায়নি।");
      token = data.token;
      sessionStorage.setItem(tokenKey, token);
      showApp(true);
      await loadDashboard();
    } catch (error) { showMessage(status, error.message, "error"); }
  });
  $("logout").addEventListener("click", () => {
    token = "";
    sessionStorage.removeItem(tokenKey);
    showApp(false);
  });
  $("refresh").addEventListener("click", async () => {
    try { await loadDashboard(); showMessage($("dashboard-status"), "ড্যাশবোর্ড আপডেট হয়েছে।", "success"); }
    catch (error) { showMessage($("dashboard-status"), error.message, "error"); }
  });
  $("order-filter").addEventListener("change", async (event) => {
    try { const result = await api("admin/orders&status=" + encodeURIComponent(event.target.value)); renderOrders(result.orders || []); }
    catch (error) { showMessage($("dashboard-status"), error.message, "error"); }
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === button));
      document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.panel !== button.dataset.tab));
    });
  });
  $("orders-table").addEventListener("click", async (event) => {
    const paymentButton = event.target.closest("[data-save-payment]");
    const statusButton = event.target.closest("[data-save-status]");
    try {
      if (paymentButton) {
        const select = document.querySelector('[data-payment-status="' + CSS.escape(paymentButton.dataset.savePayment) + '"]');
        await api("admin/payment-status", { method: "POST", body: { orderId: paymentButton.dataset.savePayment, paymentStatus: select.value } });
        await loadDashboard();
        showMessage($("dashboard-status"), "পেমেন্ট Status আপডেট হয়েছে।", "success");
        return;
      }
      if (statusButton) {
        const select = document.querySelector('[data-order-status="' + CSS.escape(statusButton.dataset.saveStatus) + '"]');
        await api("admin/order-status", { method: "POST", body: { orderId: statusButton.dataset.saveStatus, status: select.value } });
        await loadDashboard();
      }
    } catch (error) { showMessage($("dashboard-status"), error.message, "error"); }
  });
  $("new-product").addEventListener("click", () => editProduct(null));
  $("cancel-product").addEventListener("click", () => $("product-form").classList.add("hidden"));
  $("products-table").addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-product]");
    if (button) editProduct(products.find((product) => product.id === button.dataset.editProduct));
  });
  $("product-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
    const body = {
      ...values, price: Number(values.price), stock_quantity: Number(values.stock_quantity),
      featured: event.currentTarget.elements.featured.checked,
      track_inventory: event.currentTarget.elements.track_inventory.checked,
      is_active: event.currentTarget.elements.is_active.checked,
    };
    delete body.id_display;
    try { await api("admin/products", { method: "POST", body }); $("product-form").classList.add("hidden"); await loadDashboard(); }
    catch (error) { showMessage($("dashboard-status"), error.message, "error"); }
  });
  $("delivery-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
    values.fee = Number(values.fee); values.is_active = event.currentTarget.elements.is_active.checked;
    try { await api("admin/delivery-areas", { method: "POST", body: values }); await loadDashboard(); event.currentTarget.reset(); }
    catch (error) { showMessage($("dashboard-status"), error.message, "error"); }
  });
  $("delivery-table").addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-area]");
    if (!button) return;
    const area = areas.find((item) => item.id === button.dataset.editArea);
    $("delivery-form").elements.id.value = area.id;
    $("delivery-form").elements.name.value = area.name;
    $("delivery-form").elements.fee.value = area.fee;
    $("delivery-form").elements.is_active.checked = area.is_active;
  });
  $("slot-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
    values.is_active = event.currentTarget.elements.is_active.checked;
    try { await api("admin/delivery-slots", { method: "POST", body: values }); await loadDashboard(); event.currentTarget.reset(); }
    catch (error) { showMessage($("dashboard-status"), error.message, "error"); }
  });
  $("slots-table").addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-slot]");
    if (!button) return;
    const slot = (window.__ecoSlots || []).find((item) => item.id === button.dataset.editSlot);
    if (slot) {
      $("slot-form").elements.id.value = slot.id;
      $("slot-form").elements.label.value = slot.label;
      $("slot-form").elements.is_active.checked = slot.is_active;
    }
  });
  $("coupon-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
    values.discount_value = Number(values.discount_value);
    values.max_discount = values.max_discount === "" ? null : Number(values.max_discount);
    values.minimum_order = Number(values.minimum_order);
    values.usage_limit = values.usage_limit === "" ? null : Number(values.usage_limit);
    values.is_active = event.currentTarget.elements.is_active.checked;
    values.expires_at = values.expires_at ? new Date(values.expires_at).toISOString() : null;
    try { await api("admin/coupons", { method: "POST", body: values }); await loadDashboard(); event.currentTarget.reset(); }
    catch (error) { showMessage($("dashboard-status"), error.message, "error"); }
  });
  showApp(Boolean(token));
  if (token) loadDashboard().catch((error) => {
    token = ""; sessionStorage.removeItem(tokenKey); showApp(false); showMessage($("login-status"), error.message, "error");
  });
})();
