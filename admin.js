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
  let loaded = false;
  let loading = false;
  const money = (n) => "৳ " + Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 });
  const dateText = (v) => v ? new Date(v).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const statusLabel = (s) => ({pending:"Pending",confirmed:"Confirmed",processing:"Processing",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled",refunded:"Refunded"}[s] || s || "—");
  const paymentLabel = (s) => ({cod:"Cash on Delivery",bkash:"bKash",nagad:"Nagad",rocket:"Rocket"}[String(s||"").toLowerCase()] || s || "—");
  const paymentStatusLabel = (s) => ({unpaid:"Unpaid",pending_verification:"Pending verification",paid:"Paid / verified",failed:"Failed",refunded:"Refunded"}[String(s||"").toLowerCase()] || s || "—");
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
  async function fetchAllOrders() {
    const all=[]; const pageSize=500;
    for(let from=0; ; from+=pageSize) {
      const {data,error}=await supabase.from("orders")
        .select("id,order_number,status,payment_method,payment_status,payment_gateway,payment_gateway_transaction_id,customer_name,customer_email,customer_phone,delivery_area_name,block_name,road_name,house_number,full_address,delivery_fee,subtotal,discount,grand_total,payer_phone,transaction_id,delivery_notes,created_at,updated_at,order_items(id,product_name,quantity,unit,unit_price,line_total),payment_transactions(gateway,gateway_transaction_id,validation_id,bank_transaction_id,amount,status,created_at)")
        .order("created_at",{ascending:false}).range(from,from+pageSize-1);
      if(error) throw new Error("অর্ডার লোড হয়নি: "+error.message);
      const rows=data||[]; all.push(...rows);
      if(rows.length<pageSize) break;
    }
    return all;
  }
  function periodOrders() {
    const period=$("overview-period")?.value||"all";
    const now=new Date(); let start=null;
    if(period==="today"){start=new Date(now);start.setHours(0,0,0,0);}
    else if(period==="7"||period==="30"){start=new Date(now);start.setDate(start.getDate()-Number(period));}
    else if(period==="month"){start=new Date(now.getFullYear(),now.getMonth(),1);}
    return start?orders.filter(o=>new Date(o.created_at)>=start):orders;
  }
  function renderOverview() {
    const rows=periodOrders(), valid=rows.filter(o=>!["cancelled","refunded"].includes(o.status));
    const paid=valid.filter(o=>o.payment_status==="paid").reduce((s,o)=>s+Number(o.grand_total||0),0);
    const unpaid=valid.filter(o=>["unpaid","pending_verification"].includes(o.payment_status)).reduce((s,o)=>s+Number(o.grand_total||0),0);
    const set=(id,value)=>{const el=$(id);if(el)el.textContent=value;};
    set("stat-orders",rows.length.toLocaleString("bn-BD"));
    set("stat-order-value",money(valid.reduce((s,o)=>s+Number(o.grand_total||0),0)));
    set("stat-paid",money(paid)); set("stat-unpaid",money(unpaid));
    set("stat-pending",rows.filter(o=>o.status==="pending").length.toLocaleString("bn-BD"));
    set("stat-delivered",rows.filter(o=>o.status==="delivered").length.toLocaleString("bn-BD"));
    set("stat-cancelled",rows.filter(o=>o.status==="cancelled").length.toLocaleString("bn-BD"));
    set("stat-all-orders",orders.length.toLocaleString("bn-BD"));
    set("nav-order-count",orders.filter(o=>o.status==="pending").length.toLocaleString("bn-BD"));
    renderRecentOrders();
  }
  async function loadDashboard() {
    if(loading)return;
    loading=true;
    feedback("অর্ডারের তথ্য লোড হচ্ছে…");
    try {
      orders=await fetchAllOrders(); loaded=true;
      renderOverview(); renderOrders(); feedback("অর্ডার ও আর্থিক হিসাব আপডেট হয়েছে।");
    } catch(error) { loaded=false; feedback(error.message||"ডেটা লোড করা যায়নি।",true); }
    finally { loading=false; }
  }
  function orderCard(o) {
    const id=esc(o.id), status=esc(o.status);
    return '<article class="order-card"><div class="order-card-top"><div><div class="order-card-name">'+esc(o.customer_name||"নাম নেই")+'</div><span class="cell-sub">'+esc(o.order_number||o.id.slice(0,8))+' · '+esc(dateText(o.created_at))+'</span></div><span class="status-pill '+status+'">'+esc(statusLabel(o.status))+'</span></div>'+
      '<div class="order-card-line"><span>ফোন</span><strong>'+esc(o.customer_phone||"—")+'</strong></div>'+
      '<div class="order-card-line"><span>ডেলিভারি এলাকা</span><strong>'+esc(o.delivery_area_name||"—")+'</strong></div>'+
      '<div class="order-card-line"><span>পেমেন্ট</span><strong>'+esc(paymentLabel(o.payment_method))+' · '+esc(o.payment_status||"—")+'</strong></div>'+
      '<div class="order-card-line"><span>অর্ডারের মূল্য</span><strong>'+money(o.grand_total)+'</strong></div>'+
      '<div class="order-card-actions"><button class="row-action" data-order-details="'+id+'" type="button">বিস্তারিত দেখুন</button></div></article>';
  }
  function renderRecentOrders() {
    const el=$("recent-orders"); if(!el)return;
    el.innerHTML=orders.length?'<div class="order-cards">'+orders.slice(0,5).map(orderCard).join("")+'</div>':'<p class="admin-empty">এখনো কোনো অর্ডার পাওয়া যায়নি।</p>';
  }
  function renderOrders() {
    const el=$("orders-table"); if(!el)return;
    const q=($("order-search")?.value||"").trim().toLowerCase(), filter=$("order-filter")?.value||"all";
    const list=orders.filter(o=>(filter==="all"||o.status===filter)&&[o.order_number,o.customer_name,o.customer_phone,o.payer_phone,o.transaction_id,o.payment_gateway_transaction_id].some(v=>String(v||"").toLowerCase().includes(q)));
    el.innerHTML=list.length?'<div class="order-cards">'+list.map(o=>{
      const statusOptions=["pending","confirmed","processing","out_for_delivery","delivered","cancelled","refunded"].map(s=>'<option value="'+s+'" '+(o.status===s?"selected":"")+'>'+statusLabel(s)+'</option>').join("");
      const payOptions=["unpaid","pending_verification","paid","failed","refunded"].map(s=>'<option value="'+s+'" '+((o.payment_status||"unpaid")===s?"selected":"")+'>'+paymentStatusLabel(s)+'</option>').join("");
      return orderCard(o).replace('<div class="order-card-actions">','<div class="order-card-actions order-card-controls"><label class="control-label">অর্ডার <select class="admin-select order-status-select" data-status-id="'+esc(o.id)+'">'+statusOptions+'</select></label><label class="control-label">পেমেন্ট <select class="admin-select payment-status-select" data-payment-id="'+esc(o.id)+'">'+payOptions+'</select></label><button class="row-action save-order-status" data-save-order="'+esc(o.id)+'" type="button">আপডেট</button>');
    }).join("")+'</div>':'<p class="admin-empty">এই অনুসন্ধানে কোনো অর্ডার পাওয়া যায়নি।</p>';
  }
  function openOrderDetails(id) {
    const o=orders.find(x=>x.id===id); if(!o)return;
    const transactions=Array.isArray(o.payment_transactions)?o.payment_transactions:[];
    const latest=transactions.slice().sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))[0]||{};
    const payer=o.payer_phone||"—", txn=o.transaction_id||o.payment_gateway_transaction_id||latest.gateway_transaction_id||latest.bank_transaction_id||"—";
    const address=[o.full_address,o.delivery_area_name,o.block_name,o.road_name,o.house_number].filter(Boolean).join(", ")||"—";
    const items=(o.order_items||[]).map(i=>'<tr><td>'+esc(i.product_name)+' × '+esc(i.quantity)+' '+esc(i.unit||"")+'</td><td>'+money(i.line_total)+'</td></tr>').join("")||'<tr><td colspan="2">পণ্যের তথ্য পাওয়া যায়নি</td></tr>';
    const boxes=[
      ["গ্রাহকের নাম",o.customer_name],["মোবাইল নম্বর",o.customer_phone],["ইমেইল",o.customer_email],
      ["ডেলিভারি ঠিকানা",address],["পেমেন্ট মাধ্যম",paymentLabel(o.payment_method)],["পেমেন্ট অবস্থা",o.payment_status],
      ["যে নম্বর থেকে পেমেন্ট",payer],["Transaction ID",txn],["Gateway",o.payment_gateway||latest.gateway],["Gateway reference",latest.validation_id||"—"]
    ];
    $("order-modal-title").textContent=(o.order_number||"অর্ডার")+" · "+money(o.grand_total);
    $("order-modal-body").innerHTML='<div class="detail-grid">'+boxes.map(([label,value])=>'<div class="detail-box"><small>'+esc(label)+'</small><strong>'+esc(value||"—")+'</strong></div>').join("")+'</div>'+
      '<h3 class="detail-heading">পণ্যের তালিকা</h3><table class="detail-items">'+items+'</table>'+
      '<h3 class="detail-heading">হিসাব</h3><div class="detail-grid">'+[["পণ্যের মূল্য",money(o.subtotal)],["ডিসকাউন্ট",money(o.discount)],["ডেলিভারি চার্জ",money(o.delivery_fee)],["সর্বমোট",money(o.grand_total)]].map(([a,b])=>'<div class="detail-box"><small>'+a+'</small><strong>'+b+'</strong></div>').join("")+'</div>'+
      '<div class="payment-note">পেমেন্ট নম্বর ও Transaction ID দেখানো হবে। PIN, OTP বা কোনো গোপন ভেরিফিকেশন কোড এই প্যানেলে সংগ্রহ বা সংরক্ষণ করা হবে না.</div>'+
      (o.delivery_notes?'<h3 class="detail-heading">ডেলিভারি নোট</h3><p>'+esc(o.delivery_notes)+'</p>':"");
    $("order-modal").classList.remove("hidden");
  }
  async function saveOrder(id) {
    const statusSelect=document.querySelector('[data-status-id="'+CSS.escape(id)+'"]');
    const paymentSelect=document.querySelector('[data-payment-id="'+CSS.escape(id)+'"]');
    if(!statusSelect||!paymentSelect)return;
    const button=document.querySelector('[data-save-order="'+CSS.escape(id)+'"]'); button.disabled=true;
    try {
      const update={status:statusSelect.value,payment_status:paymentSelect.value,updated_at:new Date().toISOString()};
      const {data,error}=await supabase.from("orders").update(update).eq("id",id).select("id,status,payment_status").single();
      if(error)throw error;
      const order=orders.find(o=>o.id===id);
      if(order){order.status=data.status;order.payment_status=data.payment_status;order.updated_at=new Date().toISOString();}
      renderOverview(); renderOrders(); feedback("অর্ডার ও পেমেন্টের অবস্থা সংরক্ষণ হয়েছে।");
    } catch(e) { feedback("আপডেট করা যায়নি: "+e.message,true); button.disabled=false; }
  }
  function switchPanel(name) {
    document.querySelectorAll(".admin-panel").forEach(p=>p.classList.toggle("hidden",p.id!=="panel-"+name));
    document.querySelectorAll(".admin-nav").forEach(b=>b.classList.toggle("active",b.dataset.panel===name));
  }
  $("login-form").addEventListener("submit",async event=>{
    event.preventDefault(); const password=$("admin-password").value; setBusy(true); showStatus();
    try {
      const {data,error}=await supabase.auth.signInWithPassword({email:ADMIN_EMAIL,password}); if(error)throw error;
      if(!isAuthorizedUser(data.user)){await supabase.auth.signOut({scope:"local"});throw new Error("এই Gmail অ্যাডমিন ব্যবহারের জন্য অনুমোদিত নয়।");}
      $("admin-password").value=""; loaded=false; showView("success"); showStatus();
    } catch(error) { showStatus(friendlyAuthError(error),"error"); } finally { setBusy(false); }
  });
  $("logout-button").addEventListener("click",async()=>{
    const b=$("logout-button"); b.disabled=true;
    try { const {error}=await supabase.auth.signOut({scope:"local"}); if(error)throw error; loaded=false; showView("login"); $("admin-password").value=""; showStatus("আপনি নিরাপদভাবে লগআউট করেছেন।","success"); }
    catch(e){showStatus(friendlyAuthError(e),"error");} finally{b.disabled=false;}
  });
  document.addEventListener("click",event=>{
    const nav=event.target.closest("[data-panel]"); if(nav)switchPanel(nav.dataset.panel);
    const go=event.target.closest("[data-go-panel]"); if(go)switchPanel(go.dataset.goPanel);
    const refresh=event.target.closest("#refresh-dashboard,[data-refresh]"); if(refresh){loaded=false;void loadDashboard();}
    const detail=event.target.closest("[data-order-details]"); if(detail)openOrderDetails(detail.dataset.orderDetails);
    const save=event.target.closest("[data-save-order]"); if(save)void saveOrder(save.dataset.saveOrder);
    if(event.target.closest("[data-close-modal]"))$("order-modal").classList.add("hidden");
  });
  document.addEventListener("keydown",event=>{if(event.key==="Escape")$("order-modal").classList.add("hidden");});
  $("order-search").addEventListener("input",renderOrders);
  $("order-filter").addEventListener("change",renderOrders);
  $("overview-period").addEventListener("change",renderOverview);
  supabase.auth.onAuthStateChange((event,session)=>{
    if(!session?.user){loaded=false;showView("login");return;}
    if(!isAuthorizedUser(session.user)){showView("login");showStatus("এই Gmail অ্যাডমিন ব্যবহারের জন্য অনুমোদিত নয়।","error");void supabase.auth.signOut({scope:"local"});return;}
    if(event==="INITIAL_SESSION"||event==="SIGNED_IN"||event==="TOKEN_REFRESHED")showView("success");
  });
})();