'use strict';

const CATEGORIES = [
  { id: 'grocery', title: 'Grocery', bangla: 'মুদি পণ্য' },
  { id: 'vegetables', title: 'Vegetables', bangla: 'শাক-সবজি' },
  { id: 'meat', title: 'Meat', bangla: 'মাংস' },
  { id: 'fish', title: 'Fish', bangla: 'মাছ' }
];

// Price and pack-size references are documented in PRODUCT-PRICE-SOURCES.md.
// All entries are editable starter catalogue data, not confirmed EcoGrocer stock.
const PRODUCTS = [
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
  const addControl = qty > 0
    ? `<div class="qty-stepper" aria-label="${escapeHTML(product.name)} পরিমাণ"><button type="button" data-cart-action="decrease" data-id="${product.id}" aria-label="একটি কমান">−</button><span>${qty}</span><button type="button" data-cart-action="increase" data-id="${product.id}" aria-label="একটি বাড়ান">+</button></div>`
    : `<button class="add-button" type="button" data-cart-action="increase" data-id="${product.id}" aria-label="${escapeHTML(product.name)} কার্টে যোগ করুন">+</button>`;

  return `
    <article class="product-card" data-product-id="${product.id}" data-search="${escapeHTML(`${product.name} ${product.en} ${product.unit} ${(product.aliases || []).join(' ')} ${CATEGORIES.find(c => c.id === product.category)?.bangla || ''}`.toLowerCase())}">
      <div class="product-media" role="img" aria-label="${escapeHTML(product.name)}-এর ছবির জন্য ফাঁকা জায়গা">
        <span class="product-placeholder"><span aria-hidden="true">▧</span><small>ছবি যোগ হবে</small></span>
      </div>
      ${product.featured ? '<span class="product-label">জনপ্রিয়</span>' : '<span class="product-label">নমুনা পণ্য</span>'}
      <h3 class="product-name">${escapeHTML(product.name)}<span class="product-unit">${escapeHTML(product.unit)}</span></h3>
      <div class="product-buy-row"><strong class="product-price">${formatPrice(product.price)}</strong>${addControl}</div>
    </article>`;
}

function renderProducts() {
  const featured = PRODUCTS.filter(product => product.featured).slice(0, 8);
  document.getElementById('featured-grid').innerHTML = featured.map(productCard).join('');

  CATEGORIES.forEach(category => {
    const target = document.querySelector(`[data-product-grid="${category.id}"]`);
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
  document.getElementById('header-cart-count').textContent = count;
  document.getElementById('bottom-cart-count').textContent = count;
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const lines = PRODUCTS.filter(product => Number(cart[product.id]) > 0);
  if (!lines.length) {
    container.innerHTML = '<div class="cart-empty"><span>🧺</span><strong>আপনার কার্ট এখনো খালি</strong><p>পছন্দের পণ্য কার্টে যোগ করুন।</p></div>';
  } else {
    container.innerHTML = lines.map(product => `
      <div class="cart-line">
        <div class="cart-line-art" aria-hidden="true">▧</div>
        <div><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.unit)} · ${formatPrice(product.price)}</small>
          <div class="cart-line-controls"><button type="button" data-cart-action="decrease" data-id="${product.id}" aria-label="একটি কমান">−</button><span>${cart[product.id]}</span><button type="button" data-cart-action="increase" data-id="${product.id}" aria-label="একটি বাড়ান">+</button></div>
        </div>
        <span class="cart-line-total">${formatPrice(product.price * cart[product.id])}</span>
      </div>`).join('');
  }
  document.getElementById('cart-subtotal').textContent = formatPrice(cartSubtotal());
  updateCartBadges();
}

function changeCart(productId, delta) {
  const product = PRODUCTS.find(item => item.id === productId);
  if (!product) return;
  const next = Math.min(99, Math.max(0, (Number(cart[productId]) || 0) + delta));
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
  document.getElementById('site-drawer').classList.add('open');
  document.getElementById('site-drawer').setAttribute('aria-hidden', 'false');
  document.getElementById('drawer-scrim').hidden = false;
  document.getElementById('menu-open').setAttribute('aria-expanded', 'true');
  document.body.classList.add('no-scroll');
}

function syncScrollLock() {
  const drawerOpen = document.getElementById('site-drawer').classList.contains('open');
  const cartOpen = document.getElementById('cart-drawer').classList.contains('open');
  const loginOpen = !document.getElementById('login-scrim').hidden;
  document.body.classList.toggle('no-scroll', drawerOpen || cartOpen || loginOpen);
}

function closeDrawer() {
  document.getElementById('site-drawer').classList.remove('open');
  document.getElementById('site-drawer').setAttribute('aria-hidden', 'true');
  document.getElementById('drawer-scrim').hidden = true;
  document.getElementById('menu-open').setAttribute('aria-expanded', 'false');
  syncScrollLock();
}

function openCart() {
  closeDrawer();
  renderCart();
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-drawer').setAttribute('aria-hidden', 'false');
  document.getElementById('panel-scrim').hidden = false;
  syncScrollLock();
}

function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-drawer').setAttribute('aria-hidden', 'true');
  document.getElementById('panel-scrim').hidden = true;
  syncScrollLock();
}

function openLogin() {
  closeDrawer();
  closeCart();
  document.getElementById('login-scrim').hidden = false;
  syncScrollLock();
}

function closeLogin() {
  document.getElementById('login-scrim').hidden = true;
  syncScrollLock();
}

function refreshSearch() {
  const query = normalizeSearch(document.getElementById('product-search').value);
  let totalMatches = 0;
  document.querySelectorAll('[data-section-category]').forEach(section => {
    let sectionMatches = 0;
    section.querySelectorAll('.product-card').forEach(card => {
      const text = normalizeSearch(card.dataset.search || '');
      const matched = !query || text.includes(query) || query.split(' ').every(part => text.includes(part));
      card.hidden = !matched;
      if (matched) sectionMatches++;
    });
    section.hidden = sectionMatches === 0;
    totalMatches += sectionMatches;
  });
  const featuredSection = document.querySelector('.featured-section');
  featuredSection.hidden = Boolean(query);
  document.querySelector('.price-notice').hidden = Boolean(query);
  let empty = document.getElementById('search-empty-state');
  if (!empty) {
    empty = document.createElement('div');
    empty.id = 'search-empty-state';
    empty.className = 'no-results section-wrap';
    empty.textContent = 'দুঃখিত, এই নামে কোনো পণ্য পাওয়া যায়নি। অন্য নামে খুঁজে দেখুন।';
    document.getElementById('category-sections').appendChild(empty);
  }
  empty.hidden = !query || totalMatches > 0;
}

function runSearch() {
  refreshSearch();
  const target = document.getElementById('category-sections');
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function focusSearch() {
  closeDrawer();
  closeCart();
  document.getElementById('search-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => document.getElementById('product-search').focus(), 350);
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

document.getElementById('menu-open').addEventListener('click', openDrawer);
document.getElementById('menu-close').addEventListener('click', closeDrawer);
document.getElementById('drawer-scrim').addEventListener('click', closeDrawer);
document.getElementById('cart-open').addEventListener('click', openCart);
document.getElementById('bottom-cart-open').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
document.getElementById('panel-scrim').addEventListener('click', closeCart);
document.getElementById('login-close').addEventListener('click', closeLogin);
document.getElementById('login-scrim').addEventListener('click', event => { if (event.target.id === 'login-scrim') closeLogin(); });
document.getElementById('product-search-form').addEventListener('submit', event => { event.preventDefault(); runSearch(); });
document.getElementById('product-search').addEventListener('input', refreshSearch);
document.getElementById('checkout-placeholder').addEventListener('click', () => showToast('চেকআউট পরবর্তী ধাপে তৈরি করা হবে'));
document.getElementById('market-request-button').addEventListener('click', () => showToast('Market Request ফিচার পরবর্তী ধাপে যুক্ত হবে'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeDrawer(); closeCart(); closeLogin(); }
});

// Avoid page scroll behind slide-in panels.
const style = document.createElement('style');
style.textContent = 'body.no-scroll{overflow:hidden;} [hidden]{display:none !important;}';
document.head.appendChild(style);

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

document.getElementById('current-year').textContent = new Date().getFullYear();
initHeroSlider();
renderProducts();
renderCart();

// Keep direct links such as index.html?q=rice useful for product searches.
try {
  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    document.getElementById('product-search').value = initialQuery;
    runSearch();
  }
} catch (_) { /* The homepage remains usable if URL parsing is unavailable. */ }