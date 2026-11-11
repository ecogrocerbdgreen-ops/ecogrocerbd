'use strict';

const CATEGORIES = [
  { id: 'grocery', title: 'Grocery', bangla: 'মুদি পণ্য' },
  { id: 'vegetables', title: 'Vegetables', bangla: 'শাক-সবজি' },
  { id: 'meat', title: 'Meat', bangla: 'মাংস' },
  { id: 'fish', title: 'Fish', bangla: 'মাছ' }
];

// Price and pack-size references are documented in PRODUCT-PRICE-SOURCES.md.
// All entries are editable starter catalogue data, not confirmed EcoGrocer stock.
let PRODUCTS = [
  // Grocery — 8 products
  { id: 'g01', category: 'grocery', name: 'মিনিকেট চাল', en: 'Miniket Rice', price: 389, unit: '৫ কেজি', featured: true, aliases: ['miniket', 'chal', 'chaal', 'rice'] },
  { id: 'g02', category: 'grocery', name: 'সয়াবিন তেল', en: 'Soybean Oil', price: 189, unit: '১ লিটার', featured: true, aliases: ['tel', 'oil', 'soybean'] },
  { id: 'g03', category: 'grocery', name: 'মসুর ডাল', en: 'Red Lentils', price: 109, unit: '১ কেজি', featured: true, aliases: ['moshur dal', 'masoor dal', 'dal', 'lentil'] },
  { id: 'g04', category: 'grocery', name: 'চিনি', en: 'Sugar', price: 80, unit: '১ কেজি', aliases: ['chini', 'sugar'] },
  { id: 'g05', category: 'grocery', name: 'ডিম (লেয়ার)', en: 'Layer Eggs', price: 135, unit: '১২টি', featured: true, aliases: ['dim', 'egg', 'eggs'] },
  { id: 'g06', category: 'grocery', name: 'আটা', en: 'Wheat Flour', price: 115, unit: '২ কেজি', aliases: ['atta', 'flour', 'wheat'] },
  { id: 'g07', category: 'grocery', name: 'আয়োডিনযুক্ত লবণ', en: 'Iodized Salt', price: 37, unit: '১ কেজি', aliases: ['lobon', 'salt', 'iodized salt'] },
  { id: 'g08', category: 'grocery', name: 'চিনিগুঁড়া চাল', en: 'Chinigura Rice', price: 133, unit: '১ কেজি', aliases: ['chini gura', 'chinigura', 'aromatic rice'] },

  // Vegetables — 8 products
  { id: 'v01', category: 'vegetables', name: 'আলু', en: 'Regular Potato', price: 29, unit: '১ কেজি', featured: true, aliases: ['alu', 'aloo', 'potato'] },
  { id: 'v02', category: 'vegetables', name: 'টমেটো', en: 'Red Tomato', price: 99, unit: '৫০০ গ্রাম', featured: true, aliases: ['tomato', 'tometo'] },
  { id: 'v03', category: 'vegetables', name: 'ধনেপাতা', en: 'Coriander Leaves', price: 25, unit: '১০০ গ্রাম', aliases: ['dhonepata', 'dhonia pata', 'coriander'] },
  { id: 'v04', category: 'vegetables', name: 'রসুন (ইমপোর্টেড)', en: 'Imported Garlic', price: 79, unit: '৫০০ গ্রাম', aliases: ['roshun', 'rosun', 'garlic'] },
  { id: 'v05', category: 'vegetables', name: 'কাঁচা মরিচ', en: 'Green Chilli', price: 89, unit: '২৫০ গ্রাম', aliases: ['kacha morich', 'morich', 'chilli', 'chili'] },
  { id: 'v06', category: 'vegetables', name: 'দেশি শসা', en: 'Local Cucumber', price: 39, unit: '৫০০ গ্রাম', aliases: ['shosha', 'sosha', 'cucumber'] },
  { id: 'v07', category: 'vegetables', name: 'দেশি পেঁয়াজ', en: 'Local Onion', price: 39, unit: '১ কেজি', aliases: ['peyaj', 'piyaj', 'onion'] },
  { id: 'v08', category: 'vegetables', name: 'দেশি গাজর', en: 'Local Carrot', price: 49, unit: '৫০০ গ্রাম', aliases: ['gajor', 'carrot'] },

  // Meat — 8 products
  { id: 'm01', category: 'meat', name: 'ব্রয়লার মুরগি (চামড়া ছাড়া)', en: 'Broiler Chicken Skin Off', price: 359, unit: '১ কেজি', featured: true, aliases: ['murgi', 'chicken', 'broiler'] },
  { id: 'm02', category: 'meat', name: 'ব্রয়লার মুরগি (চামড়াসহ)', en: 'Broiler Chicken Skin On', price: 319, unit: '১ কেজি', aliases: ['murgi', 'chicken', 'broiler skin on'] },
  { id: 'm03', category: 'meat', name: 'চিকেন লেগ (চামড়াসহ)', en: 'Chicken Leg Skin On', price: 519, unit: '১ কেজি', aliases: ['chicken leg', 'leg piece'] },
  { id: 'm04', category: 'meat', name: 'দেশি মুরগি (চামড়া ছাড়া)', en: 'Deshi Chicken Skin Off', price: 639, unit: '৫০০ গ্রাম', aliases: ['deshi murgi', 'native chicken'] },
  { id: 'm05', category: 'meat', name: 'গরুর মাংস (বোনলেস)', en: 'Beef Boneless', price: 619, unit: '৫০০ গ্রাম', featured: true, aliases: ['gorur mangsho', 'beef', 'boneless'] },
  { id: 'm06', category: 'meat', name: 'গরুর মাংস (হাড়সহ)', en: 'Beef Bone In', price: 799, unit: '১ কেজি', aliases: ['gorur mangsho', 'beef', 'bone in'] },
  { id: 'm07', category: 'meat', name: 'গরুর কলিজা', en: 'Beef Liver', price: 409, unit: '৫০০ গ্রাম', aliases: ['kolija', 'liver', 'beef liver'] },
  { id: 'm08', category: 'meat', name: 'খাসির মাংস (হাড়সহ)', en: 'Mutton Bone In', price: 1249, unit: '১ কেজি', aliases: ['khashi', 'khasi', 'mutton', 'goat meat'] },

  // Fish — 8 products
  { id: 'f01', category: 'fish', name: 'তেলাপিয়া মাছ', en: 'Tilapia Fish', price: 250, unit: '১ কেজি', featured: true, aliases: ['telapia', 'tilapia', 'fish', 'mach'] },
  { id: 'f02', category: 'fish', name: 'রুই মাছ', en: 'Rui Fish', price: 400, unit: '১ কেজি', featured: true, aliases: ['rui', 'rohu', 'fish', 'mach'] },
  { id: 'f03', category: 'fish', name: 'কাতলা মাছ', en: 'Katla Fish', price: 600, unit: '১ কেজি', aliases: ['katla', 'catla', 'fish', 'mach'] },
  { id: 'f04', category: 'fish', name: 'মৃগেল মাছ', en: 'Mrigel Fish', price: 250, unit: '১ কেজি', aliases: ['mrigel', 'fish', 'mach'] },
  { id: 'f05', category: 'fish', name: 'শিং মাছ', en: 'Shing Fish', price: 450, unit: '১ কেজি', aliases: ['shing', 'sing', 'fish', 'mach'] },
  { id: 'f06', category: 'fish', name: 'পাঙ্গাস মাছ', en: 'Pangas Fish', price: 240, unit: '১ কেজি', aliases: ['pangas', 'pangash', 'fish', 'mach'] },
  { id: 'f07', category: 'fish', name: 'পাবদা মাছ', en: 'Pabda Fish', price: 400, unit: '১ কেজি', aliases: ['pabda', 'fish', 'mach'] },
  { id: 'f08', category: 'fish', name: 'কৈ মাছ (চাষের)', en: 'Farmed Koi Fish', price: 210, unit: '১ কেজি', aliases: ['koi', 'koi mach', 'fish', 'mach'] }
];

// Free-to-use product photography. Images are representative catalogue visuals.
// The images are plain <img> elements and are deliberately not wrapped in links.
const PRODUCT_IMAGES = {
  "g01": "https://images.pexels.com/photos/31555432/pexels-photo-31555432/free-photo-of-white-bowl-of-uncooked-rice-close-up.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "g02": "https://images.unsplash.com/photo-1763704189952-660d9055abbb?auto=format&fit=crop&w=900&q=80",
  "g03": "https://images.unsplash.com/photo-1730591857303-0fa44be3f677?auto=format&fit=crop&w=900&q=80",
  "g04": "https://images.pexels.com/photos/15206766/pexels-photo-15206766/free-photo-of-spoon-in-glass-of-sugar.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "g05": "https://images.unsplash.com/photo-1772472023164-61a6f0da9200?auto=format&fit=crop&w=900&q=80",
  "g06": "https://images.pexels.com/photos/17236203/pexels-photo-17236203/free-photo-of-a-bowl-of-flour.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "g07": "https://images.unsplash.com/photo-1745192621767-0393e7161f11?auto=format&fit=crop&w=900&q=80",
  "g08": "https://images.pexels.com/photos/31555433/pexels-photo-31555433/free-photo-of-bowl-of-raw-rice-on-a-white-background.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "v01": "https://images.unsplash.com/photo-1635847163737-c93e3d73bcc6?auto=format&fit=crop&w=900&q=80",
  "v02": "https://images.unsplash.com/photo-1769489023736-ae94eb8f3a38?auto=format&fit=crop&w=900&q=80",
  "v03": "https://images.unsplash.com/photo-1767156969831-0beee76fa958?auto=format&fit=crop&w=900&q=80",
  "v04": "https://images.unsplash.com/photo-1754891785053-854ef42468cc?auto=format&fit=crop&w=900&q=80",
  "v05": "https://images.unsplash.com/photo-1756363866183-56d98ad88214?auto=format&fit=crop&w=900&q=80",
  "v06": "https://images.unsplash.com/photo-1757892797773-dd669db9af90?auto=format&fit=crop&w=900&q=80",
  "v07": "https://images.unsplash.com/photo-1543077689-082dc39735be?auto=format&fit=crop&w=900&q=80",
  "v08": "https://images.unsplash.com/photo-1717959159782-98c42b1d4f37?auto=format&fit=crop&w=900&q=80",
  "m01": "https://images.unsplash.com/photo-1642497394469-188b0f4bcae6?auto=format&fit=crop&w=900&q=80",
  "m02": "https://images.pexels.com/photos/8251004/pexels-photo-8251004.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "m03": "https://images.pexels.com/photos/7140316/pexels-photo-7140316.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "m04": "https://images.unsplash.com/photo-1642102903996-cdad15f5dcdd?auto=format&fit=crop&w=900&q=80",
  "m05": "https://images.pexels.com/photos/7495481/pexels-photo-7495481.png?auto=compress&dpr=1&h=750&w=1260",
  "m06": "https://images.pexels.com/photos/6896518/pexels-photo-6896518.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "m07": "https://images.pexels.com/photos/18606624/pexels-photo-18606624/free-photo-of-close-up-of-meat-and-livers.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "m08": "https://images.pexels.com/photos/31732110/pexels-photo-31732110/free-photo-of-close-up-of-raw-lamb-chops-with-marbling.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "f01": "https://images.pexels.com/photos/15553656/pexels-photo-15553656/free-photo-of-stack-of-fresh-fish-at-market.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "f02": "https://images.pexels.com/photos/10112470/pexels-photo-10112470.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "f03": "https://images.pexels.com/photos/29307537/pexels-photo-29307537/free-photo-of-fresh-fish-display-on-a-market-stall.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=750&w=1260",
  "f04": "https://images.pexels.com/photos/36122229/pexels-photo-36122229/free-photo-of-fresh-fish-display-at-local-market-stall.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "f05": "https://images.pexels.com/photos/7451965/pexels-photo-7451965.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "f06": "https://images.pexels.com/photos/40700642/pexels-photo-40700642/free-photo-of-fresh-hilsa-fish-on-ice-in-dhaka-market.jpeg?auto=compress&dpr=1&h=750&w=1260",
  "f07": "https://images.unsplash.com/photo-1756361945963-4b08e8b7ef3e?auto=format&fit=crop&w=900&q=80",
  "f08": "https://images.unsplash.com/photo-1773158096376-3e0f1af05706?auto=format&fit=crop&w=900&q=80"
};

const CART_KEY = 'ecogrocerbd-phase1-cart';
let cart = loadCart();
let toastTimer = null;

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const validIds = new Set(PRODUCTS.map(product => product.id));
    return Object.fromEntries(Object.entries(parsed)
      .filter(([id, qty]) => validIds.has(id) && Number.isFinite(Number(qty)) && Number(qty) > 0)
      .map(([id, qty]) => [id, Math.min(99, Math.floor(Number(qty)))]));
  } catch (_) {
    return {};
  }
}

function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) { /* private browsing may block storage */ }
}

function formatPrice(value) {
  return `৳ ${Number(value).toLocaleString('en-US')}`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function productSlug(product) {
  const namePart = String(product && (product.en || product.name) || 'product')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
  return namePart + '-' + String(product && product.id || '').toLowerCase();
}

function productPageUrl(product) {
  return 'product.html?slug=' + encodeURIComponent(productSlug(product));
}

function normalizeSearch(value) {
  return String(value || '')
    .toLocaleLowerCase('bn-BD')
    .normalize('NFKC')
    .replace(/[\u200c\u200d]/g, '')
    .replace(/[.,/\\_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function productCard(product) {
  const qty = Number(cart[product.id] || 0);
  const outOfStock = Boolean(product.track_inventory) && Number(product.stock_quantity || 0) <= 0;
  const imageUrl = PRODUCT_IMAGES[product.id];
  const addControl = outOfStock
    ? '<button class="add-button" type="button" disabled aria-label="' + escapeHTML(product.name) + ' বর্তমানে স্টকে নেই">Out of Stock</button>'
    : qty > 0
      ? `<div class="qty-stepper" aria-label="${escapeHTML(product.name)} পরিমাণ"><button type="button" data-cart-action="decrease" data-id="${product.id}" aria-label="একটি কমান">−</button><span>${qty}</span><button type="button" data-cart-action="increase" data-id="${product.id}" aria-label="একটি বাড়ান">+</button></div>`
      : `<button class="add-button" type="button" data-cart-action="increase" data-id="${product.id}" aria-label="${escapeHTML(product.name)} কার্টে যোগ করুন">Add to Cart</button>`;

  const productUrl = productPageUrl(product);
  return `
    <article class="product-card" data-product-id="${product.id}" data-product-detail="${product.id}" data-search="${escapeHTML(`${product.name} ${product.en} ${product.unit} ${(product.aliases || []).join(' ')} ${CATEGORIES.find(c => c.id === product.category)?.bangla || ''}`.toLowerCase())}">
      <div class="product-media"><a class="product-image-trigger" href="${productUrl}" aria-label="${escapeHTML(product.name)}-এর বিস্তারিত দেখুন">
        <img class="product-image" src="${imageUrl}" alt="${escapeHTML(product.name)}" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false">
        <span class="product-placeholder" hidden><span aria-hidden="true">▧</span><small>ছবি পাওয়া যায়নি</small></span>
      </a></div>
      <h3 class="product-name"><a href="${productUrl}" aria-label="${escapeHTML(product.name)}-এর বিস্তারিত দেখুন">${escapeHTML(product.name)}</a><span class="product-unit">${escapeHTML(product.unit)}</span></h3>
      <div class="product-buy-row"><strong class="product-price">${formatPrice(product.price)}</strong>${addControl}</div>
    </article>`;
}

function renderProducts() {
  const featured = PRODUCTS.filter(product => product.featured).slice(0, 8);
  const featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid) featuredGrid.innerHTML = featured.map(productCard).join('');

  CATEGORIES.forEach(category => {
    const target = document.querySelector(`[data-product-grid="${category.id}"]`);
    if (!target) return;
    const items = PRODUCTS.filter(product => product.category === category.id);
    target.innerHTML = items.map(productCard).join('');
  });
  refreshSearch();
}

function cartCount() {
  return Object.values(cart).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
}

function cartSubtotal() {
  return PRODUCTS.reduce((sum, product) => sum + product.price * Math.max(0, Number(cart[product.id]) || 0), 0);
}

function updateCartBadges() {
  const count = cartCount();
  const headerCount = document.getElementById('header-cart-count');
  const bottomCount = document.getElementById('bottom-cart-count');
  if (headerCount) headerCount.textContent = count;
  if (bottomCount) bottomCount.textContent = count;
}

function renderCart() {
  const container = document.getElementById('cart-items');
  if (!container) {
    updateCartBadges();
    return;
  }
  const lines = PRODUCTS.filter(product => Number(cart[product.id]) > 0);
  if (!lines.length) {
    container.innerHTML = '<div class="cart-empty"><span>🧺</span><strong>আপনার কার্ট এখনো খালি</strong><p>পছন্দের পণ্য কার্টে যোগ করুন।</p></div>';
  } else {
    container.innerHTML = lines.map(product => `
      <div class="cart-line">
        <div class="cart-line-art" aria-hidden="true"><img src="${PRODUCT_IMAGES[product.id]}" alt="" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer" onerror="this.hidden=true"></div>
        <div><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.unit)} · ${formatPrice(product.price)}</small>
          <div class="cart-line-controls"><button type="button" data-cart-action="decrease" data-id="${product.id}" aria-label="একটি কমান">−</button><span>${cart[product.id]}</span><button type="button" data-cart-action="increase" data-id="${product.id}" aria-label="একটি বাড়ান">+</button></div>
        </div>
        <span class="cart-line-total">${formatPrice(product.price * cart[product.id])}</span>
      </div>`).join('');
  }
  const subtotalNode = document.getElementById('cart-subtotal');
  if (subtotalNode) subtotalNode.textContent = formatPrice(cartSubtotal());
  updateCartBadges();
}

function changeCart(productId, delta) {
  const product = PRODUCTS.find(item => item.id === productId);
  if (!product) return;
  const stockCap = product.track_inventory ? Math.max(0, Number(product.stock_quantity) || 0) : 99;
  if (delta > 0 && stockCap === 0) {
    showToast('এই পণ্যটি বর্তমানে স্টকে নেই');
    return;
  }
  const currentQuantity = Number(cart[productId] || 0);
  if (delta > 0 && currentQuantity >= stockCap) {
    showToast('স্টকে থাকা সর্বোচ্চ পরিমাণ কার্টে আছে');
    return;
  }
  const next = Math.min(stockCap, Math.max(0, currentQuantity + delta));
  if (delta > 0 && next === currentQuantity) {
    showToast('স্টকে থাকা সর্বোচ্চ পরিমাণ কার্টে আছে');
    return;
  }
  if (next === 0) delete cart[productId];
  else cart[productId] = next;
  saveCart();
  renderProducts();
  renderCart();
  if (delta > 0) showToast(`${product.name} কার্টে যোগ হয়েছে`);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2100);
}

function openDrawer() {
  const drawer = document.getElementById('site-drawer');
  const scrim = document.getElementById('drawer-scrim');
  const trigger = document.getElementById('menu-open');
  if (!drawer || !scrim) return;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  scrim.hidden = false;
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  document.body.classList.add('no-scroll');
}

function syncScrollLock() {
  const drawer = document.getElementById('site-drawer');
  const cart = document.getElementById('cart-drawer');
  const login = document.getElementById('login-scrim');
  const drawerOpen = Boolean(drawer && drawer.classList.contains('open'));
  const cartOpen = Boolean(cart && cart.classList.contains('open'));
  const loginOpen = Boolean(login && !login.hidden);
  document.body.classList.toggle('no-scroll', drawerOpen || cartOpen || loginOpen);
}

function closeDrawer() {
  const drawer = document.getElementById('site-drawer');
  const scrim = document.getElementById('drawer-scrim');
  const trigger = document.getElementById('menu-open');
  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (scrim) scrim.hidden = true;
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  syncScrollLock();
}

function openCart() {
  const drawer = document.getElementById('cart-drawer');
  const scrim = document.getElementById('panel-scrim');
  if (!drawer || !scrim) {
    window.location.href = 'checkout.html';
    return;
  }
  closeDrawer();
  renderCart();
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  scrim.hidden = false;
  syncScrollLock();
}

function closeCart() {
  const drawer = document.getElementById('cart-drawer');
  const scrim = document.getElementById('panel-scrim');
  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (scrim) scrim.hidden = true;
  syncScrollLock();
}

function openLogin() {
  closeDrawer();
  closeCart();
  const login = document.getElementById('login-scrim');
  if (login) login.hidden = false;
  else window.location.href = 'account.html';
  syncScrollLock();
}

function closeLogin() {
  const login = document.getElementById('login-scrim');
  if (login) login.hidden = true;
  syncScrollLock();
}

function refreshSearch() {
  const searchInput = document.getElementById('product-search');
  if (!searchInput) return;
  const query = normalizeSearch(searchInput.value);
  let totalMatches = 0;
  const activeCategory = document.body.classList.contains('category-page')
    ? document.body.dataset.categoryPage
    : '';
  document.querySelectorAll('[data-section-category]').forEach(section => {
    const inScope = !activeCategory || section.dataset.sectionCategory === activeCategory;
    let sectionMatches = 0;
    section.querySelectorAll('.product-card').forEach(card => {
      const text = normalizeSearch(card.dataset.search || '');
      const matched = inScope && (!query || text.includes(query) || query.split(' ').every(part => text.includes(part)));
      card.hidden = !matched;
      if (matched) sectionMatches++;
    });
    section.hidden = !inScope || sectionMatches === 0;
    totalMatches += sectionMatches;
  });
  const featuredSection = document.querySelector('.featured-section');
  const priceNotice = document.querySelector('.price-notice');
  if (featuredSection) featuredSection.hidden = Boolean(query);
  if (priceNotice) priceNotice.hidden = Boolean(query);
  const categorySections = document.getElementById('category-sections');
  if (!categorySections) return;
  let empty = document.getElementById('search-empty-state');
  if (!empty) {
    empty = document.createElement('div');
    empty.id = 'search-empty-state';
    empty.className = 'no-results section-wrap';
    empty.textContent = 'দুঃখিত, এই নামে কোনো পণ্য পাওয়া যায়নি। অন্য নামে খুঁজে দেখুন।';
    categorySections.appendChild(empty);
  }
  empty.hidden = !query || totalMatches > 0;
}

function runSearch() {
  refreshSearch();
  const target = document.getElementById('category-sections');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function focusSearch() {
  closeDrawer();
  closeCart();
  const section = document.getElementById('search-section');
  const input = document.getElementById('product-search');
  if (!section || !input) {
    window.location.href = 'index.html#search-section';
    return;
  }
  section.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => input.focus(), 350);
}

function setActiveBottomLink(href) {
  document.querySelectorAll('.bottom-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === href));
}

// Delegated interactions for product cards and cart rows.
document.addEventListener('click', event => {
  const action = event.target.closest('[data-cart-action]');
  if (action) {
    const delta = action.dataset.cartAction === 'decrease' ? -1 : 1;
    changeCart(action.dataset.id, delta);
    return;
  }

  const loginTrigger = event.target.closest('[data-open-login]');
  if (loginTrigger) { openLogin(); return; }

  const searchTrigger = event.target.closest('[data-focus-search]');
  if (searchTrigger) {
    if (searchTrigger.tagName === 'A') event.preventDefault();
    focusSearch();
    return;
  }

  const searchTerm = event.target.closest('[data-search-term]');
  if (searchTerm) {
    const input = document.getElementById('product-search');
    input.value = searchTerm.dataset.searchTerm;
    runSearch();
  }

  const drawerLink = event.target.closest('.drawer-nav a');
  if (drawerLink && !drawerLink.hasAttribute('data-focus-search')) closeDrawer();

  const categoryLink = event.target.closest('[data-category-link]');
  if (categoryLink) setActiveBottomLink('#categories');
  if (event.target.closest('.bottom-link[href="#home"]')) setActiveBottomLink('#home');
  if (event.target.closest('.bottom-link[href="#categories"]')) setActiveBottomLink('#categories');
  if (event.target.closest('.bottom-link[href="#search-section"]')) setActiveBottomLink('#search-section');
});

function bindClick(id, handler) {
  const node = document.getElementById(id);
  if (node) node.addEventListener('click', handler);
}
function bindInput(id, eventName, handler) {
  const node = document.getElementById(id);
  if (node) node.addEventListener(eventName, handler);
}
bindClick('menu-open', openDrawer);
bindClick('menu-close', closeDrawer);
bindClick('drawer-scrim', closeDrawer);
bindClick('cart-open', openCart);
bindClick('bottom-cart-open', openCart);
bindClick('cart-close', closeCart);
bindClick('panel-scrim', closeCart);
bindClick('login-close', closeLogin);
bindClick('login-scrim', event => { if (event.target.id === 'login-scrim') closeLogin(); });
bindInput('product-search-form', 'submit', event => { event.preventDefault(); runSearch(); });
bindInput('product-search', 'input', refreshSearch);
bindClick('checkout-placeholder', () => {
  if (typeof window.openEcoCheckout === 'function') window.openEcoCheckout();
  else window.location.href = 'checkout.html';
});
bindClick('market-request-button', () => showToast('Market Request ফিচার পরবর্তী ধাপে যুক্ত হবে'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeDrawer(); closeCart(); closeLogin(); }
});

// Avoid page scroll behind slide-in panels.
const style = document.createElement('style');
style.textContent = 'body.no-scroll{overflow:hidden;} [hidden]{display:none !important;}';
document.head.appendChild(style);

// On mobile, reveal the header on upward movement and tuck it away on downward movement.
function initMobileHeaderScrollBehavior() {
  const header = document.querySelector('.site-header');
  if (!header || !window.matchMedia) return;

  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const getScrollY = () => Math.max(
    0,
    window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
  );

  let lastScrollY = getScrollY();
  let framePending = false;

  const revealHeader = () => header.classList.remove('is-scroll-hidden');
  const concealHeader = () => header.classList.add('is-scroll-hidden');

  const updateHeader = () => {
    const currentY = getScrollY();
    const movement = currentY - lastScrollY;

    if (!mobileQuery.matches || document.body.classList.contains('no-scroll') || currentY <= 4) {
      revealHeader();
    } else if (movement > 1.5) {
      concealHeader();
    } else if (movement < -1.5) {
      revealHeader();
    }

    lastScrollY = currentY;
    framePending = false;
  };

  window.addEventListener('scroll', () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateHeader);
  }, { passive: true });

  window.addEventListener('resize', () => {
    lastScrollY = getScrollY();
    if (!mobileQuery.matches) revealHeader();
  }, { passive: true });

  window.addEventListener('pageshow', () => {
    lastScrollY = getScrollY();
    revealHeader();
  });
}
initMobileHeaderScrollBehavior();

function initHeroSlider() {
  const slides = [...document.querySelectorAll('[data-hero-slide]')];
  const dots = [...document.querySelectorAll('[data-hero-target]')];
  if (slides.length < 2 || dots.length !== slides.length) return;
  let active = 0;
  let timer = null;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = index => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const selected = i === active;
      slide.hidden = !selected;
      slide.classList.toggle('is-active', selected);
      slide.setAttribute('aria-hidden', String(!selected));
    });
    dots.forEach((dot, i) => {
      const selected = i === active;
      dot.classList.toggle('is-active', selected);
      dot.setAttribute('aria-pressed', String(selected));
    });
  };
  const restart = () => {
    if (timer) window.clearInterval(timer);
    if (!reducedMotion) timer = window.setInterval(() => show(active + 1), 5200);
  };
  dots.forEach(dot => dot.addEventListener('click', () => {
    show(Number(dot.dataset.heroTarget) || 0);
    restart();
  }));
  const hero = document.querySelector('.hero-section');
  hero.addEventListener('mouseenter', () => { if (timer) window.clearInterval(timer); });
  hero.addEventListener('mouseleave', restart);
  hero.addEventListener('focusin', () => { if (timer) window.clearInterval(timer); });
  hero.addEventListener('focusout', restart);
  show(0);
  restart();
}

const currentYear = document.getElementById('current-year');
if (currentYear) currentYear.textContent = new Date().getFullYear();
initHeroSlider();

renderProducts();
renderCart();

async function loadLiveCatalogue() {
  const apiUrl = window.ECOGROCER_CONFIG && window.ECOGROCER_CONFIG.apiUrl;
  if (!apiUrl) return;
  try {
    const response = await fetch(apiUrl + '?action=products', { headers: { Accept: 'application/json' } });
    if (!response.ok) return; // Static catalogue remains available during database setup.
    const data = await response.json();
    if (!Array.isArray(data.products) || !data.products.length) return;
    const liveProducts = data.products.map(item => ({
      ...item,
      category: item.category_id || item.category,
      en: item.english_name || item.en || '',
      price: Number(item.price),
      unit: item.unit || '',
      aliases: Array.isArray(item.aliases) ? item.aliases : [],
      track_inventory: Boolean(item.track_inventory),
      stock_quantity: Number(item.stock_quantity || 0)
    }));
    PRODUCTS.splice(0, PRODUCTS.length, ...liveProducts);
    liveProducts.forEach(item => {
      if (item.image_url) PRODUCT_IMAGES[item.id] = item.image_url;
    });
    renderProducts();
    renderCart();
    document.dispatchEvent(new CustomEvent('ecogrocer:catalogue-updated'));
  } catch (error) {
    console.warn('EcoGrocer live catalogue is unavailable; using the local catalogue.', error);
  }
}
loadLiveCatalogue();

// Keep direct links such as index.html?q=rice useful for product searches.
try {
  const initialQuery = new URLSearchParams(window.location.search).get('q');
  const searchInput = document.getElementById('product-search');
  if (initialQuery && searchInput) {
    searchInput.value = initialQuery;
    runSearch();
  }
} catch (_) { /* The homepage remains usable if URL parsing is unavailable. */ }