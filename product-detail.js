'use strict';

(function () {
  const config = window.ECOGROCER_CONFIG || {};
  const shopWhatsApp = String(config.whatsappNumber || window.ECOGROCER_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const shopPhone = String(config.phoneNumber || window.ECOGROCER_PHONE_NUMBER || '').replace(/\D/g, '');
  const detailScrim = document.getElementById('product-detail-scrim');
  const detailContent = document.getElementById('product-detail-content');
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
    var locked = !detailScrim.hidden || !lightbox.hidden ||
      !document.getElementById('checkout-scrim').hidden ||
      document.getElementById('cart-drawer').classList.contains('open') ||
      document.getElementById('site-drawer').classList.contains('open');
    document.body.classList.toggle('no-scroll', locked);
  }

  function recommendationCard(product) {
    return '<article class="recommended-product">' +
      '<button type="button" class="recommended-product-open" data-recommend-open="' + product.id + '" aria-label="' + escapeHTML(product.name) + ' বিস্তারিত দেখুন">' +
        '<span class="recommended-product-image"><img src="' + imageFor(product) + '" alt="" loading="lazy" onerror="this.hidden=true"></span>' +
        '<span class="recommended-product-copy"><strong>' + escapeHTML(product.name) + '</strong><small>' + escapeHTML(product.unit) + '</small><b>' + money(product.price) + '</b></span>' +
      '</button>' +
      '<button type="button" class="recommended-add" data-recommend-add="' + product.id + '" aria-label="' + escapeHTML(product.name) + ' কার্টে যোগ করুন">+ Add</button>' +
    '</article>';
  }

  function renderProduct(product) {
    var category = CATEGORIES.find(function (item) { return item.id === product.category; });
    var qty = Number(cart[product.id] || 0);
    var related = PRODUCTS.filter(function (item) {
      return item.category === product.category && item.id !== product.id;
    }).slice(0, 4);
    var markup =
      '<div class="product-detail-breadcrumb">' +
        '<button type="button" data-detail-close>হোম</button><span>›</span><span>' + escapeHTML(category ? category.title : 'Products') + '</span><span>›</span><strong>' + escapeHTML(product.name) + '</strong>' +
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
          '<p class="product-detail-availability"><span class="availability-dot"></span> অর্ডার অনুযায়ী সংগ্রহ ও প্রাপ্যতা নিশ্চিত করা হবে</p>' +
          '<div class="product-detail-cart-state" id="detail-cart-state">' + (qty > 0 ? 'আপনার কার্টে এই পণ্যটি ' + qty + ' টি আছে' : 'এই পণ্যটি এখনো কার্টে যোগ করা হয়নি') + '</div>' +
          '<div class="product-detail-actions">' +
            '<button type="button" class="detail-action-order" data-detail-order="' + product.id + '">অর্ডার নাও <span>→</span></button>' +
            '<button type="button" class="detail-action-cart" data-detail-add="' + product.id + '"><span>＋</span> Add to Cart</button>' +
            '<button type="button" class="detail-action-whatsapp" data-detail-whatsapp="' + product.id + '"><span>◉</span> WhatsApp</button>' +
            '<button type="button" class="detail-action-call" data-detail-call><span>☎</span> কল করুন</button>' +
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
      '<footer class="product-detail-footer"><span>EcoGrocer BD</span><span>Fresh · Daily · Local</span></footer>';
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
    if (!product || !imageFor(product)) {
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
    lightbox.hidden = true;
    document.getElementById('product-lightbox-image').src = '';
    updateBodyLock();
  }

  function updateDetailCartState(id) {
    if (activeProductId !== id) return;
    var state = document.getElementById('detail-cart-state');
    if (state) state.textContent = 'আপনার কার্টে এই পণ্যটি ' + Number(cart[id] || 0) + ' টি আছে';
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
      recommendAdd.textContent = '✓ Added';
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
      // Navigate to a dedicated checkout page; the product ID is added to the existing cart on load.
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

    var recommendOpen = event.target.closest('[data-recommend-open]');
    if (recommendOpen) {
      openProductDetail(recommendOpen.dataset.recommendOpen);
      return;
    }

    if (event.target.closest('[data-detail-close]')) {
      closeProductDetail();
      return;
    }

    var productCard = event.target.closest('[data-product-detail]');
    if (productCard && !event.target.closest('button, a, input, select, textarea, [data-cart-action]')) {
      openProductDetail(productCard.dataset.productDetail);
    }
  });

  document.addEventListener('keydown', function (event) {
    var productName = event.target.closest && event.target.closest('[data-product-open]');
    if (productName && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openProductDetail(productName.dataset.productOpen);
    }
    if (event.key === 'Escape') {
      if (!lightbox.hidden) closeImageLightbox();
      else if (!detailScrim.hidden) closeProductDetail();
    }
  });

  document.getElementById('product-detail-close').addEventListener('click', closeProductDetail);
  detailScrim.addEventListener('click', function (event) {
    if (event.target === detailScrim) closeProductDetail();
  });
  document.getElementById('product-lightbox-close').addEventListener('click', closeImageLightbox);
  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) closeImageLightbox();
  });

  window.openEcoProductDetail = openProductDetail;
})();
