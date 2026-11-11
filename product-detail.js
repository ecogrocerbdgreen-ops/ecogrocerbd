'use strict';

(function () {
  const config = window.ECOGROCER_CONFIG || {};
  const shopWhatsApp = String(config.whatsappNumber || window.ECOGROCER_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const shopPhone = String(config.phoneNumber || window.ECOGROCER_PHONE_NUMBER || '').replace(/\D/g, '');
  const isProductPage = document.body.classList.contains('product-page-mode');
  const detailScrim = document.getElementById('product-detail-scrim');
  const detailContent = isProductPage
    ? document.getElementById('product-page-content')
    : document.getElementById('product-detail-content');
  const lightbox = document.getElementById('product-lightbox');
  let activeProductId = '';
  let lastFocusedElement = null;

  const descriptions = {
    g01: 'দৈনন্দিন ভাতের রান্নার জন্য মিনিকেট চালের প্যাক। পরিবারের বাজারের তালিকায় প্রয়োজন অনুযায়ী প্যাক সাইজ বেছে নিন।',
    g02: 'রান্নার সাধারণ প্রয়োজনের জন্য সয়াবিন তেল। নির্ধারিত ১ লিটারের প্যাক হিসেবে তালিকাভুক্ত।',
    g03: 'ডাল, খিচুড়ি ও ঘরোয়া রান্নায় ব্যবহারের জন্য মসুর ডাল। ১ কেজির প্যাক।',
    g04: 'চা, নাশতা ও দৈনন্দিন রান্নার প্রয়োজনের জন্য চিনি। ১ কেজির প্যাক।',
    g05: 'প্রতিদিনের খাবারের জন্য লেয়ার ডিমের ১২টির প্যাক। ভাঙা বা ক্ষতিগ্রস্ত প্যাক এড়াতে ডেলিভারির সময় দেখে নিন।',
    g06: 'রুটি, পরোটা ও অন্যান্য রান্নায় ব্যবহারের জন্য আটা। ২ কেজির প্যাক।',
    g07: 'দৈনন্দিন রান্নার জন্য আয়োডিনযুক্ত লবণ। ১ কেজির প্যাক।',
    g08: 'পোলাও, খিচুড়ি ও বিশেষ রান্নার জন্য সুগন্ধি চিনিগুঁড়া চাল। ১ কেজির প্যাক।',
    v01: 'রান্নার বহুল ব্যবহৃত সবজি আলু। ১ কেজি হিসেবে তালিকাভুক্ত; প্রয়োজন অনুযায়ী কার্টে পরিমাণ বাড়াতে পারবেন।',
    v02: 'সালাদ, ভর্তা ও রান্নায় ব্যবহারের জন্য টমেটো। ৫০০ গ্রামের প্যাক।',
    v03: 'তরকারি, ভর্তা ও সালাদের স্বাদ বাড়াতে ধনেপাতা। ১০০ গ্রামের প্যাক।',
    v04: 'রান্নার মসলা হিসেবে ব্যবহারের জন্য ইমপোর্টেড রসুন। ৫০০ গ্রামের প্যাক।',
    v05: 'ঝাল স্বাদের রান্নার জন্য কাঁচা মরিচ। ২৫০ গ্রামের প্যাক।',
    v06: 'সালাদ ও দৈনন্দিন রান্নায় ব্যবহারের জন্য দেশি শসা। ৫০০ গ্রামের প্যাক।',
    v07: 'রান্নার প্রয়োজনীয় দেশি পেঁয়াজ। ১ কেজির প্যাক।',
    v08: 'ভাজি, সালাদ ও রান্নায় ব্যবহারের জন্য দেশি গাজর। ৫০০ গ্রামের প্যাক।',
    m01: 'চামড়া ছাড়া ব্রয়লার মুরগি—প্রস্তুতির ধরনটি পণ্যের নামেই উল্লেখ করা হয়েছে। ১ কেজি হিসেবে তালিকাভুক্ত।',
    m02: 'চামড়াসহ ব্রয়লার মুরগি। ১ কেজির প্যাক; রান্নার আগে আপনার পছন্দমতো পরিষ্কার ও প্রস্তুতির নির্দেশনা নোটে দিতে পারেন।',
    m03: 'চিকেন লেগ পিস, চামড়াসহ। ১ কেজির প্যাক।',
    m04: 'চামড়া ছাড়া দেশি মুরগি। ৫০০ গ্রামের প্যাক।',
    m05: 'হাড়বিহীন গরুর মাংস। ৫০০ গ্রামের প্যাক; বিশেষ কাটিং নির্দেশনা থাকলে অর্ডারের নোটে লিখুন।',
    m06: 'হাড়সহ গরুর মাংস। ১ কেজির প্যাক; রান্নার উপযোগী কাটিংয়ের নির্দেশনা নোটে জানাতে পারবেন।',
    m07: 'গরুর কলিজা। ৫০০ গ্রামের প্যাক; অর্ডারের সময় পণ্যের পরিমাণ ও নির্দেশনা দেখে নিন।',
    m08: 'হাড়সহ খাসির মাংস। ১ কেজির প্যাক; কাটিং সংক্রান্ত পছন্দ অতিরিক্ত নোটে জানাতে পারবেন।',
    f01: 'তেলাপিয়া মাছ। ১ কেজি হিসেবে তালিকাভুক্ত; পরিষ্কার বা কাটার নির্দেশনা অর্ডারের নোটে লিখতে পারবেন।',
    f02: 'রুই মাছ। ১ কেজির প্যাক; মাছ কাটার পছন্দ থাকলে অর্ডারের নোটে উল্লেখ করুন।',
    f03: 'কাতলা মাছ। ১ কেজির প্যাক; পরিষ্কার ও কাটার নির্দেশনা নোটে জানাতে পারবেন।',
    f04: 'মৃগেল মাছ। ১ কেজি হিসেবে তালিকাভুক্ত; অর্ডারের সময় প্রয়োজনীয় প্রস্তুতির নির্দেশনা দিন।',
    f05: 'শিং মাছ। ১ কেজির প্যাক; পরিষ্কার বা কাটার পছন্দ অর্ডারের নোটে উল্লেখ করতে পারবেন।',
    f06: 'পাঙ্গাস মাছ। ১ কেজির প্যাক; রান্নার উপযোগী কাটিংয়ের নির্দেশনা নোটে লিখুন।',
    f07: 'পাবদা মাছ। ১ কেজির প্যাক; প্রয়োজনীয় প্রস্তুতির নির্দেশনা অর্ডারের নোটে জানাতে পারবেন।',
    f08: 'চাষের কৈ মাছ। ১ কেজির প্যাক; পরিষ্কার বা কাটার পছন্দ অর্ডারের নোটে লিখতে পারবেন।'
  };

  const categoryCopy = {
    grocery: 'Grocery · মুদি পণ্য',
    vegetables: 'Vegetables · শাক-সবজি',
    meat: 'Meat · মাংস',
    fish: 'Fish · মাছ'
  };

  function money(value) {
    return '৳ ' + Number(value).toLocaleString('en-US');
  }
  function findProduct(id) {
    return PRODUCTS.find(function (product) { return product.id === id; });
  }
  function imageFor(product) {
    return PRODUCT_IMAGES[product.id] || '';
  }
  function descriptionFor(product) {
    return descriptions[product.id] || 'পণ্যের প্যাক সাইজ ও তালিকাভুক্ত মূল্য দেখে কার্টে যোগ করুন।';
  }
  function updateBodyLock() {
    var checkout = document.getElementById('checkout-scrim');
    var cartDrawer = document.getElementById('cart-drawer');
    var siteDrawer = document.getElementById('site-drawer');
    var locked = Boolean((detailScrim && !detailScrim.hidden) ||
      (lightbox && !lightbox.hidden) ||
      (checkout && !checkout.hidden) ||
      (cartDrawer && cartDrawer.classList.contains('open')) ||
      (siteDrawer && siteDrawer.classList.contains('open')));
    document.body.classList.toggle('no-scroll', locked);
  }

  function recommendationCartControl(product) {
    var qty = Number(cart[product.id] || 0);
    var outOfStock = Boolean(product.track_inventory) && Number(product.stock_quantity || 0) <= 0;
    if (outOfStock) {
      return '<button type="button" class="recommended-add" disabled aria-label="' + escapeHTML(product.name) + ' বর্তমানে স্টকে নেই">Out of Stock</button>';
    }
    if (qty > 0) {
      return '<div class="recommended-qty-stepper" role="group" aria-label="' + escapeHTML(product.name) + ' পরিমাণ">' +
        '<button type="button" data-recommend-action="decrease" data-recommend-id="' + product.id + '" aria-label="' + escapeHTML(product.name) + ' একটি কমান">−</button>' +
        '<span aria-live="polite">' + qty + '</span>' +
        '<button type="button" data-recommend-action="increase" data-recommend-id="' + product.id + '" aria-label="' + escapeHTML(product.name) + ' একটি বাড়ান">+</button>' +
      '</div>';
    }
    return '<button type="button" class="recommended-add" data-recommend-add="' + product.id + '" aria-label="' + escapeHTML(product.name) + ' কার্টে যোগ করুন">Add to Cart</button>';
  }

  function recommendationCard(product) {
    return '<article class="recommended-product">' +
      '<a class="recommended-product-open" href="' + productPageUrl(product) + '" aria-label="' + escapeHTML(product.name) + ' বিস্তারিত দেখুন">' +
        '<span class="recommended-product-image"><img src="' + imageFor(product) + '" alt="' + escapeHTML(product.name) + '" loading="lazy" onerror="this.hidden=true"></span>' +
        '<span class="recommended-product-copy"><strong>' + escapeHTML(product.name) + '</strong><small>' + escapeHTML(product.unit) + '</small><b>' + money(product.price) + '</b></span>' +
      '</a>' +
      '<div class="recommended-cart-control" data-recommend-control="' + product.id + '">' + recommendationCartControl(product) + '</div>' +
    '</article>';
  }

  function renderProduct(product) {
    var category = CATEGORIES.find(function (item) { return item.id === product.category; });
    var qty = Number(cart[product.id] || 0);
    var outOfStock = Boolean(product.track_inventory) && Number(product.stock_quantity || 0) <= 0;
    var related = PRODUCTS.filter(function (item) {
      return item.category === product.category && item.id !== product.id;
    }).slice(0, 4);
    var markup =
      '<div class="product-detail-breadcrumb">' +
        (isProductPage ? '<a href="index.html#home">হোম</a>' : '<button type="button" data-detail-close>হোম</button>') +
        '<span>›</span>' +
        (isProductPage && category ? '<a href="category.html?category=' + encodeURIComponent(category.id) + '">' + escapeHTML(category.title) + '</a>' : '<span>' + escapeHTML(category ? category.title : 'Products') + '</span>') +
        '<span>›</span><strong>' + escapeHTML(product.name) + '</strong>' +
      '</div>' +
      '<section class="product-detail-main">' +
        '<div class="product-detail-gallery">' +
          '<button type="button" class="product-detail-image-button" data-detail-image="' + product.id + '" aria-label="ছবি বড় করে দেখুন">' +
            '<img src="' + imageFor(product) + '" alt="' + escapeHTML(product.name) + '" onerror="this.hidden=true;this.nextElementSibling.hidden=false">' +
            '<span class="product-detail-image-fallback" hidden>ছবি পাওয়া যায়নি</span>' +
            '<span class="image-zoom-hint">⌕ ছবি বড় করে দেখুন</span>' +
          '</button>' +
          '<div class="product-detail-photo-caption"><span>পণ্যের ছবি</span><span>ছবিতে ক্লিক করে বড় করে দেখুন</span></div>' +
        '</div>' +
        '<div class="product-detail-info">' +
          '<span class="product-detail-category">' + escapeHTML(categoryCopy[product.category] || 'EcoGrocer BD') + '</span>' +
          '<h1 id="product-detail-title">' + escapeHTML(product.name) + '</h1>' +
          '<p class="product-detail-english">' + escapeHTML(product.en || '') + '</p>' +
          '<div class="product-detail-price">' + money(product.price) + ' <span>/ ' + escapeHTML(product.unit) + '</span></div>' +
          '<div class="product-detail-meta"><span><b>প্যাক সাইজ</b>' + escapeHTML(product.unit) + '</span><span><b>পণ্য কোড</b>' + escapeHTML(product.id.toUpperCase()) + '</span></div>' +
          '<p class="product-detail-description">' + escapeHTML(descriptionFor(product)) + '</p>' +
          '<p class="product-detail-availability"><span class="availability-dot"></span> ' + (outOfStock ? 'এই পণ্যটি বর্তমানে স্টকে নেই' : (product.track_inventory ? 'স্টকে আছে: ' + Number(product.stock_quantity) + ' ইউনিট' : 'অর্ডার অনুযায়ী সংগ্রহ ও প্রাপ্যতা নিশ্চিত করা হবে')) + '</p>' +
          '<div class="product-detail-cart-state" id="detail-cart-state">' + (qty > 0 ? 'আপনার কার্টে এই পণ্যটি ' + qty + ' টি আছে' : 'এই পণ্যটি এখনো কার্টে যোগ করা হয়নি') + '</div>' +
          '<div class="product-detail-actions">' +
            '<button type="button" class="detail-action-order" data-detail-order="' + product.id + '"' + (outOfStock ? ' disabled' : '') + '><svg class="detail-action-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="m9.5 14 2 2 3.5-3.5"/></svg><span class="detail-action-copy"><span class="detail-action-label">Order Now</span></span></button>' +
            '<button type="button" class="detail-action-cart" data-detail-add="' + product.id + '"' + (outOfStock ? ' disabled' : '') + '><svg class="detail-action-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.2 11h11.1l2-8H6.1"/><circle cx="9.5" cy="19" r="1.2"/><circle cx="17.5" cy="19" r="1.2"/><path d="M14.5 6v5m-2.5-2.5h5"/></svg><span class="detail-action-copy"><span class="detail-action-label">Add to Cart</span></span></button>' +
            (shopWhatsApp ? '<button type="button" class="detail-action-whatsapp" data-detail-whatsapp="' + product.id + '"><svg class="detail-action-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 11.5a8.2 8.2 0 0 1-12.1 7.2L4 20l1.2-4A8.2 8.2 0 1 1 20.2 11.5Z"/><path d="M9 8.7c.2-.4.4-.5.7-.5h.5c.2 0 .3.1.4.3l.8 1.7c.1.2.1.4 0 .5l-.6.7c-.1.2-.2.3 0 .5.5.9 1.2 1.5 2.1 1.9.2.1.3.1.5-.1l.7-.8c.1-.2.3-.2.5-.1l1.7.8c.2.1.3.2.3.4 0 .3-.2 1-.6 1.3-.4.4-1 .6-1.6.5-1-.1-2.3-.7-3.5-1.8-1.3-1.2-2.1-2.7-2.2-3.6-.1-.7.1-1.3.5-1.7Z"/></svg><span class="detail-action-copy"><span class="detail-action-label">WhatsApp</span><small>Quick message</small></span></button>' : '') +
            (shopPhone ? '<button type="button" class="detail-action-call" data-detail-call><svg class="detail-action-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19a19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.7a2 2 0 0 1-.6 1.8L7.7 9.5a16 16 0 0 0 6.8 6.8l1.3-1.3a2 2 0 0 1 1.8-.6l2.7.5a2 2 0 0 1 1.7 2Z"/></svg><span class="detail-action-copy"><span class="detail-action-label">Call Now</span></span></button>' : '') +
          '</div>' +
          '<p class="product-detail-small-note">অর্ডার নাও চাপলে আপনার কার্ট ও ডেলিভারি তথ্যসহ অর্ডার ফর্ম খুলবে।</p>' +
        '</div>' +
      '</section>' +
      '<section class="product-description-section">' +
        '<div class="detail-section-heading"><span>PRODUCT INFORMATION</span><h2>পণ্যের বিবরণ</h2></div>' +
        '<p>' + escapeHTML(descriptionFor(product)) + '</p>' +
        '<div class="product-information-grid">' +
          '<div><span>ক্যাটাগরি</span><strong>' + escapeHTML(category ? category.bangla : 'পণ্য') + '</strong></div>' +
          '<div><span>পরিমাণ</span><strong>' + escapeHTML(product.unit) + '</strong></div>' +
          '<div><span>তালিকাভুক্ত মূল্য</span><strong>' + money(product.price) + '</strong></div>' +
          '<div><span>সংগ্রহ পদ্ধতি</span><strong>অর্ডার অনুযায়ী</strong></div>' +
        '</div>' +
        '<p class="detail-price-note">দাম ও প্যাক সাইজ নমুনা ক্যাটালগ অনুযায়ী দেখানো হয়েছে। চূড়ান্ত মূল্য ও প্রাপ্যতা অর্ডার নিশ্চিত করার আগে যাচাই করা হবে।</p>' +
      '</section>' +
      '<section class="recommended-section">' +
        '<div class="detail-section-heading"><span>YOU MAY ALSO LIKE</span><h2>সাজেস্টেড প্রোডাক্ট</h2></div>' +
        '<div class="recommended-grid">' + related.map(recommendationCard).join('') + '</div>' +
      '</section>' +
      (isProductPage ? '' : '<footer class="product-detail-footer"><span>EcoGrocer BD</span><span>Fresh · Daily · Local</span></footer>');
    if (!detailContent) return;
    detailContent.innerHTML = markup;
    activeProductId = product.id;
  }

  function openProductDetail(id) {
    var product = findProduct(id);
    if (!product) return;
    lastFocusedElement = document.activeElement;
    closeImageLightbox();
    renderProduct(product);
    detailScrim.hidden = false;
    updateBodyLock();
    detailScrim.querySelector('.product-detail-modal').scrollTop = 0;
    document.getElementById('product-detail-close').focus();
  }

  function closeProductDetail() {
    detailScrim.hidden = true;
    activeProductId = '';
    updateBodyLock();
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  }

  function openImageLightbox(product) {
    if (!lightbox || !product || !imageFor(product)) {
      showToast('এই পণ্যের ছবি পাওয়া যাচ্ছে না');
      return;
    }
    document.getElementById('product-lightbox-image').src = imageFor(product);
    document.getElementById('product-lightbox-image').alt = product.name;
    document.getElementById('product-lightbox-caption').textContent = product.name + ' · ' + product.unit;
    lightbox.hidden = false;
    updateBodyLock();
  }

  function closeImageLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.getElementById('product-lightbox-image').src = '';
    updateBodyLock();
  }

  function updateDetailCartState(id) {
    if (activeProductId !== id) return;
    var state = document.getElementById('detail-cart-state');
    if (state) state.textContent = 'আপনার কার্টে এই পণ্যটি ' + Number(cart[id] || 0) + ' টি আছে';
  }

  function updateRecommendationCartControl(id) {
    var product = findProduct(id);
    var control = detailContent && detailContent.querySelector('[data-recommend-control="' + id + '"]');
    if (!product || !control) return;
    control.innerHTML = recommendationCartControl(product);
  }

  function openProductWhatsApp(id) {
    var product = findProduct(id);
    if (!product) return;
    if (!shopWhatsApp) {
      showToast('WhatsApp নম্বর এখনো ওয়েবসাইটে যুক্ত করা হয়নি');
      return;
    }
    var message = 'EcoGrocer BD-তে ' + product.name + ' (' + product.unit + ') — ' + money(product.price) + ' সম্পর্কে জানতে চাই।';
    window.open('https://wa.me/' + shopWhatsApp + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
  }

  function callShop() {
    if (!shopPhone) {
      showToast('যোগাযোগের ফোন নম্বর এখনো ওয়েবসাইটে যুক্ত করা হয়নি');
      return;
    }
    window.location.href = 'tel:+' + shopPhone;
  }

  function renderStandaloneProductPage() {
    if (!detailContent) return;
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug') || '';
    var requestedId = params.get('product') || '';
    var product = PRODUCTS.find(function (item) {
      return (requestedId && item.id === requestedId) ||
        (slug && productSlug(item) === slug);
    });

    if (!product) {
      document.title = 'পণ্য পাওয়া যায়নি | EcoGrocer BD';
      detailContent.innerHTML = '<section class="product-page-not-found"><span>🧺</span><h1>পণ্যটি পাওয়া যায়নি</h1><p>পণ্যটি সরানো হয়েছে অথবা ঠিকানা পরিবর্তিত হয়েছে।</p><a class="button button-primary" href="index.html#products">সব পণ্য দেখুন</a></section>';
      return;
    }

    renderProduct(product);
    document.title = product.name + ' | EcoGrocer BD';
    var descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.setAttribute('content', product.name + ' — ' + product.unit + ', ' + money(product.price) + '. EcoGrocer BD থেকে অর্ডার করুন।');
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.href;
  }

  if (isProductPage) {
    renderStandaloneProductPage();
    document.addEventListener('ecogrocer:catalogue-updated', renderStandaloneProductPage);
  }

  document.addEventListener('click', function (event) {
    var imageTrigger = event.target.closest('[data-product-image-open]');
    if (imageTrigger) {
      event.preventDefault();
      openImageLightbox(findProduct(imageTrigger.dataset.productImageOpen));
      return;
    }

    var recommendAdd = event.target.closest('[data-recommend-add]');
    if (recommendAdd) {
      var recommendId = recommendAdd.dataset.recommendAdd;
      changeCart(recommendId, 1);
      updateDetailCartState(recommendId);
      updateRecommendationCartControl(recommendId);
      return;
    }

    var recommendAction = event.target.closest('[data-recommend-action]');
    if (recommendAction) {
      var recommendId = recommendAction.dataset.recommendId;
      var quantityDelta = recommendAction.dataset.recommendAction === 'decrease' ? -1 : 1;
      changeCart(recommendId, quantityDelta);
      updateDetailCartState(recommendId);
      updateRecommendationCartControl(recommendId);
      return;
    }

    var detailAdd = event.target.closest('[data-detail-add]');
    if (detailAdd) {
      var addId = detailAdd.dataset.detailAdd;
      changeCart(addId, 1);
      updateDetailCartState(addId);
      detailAdd.innerHTML = '<span>✓</span> Added to Cart';
      return;
    }

    var detailOrder = event.target.closest('[data-detail-order]');
    if (detailOrder) {
      var orderId = detailOrder.dataset.detailOrder;
      // Persist the selected product before navigation so checkout always has an item to render.
      if (!PRODUCTS.some(function (product) { return product.id === orderId; })) {
        showToast('এই পণ্যটি পাওয়া যায়নি। আবার পণ্য নির্বাচন করুন।');
        return;
      }
      if (!cart[orderId]) changeCart(orderId, 1);
      // Keep the product ID in the URL as a fallback if browser storage is unavailable.
      window.location.assign('checkout.html?product=' + encodeURIComponent(orderId));
      return;
    }

    var whatsapp = event.target.closest('[data-detail-whatsapp]');
    if (whatsapp) {
      openProductWhatsApp(whatsapp.dataset.detailWhatsapp);
      return;
    }

    if (event.target.closest('[data-detail-call]')) {
      callShop();
      return;
    }

    var imageZoom = event.target.closest('[data-detail-image]');
    if (imageZoom) {
      openImageLightbox(findProduct(imageZoom.dataset.detailImage));
      return;
    }

    if (event.target.closest('[data-detail-close]')) {
      closeProductDetail();
      return;
    }

    var productCard = event.target.closest('[data-product-detail]');
    if (productCard && !event.target.closest('button, a, input, select, textarea, [data-cart-action]')) {
      var cardProduct = findProduct(productCard.dataset.productDetail);
      if (cardProduct) window.location.href = productPageUrl(cardProduct);
    }
  });

  document.addEventListener('keydown', function (event) {
    var productName = event.target.closest && event.target.closest('[data-product-open]');
    if (productName && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openProductDetail(productName.dataset.productOpen);
    }
    if (event.key === 'Escape') {
      if (lightbox && !lightbox.hidden) closeImageLightbox();
      else if (detailScrim && !detailScrim.hidden) closeProductDetail();
    }
  });

  var detailClose = document.getElementById('product-detail-close');
  if (detailClose) detailClose.addEventListener('click', closeProductDetail);
  if (detailScrim) detailScrim.addEventListener('click', function (event) {
    if (event.target === detailScrim) closeProductDetail();
  });
  var lightboxClose = document.getElementById('product-lightbox-close');
  if (lightboxClose) lightboxClose.addEventListener('click', closeImageLightbox);
  if (lightbox) lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) closeImageLightbox();
  });

  window.openEcoProductDetail = openProductDetail;
})();
