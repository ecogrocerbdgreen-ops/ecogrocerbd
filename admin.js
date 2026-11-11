import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";

(() => {
  "use strict";
  const SUPABASE_URL = "https://ucwaoytakqldicdtoran.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wpp9kVHNg5pZeGRY0Eoxaw_iyyQez9Q";
  const ADMIN_EMAIL = "ecogrocerbdgreen@gmail.com";
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: "implicit" }
  });
  const $ = (id) => document.getElementById(id);
  let orders = [];
  let products = [];
  let loaded = false;
  const money = (n) => "৳ " + Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 });
  const dateText = (v) => v ? new Date(v).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const statusLabel = (s) => ({pending:"Pending",confirmed:"Confirmed",processing:"Processing",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled",refunded:"Refunded"}[s] || s || "—");
  function feedback(message, error=false) { const el=$("admin-feedback"); if(!el)return; el.textContent=message; el.classList.toggle("error",error); }
  function showView(name) {
    const isAdmin = name === "success";
    $("login-view").classList.toggle("hidden", isAdmin);
    $("success-view").classList.toggle("hidden", !isAdmin);
    $("login-intro").classList.toggle("hidden", isAdmin);
    document.querySelector(".layout").classList.toggle("admin-mode", isAdmin);
    if (isAdmin && !loaded) void loadDashboard();
  }
  function showStatus(message, kind="") {
    const target=$("login-status"); target.textContent=message; target.className="status"+(kind?" "+kind:"");
  }
  function setBusy(busy) { const b=$("login-button"); b.disabled=busy; b.textContent=busy?"যাচাই হচ্ছে…":"লগইন করুন →"; }
  function isAuthorizedUser(user) { return String(user?.email||"").trim().toLowerCase()===ADMIN_EMAIL; }
  function friendlyAuthError(error) {
    const combined=(String(error?.code||"")+" "+String(error?.message||"")).toLowerCase();
    if(combined.includes("invalid_login_credentials")||combined.includes("invalid_credentials")||combined.includes("email or password")) return "Gmail অথবা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।";
    if(combined.includes("too many requests")||combined.includes("rate limit")) return "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।";
    return error?.message||"লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।";
  }
  async function loadDashboard() {
    feedback("ড্যাশবোর্ডের তথ্য লোড হচ্ছে…");
    try {
      const [orderResult, productResult] = await Promise.all([
        supabase.from("orders").select("id,order_number,status,payment_method,payment_status,customer_name,customer_phone,delivery_area_name,full_address,grand_total,created_at,order_items(id,product_name,quantity,unit,unit_price,line_total)").order("created_at",{ascending:false}).limit(100),
        supabase.from("products").select("id,name,english_name,category_id,price,stock_quantity,track_inventory,is_active,featured,unit").order("sort_order",{ascending:true}).limit(500)
      ]);
      if(orderResult.error) throw new Error("অর্ডার লোড হয়নি: "+orderResult.error.message);
      if(productResult.error) throw new Error("পণ্য লোড হয়নি: "+productResult.error.message);
      orders=orderResult.data||[]; products=productResult.data||[]; loaded=true;
      $("stat-orders").textContent=orders.length.toLocaleString("bn-BD");
      $("stat-pending").textContent=orders.filter(o=>o.status==="pending").length.toLocaleString("bn-BD");
      $("stat-products").textContent=products.length.toLocaleString("bn-BD");
      $("stat-active").textContent=products.filter(p=>p.is_active).length.toLocaleString("bn-BD");
      $("nav-order-count").textContent=orders.filter(o=>o.status==="pending").length.toLocaleString("bn-BD");
      renderRecentOrders(); renderOrders(); renderProducts(); feedback("ডেটা সফলভাবে আপডেট হয়েছে।");
    } catch(error) { loaded=false; feedback(error.message||"ডেটা লোড করা যায়নি।",true); }
  }
  function orderRows(items) {
    if(!items.length) return '<p class="admin-empty">এখনো কোনো অর্ডার পাওয়া যায়নি।</p>';
    return '<table class="admin-table"><thead><tr><th>অর্ডার</th><th>গ্রাহক</th><th>তারিখ</th><th>মোট</th><th>স্ট্যাটাস</th><th>পরিচালনা</th></tr></thead><tbody>'+
      items.map(o=>'<tr><td><strong>'+esc(o.order_number||o.id.slice(0,8))+'</strong><span class="cell-sub">'+esc(o.payment_method||"")+' · '+esc(o.payment_status||"")+'</span></td><td><strong>'+esc(o.customer_name)+'</strong><span class="cell-sub">'+esc(o.customer_phone)+'</span></td><td>'+esc(dateText(o.created_at))+'</td><td><strong>'+money(o.grand_total)+'</strong></td><td><span class="status-pill '+esc(o.status)+'">'+esc(statusLabel(o.status))+'</span></td><td><button class="row-action" data-order-details="'+esc(o.id)+'" type="button">বিস্তারিত</button></td></tr>').join("")+
      '</tbody></table>';
  }
  function renderRecentOrders(){ $("recent-orders").innerHTML=orderRows(orders.slice(0,5)); }
  function renderOrders(){
    const q=($("order-search")?.value||"").trim().toLowerCase(), filter=$("order-filter")?.value||"all";
    const list=orders.filter(o=>(filter==="all"||o.status===filter)&&[o.order_number,o.customer_name,o.customer_phone].some(v=>String(v||"").toLowerCase().includes(q)));
    $("orders-table").innerHTML=list.length?'<table class="admin-table"><thead><tr><th>অর্ডার</th><th>গ্রাহক</th><th>ডেলিভারি</th><th>পণ্য</th><th>মোট</th><th>স্ট্যাটাস</th><th>আপডেট</th></tr></thead><tbody>'+
      list.map(o=>'<tr><td><strong>'+esc(o.order_number||o.id.slice(0,8))+'</strong><span class="cell-sub">'+esc(dateText(o.created_at))+'</span></td><td><strong>'+esc(o.customer_name)+'</strong><span class="cell-sub">'+esc(o.customer_phone)+'</span></td><td>'+esc(o.delivery_area_name)+'<span class="cell-sub">'+esc(o.full_address)+'</span></td><td>'+((o.order_items||[]).length)+' টি</td><td><strong>'+money(o.grand_total)+'</strong></td><td><select class="admin-select order-status-select" data-status-id="'+esc(o.id)+'">'+["pending","confirmed","processing","out_for_delivery","delivered","cancelled","refunded"].map(s=>'<option value="'+s+'" '+(o.status===s?"selected":"")+'>'+statusLabel(s)+'</option>').join("")+'</select></td><td><button class="row-action save-order-status" data-save-order="'+esc(o.id)+'" type="button">সংরক্ষণ</button></td></tr>').join("")+'</tbody></table>':'<p class="admin-empty">এই অনুসন্ধানে কোনো অর্ডার পাওয়া যায়নি।</p>';
  }
  function renderProducts(){
    const q=($("product-search")?.value||"").trim().toLowerCase();
    const list=products.filter(p=>(p.name+" "+p.english_name).toLowerCase().includes(q));
    $("products-table").innerHTML=list.length?'<table class="admin-table"><thead><tr><th>পণ্য</th><th>দাম (৳)</th><th>স্টক</th><th>স্টক ট্র্যাক</th><th>সক্রিয়</th><th>সংরক্ষণ</th></tr></thead><tbody>'+
      list.map(p=>'<tr><td><strong>'+esc(p.name)+'</strong><span class="cell-sub">'+esc(p.english_name||p.category_id)+' · '+esc(p.unit)+'</span></td><td><input class="product-edit-input" type="number" min="0" step="0.01" value="'+Number(p.price||0)+'" data-price-id="'+esc(p.id)+'"></td><td><input class="product-edit-input" type="number" min="0" step="1" value="'+Number(p.stock_quantity||0)+'" data-stock-id="'+esc(p.id)+'"></td><td><input class="product-active" type="checkbox" '+(p.track_inventory?"checked":"")+' data-track-id="'+esc(p.id)+'" aria-label="স্টক ট্র্যাক"></td><td><input class="product-active" type="checkbox" '+(p.is_active?"checked":"")+' data-active-id="'+esc(p.id)+'" aria-label="পণ্য সক্রিয়"></td><td><button class="row-action product-save" data-save-product="'+esc(p.id)+'" type="button">সংরক্ষণ</button></td></tr>').join("")+'</tbody></table>':'<p class="admin-empty">কোনো পণ্য পাওয়া যায়নি।</p>';
  }
  async function saveOrder(id){
    const select=document.querySelector('[data-status-id="'+CSS.escape(id)+'"]'); if(!select)return;
    const button=document.querySelector('[data-save-order="'+CSS.escape(id)+'"]'); button.disabled=true;
    try{const {error}=await supabase.from("orders").update({status:select.value,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;
      const order=orders.find(o=>o.id===id);if(order)order.status=select.value;renderRecentOrders();$("stat-pending").textContent=orders.filter(o=>o.status==="pending").length.toLocaleString("bn-BD");$("nav-order-count").textContent=orders.filter(o=>o.status==="pending").length.toLocaleString("bn-BD");renderOrders();feedback("অর্ডারের স্ট্যাটাস আপডেট হয়েছে।");
    }catch(e){feedback("অর্ডার আপডেট হয়নি: "+e.message,true);button.disabled=false;}
  }
  async function saveProduct(id){
    const get=(attr)=>document.querySelector("["+attr+'="'+CSS.escape(id)+'"]');
    const price=Number(get("data-price-id")?.value),stock=Number(get("data-stock-id")?.value);
    if(!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0){feedback("দাম ও স্টকের মান সঠিকভাবে দিন।",true);return;}
    const button=document.querySelector('[data-save-product="'+CSS.escape(id)+'"]');button.disabled=true;
    try{const patch={price,stock_quantity:stock,track_inventory:get("data-track-id").checked,is_active:get("data-active-id").checked,updated_at:new Date().toISOString()};
      const {error}=await supabase.from("products").update(patch).eq("id",id);if(error)throw error;
      const p=products.find(x=>x.id===id);if(p)Object.assign(p,patch);$("stat-active").textContent=products.filter(x=>x.is_active).length.toLocaleString("bn-BD");renderProducts();feedback("পণ্যের তথ্য সংরক্ষণ হয়েছে।");
    }catch(e){feedback("পণ্য আপডেট হয়নি: "+e.message,true);button.disabled=false;}
  }
  function openOrderDetails(id){
    const o=orders.find(x=>x.id===id);if(!o)return;
    const lines=(o.order_items||[]).map(i=>esc(i.product_name)+" × "+i.quantity+" — "+money(i.line_total)).join("\n");
    const info="অর্ডার: "+(o.order_number||o.id)+"\nগ্রাহক: "+o.customer_name+"\nফোন: "+o.customer_phone+"\nঠিকানা: "+(o.full_address||"")+"\n\nপণ্য:\n"+(lines||"পণ্যের তথ্য নেই")+"\n\nসাবটোটাল: "+money(o.subtotal)+"\nডিসকাউন্ট: "+money(o.discount)+"\nডেলিভারি: "+money(o.delivery_fee)+"\nসর্বমোট: "+money(o.grand_total)+"\nপেমেন্ট: "+o.payment_method+" / "+o.payment_status;
    window.alert(info);
  }
  function switchPanel(name){
    document.querySelectorAll(".admin-panel").forEach(p=>p.classList.toggle("hidden",p.id!=="panel-"+name));
    document.querySelectorAll(".admin-nav").forEach(b=>b.classList.toggle("active",b.dataset.panel===name));
  }
  $("login-form").addEventListener("submit",async event=>{
    event.preventDefault();const password=$("admin-password").value;setBusy(true);showStatus();
    try{const {data,error}=await supabase.auth.signInWithPassword({email:ADMIN_EMAIL,password});if(error)throw error;
      if(!isAuthorizedUser(data.user)){await supabase.auth.signOut({scope:"local"});throw new Error("এই Gmail অ্যাডমিন ব্যবহারের জন্য অনুমোদিত নয়।");}
      $("admin-password").value="";loaded=false;showView("success");showStatus();
    }catch(error){showStatus(friendlyAuthError(error),"error");}finally{setBusy(false);}
  });
  $("logout-button").addEventListener("click",async()=>{const b=$("logout-button");b.disabled=true;try{const {error}=await supabase.auth.signOut({scope:"local"});if(error)throw error;loaded=false;showView("login");$("admin-password").value="";showStatus("আপনি নিরাপদভাবে লগআউট করেছেন।","success");}catch(e){showStatus(friendlyAuthError(e),"error");}finally{b.disabled=false;}});
  document.addEventListener("click",event=>{
    const nav=event.target.closest("[data-panel]");if(nav)switchPanel(nav.dataset.panel);
    const go=event.target.closest("[data-go-panel]");if(go)switchPanel(go.dataset.goPanel);
    const refresh=event.target.closest("#refresh-dashboard,[data-refresh]");if(refresh){loaded=false;void loadDashboard();}
    const detail=event.target.closest("[data-order-details]");if(detail)openOrderDetails(detail.dataset.orderDetails);
    const saveOrderButton=event.target.closest("[data-save-order]");if(saveOrderButton)void saveOrder(saveOrderButton.dataset.saveOrder);
    const saveProductButton=event.target.closest("[data-save-product]");if(saveProductButton)void saveProduct(saveProductButton.dataset.saveProduct);
  });
  $("order-search").addEventListener("input",renderOrders);$("order-filter").addEventListener("change",renderOrders);$("product-search").addEventListener("input",renderProducts);
  supabase.auth.onAuthStateChange((event,session)=>{
    if(!session?.user){loaded=false;showView("login");return;}
    if(!isAuthorizedUser(session.user)){showView("login");showStatus("এই Gmail অ্যাডমিন ব্যবহারের জন্য অনুমোদিত নয়।","error");void supabase.auth.signOut({scope:"local"});return;}
    if(event==="INITIAL_SESSION"||event==="SIGNED_IN"||event==="TOKEN_REFRESHED")showView("success");
  });
})();