'use strict';

(function () {
  const CONFIG = window.ECOGROCER_CONFIG || {};
  const WHATSAPP_NUMBER = String(CONFIG.whatsappNumber || window.ECOGROCER_WHATSAPP_NUMBER || '').replace(/\D/g, '');

  // Area delivery fees are provisional display values until EcoGrocer confirms its final tariff.
  const DELIVERY_AREAS = {
    'gulshan-1': { name: 'গুলশান ১', fee: 60 },
    'gulshan-2': { name: 'গুলশান ২', fee: 60 },
    'niketon': { name: 'নিকেতন', fee: 60 },
    'baridhara': { name: 'বারিধারা ডিপ্লোম্যাটিক জোন', fee: 70 },
    'banani': { name: 'বনানী', fee: 70 },
    'mohakhali': { name: 'মহাখালী', fee: 80 },
    'baridhara-dohs': { name: 'বারিধারা DOHS', fee: 90 },
    'banani-dohs': { name: 'বনানী DOHS', fee: 90 },
    'mohakhali-dohs': { name: 'মহাখালী DOHS', fee: 90 },
    'badda': { name: 'বাড্ডা', fee: 100 },
    'shahjadpur': { name: 'শাহজাদপুর', fee: 100 },
    'notun-bazar': { name: 'নতুন বাজার', fee: 100 }
  };

  // Sample coupons for the first checkout preview. Confirm campaign rules before launch.
  const COUPONS = {
    'ECO10': { type: 'percent', value: 10, cap: 100, minimum: 200, label: '১০% ছাড় (সর্বোচ্চ ৳১০০)' },
    'FRESH50': { type: 'fixed', value: 50, minimum: 500, label: '৳৫০ ছাড়' }
  };

  let appliedCoupon = '';
  let requestInProgress = false;

  const byId = id => document.getElementById(id);
  const formatMoney = value => '৳' + Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-US');
  const getLines = () => PRODUCTS.filter(product => Number(cart[product.id]) > 0);
  const getSubtotal = () => getLines().reduce((sum, product) => sum + product.price * Number(cart[product.id]), 0);
  const getArea = () => DELIVERY_AREAS[byId('checkout-area').value] || null;
  const getDeliveryFee = () => { const area = getArea(); return area ? area.fee : 0; };

  function getDiscount() {
    const rule = COUPONS[appliedCoupon];
    const subtotal = getSubtotal();
    if (!rule || subtotal < rule.minimum) return 0;
    if (rule.type === 'fixed') return Math.min(subtotal, rule.value);
    return Math.min(Math.round(subtotal * rule.value / 100), rule.cap || subtotal);
  }

  function updateTotals() {
    const subtotal = getSubtotal();
    const delivery = getDeliveryFee();
    const discount = getDiscount();
    byId('checkout-subtotal').textContent = formatMoney(subtotal);
    byId('checkout-delivery').textContent = getArea() ? formatMoney(delivery) : 'এলাকা বাছুন';
    byId('checkout-discount').textContent = '−' + formatMoney(discount);
    byId('checkout-grand-total').textContent = formatMoney(subtotal + delivery - discount);
    byId('checkout-submit').disabled = subtotal <= 0 || requestInProgress;
  }

  function renderCheckoutItems() {
    const lines = getLines();
    const preview = byId('checkout-items-preview');
    const summary = byId('checkout-summary-items');
    if (!lines.length) {
      preview.innerHTML = '<p class="checkout-empty">কার্টে কোনো পণ্য নেই। আগে পণ্য যোগ করুন।</p>';
      summary.innerHTML = '<p class="checkout-empty">কার্ট খালি</p>';
    } else {
      preview.innerHTML = lines.map(product =>
        '<div class="checkout-product-line"><img src="' + escapeHTML(PRODUCT_IMAGES[product.id]) + '" alt="" loading="lazy"><div><strong>' + escapeHTML(product.name) + '</strong><small>' + escapeHTML(product.unit) + ' × ' + Number(cart[product.id]) + '</small></div><b>' + formatMoney(product.price * Number(cart[product.id])) + '</b></div>'
      ).join('');
      summary.innerHTML = lines.map(product =>
        '<div class="summary-item"><span>' + escapeHTML(product.name) + ' × ' + Number(cart[product.id]) + '</span><strong>' + formatMoney(product.price * Number(cart[product.id])) + '</strong></div>'
      ).join('');
    }
    updateTotals();
  }

  function filterAreas() {
    const query = normalizeSearch(byId('checkout-area-search').value);
    const select = byId('checkout-area');
    Array.from(select.options).forEach(option => {
      if (!option.value) return;
      option.hidden = Boolean(query) && !normalizeSearch(option.textContent).includes(query);
    });
    Array.from(select.querySelectorAll('optgroup')).forEach(group => {
      group.hidden = Array.from(group.options).every(option => option.hidden);
    });
  }

  function setStatus(message, type) {
    const status = byId('checkout-status');
    status.hidden = false;
    status.className = 'checkout-status ' + (type || 'info');
    status.textContent = message;
  }

  function clearStatus() {
    const status = byId('checkout-status');
    status.hidden = true;
    status.textContent = '';
  }

  function openCheckout(productId) {
    const loadingFallback = byId('checkout-load-fallback');
    if (productId && !cart[productId]) changeCart(productId, 1);
    if (!getLines().length) {
      if (document.body.classList.contains('checkout-page-mode')) {
        byId('checkout-scrim').hidden = true;
        if (loadingFallback) loadingFallback.hidden = true;
        byId('checkout-empty-page').hidden = false;
        document.body.classList.remove('no-scroll');
      } else {
        showToast('অর্ডার করতে আগে পণ্য কার্টে যোগ করুন');
      }
      return;
    }
    if (document.body.classList.contains('checkout-page-mode') && byId('checkout-empty-page')) {
      byId('checkout-empty-page').hidden = true;
    }
    if (!document.body.classList.contains('checkout-page-mode')) {
      closeDrawer();
      closeCart();
    }
    appliedCoupon = '';
    byId('checkout-coupon').value = '';
    byId('checkout-coupon-feedback').textContent = 'ডেমো কুপন: ECO10 অথবা FRESH50';
    byId('checkout-coupon-feedback').className = 'coupon-feedback';
    byId('checkout-area-search').value = '';
    byId('checkout-area').value = '';
    filterAreas();
    clearStatus();
    renderCheckoutItems();
    byId('checkout-scrim').hidden = false;
    if (loadingFallback) loadingFallback.hidden = true;
    document.body.classList.add('no-scroll');
    byId('checkout-close').focus();
  }

  function closeCheckout() {
    byId('checkout-scrim').hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function applyCoupon() {
    const code = byId('checkout-coupon').value.trim().toUpperCase();
    const rule = COUPONS[code];
    const feedback = byId('checkout-coupon-feedback');
    if (!code) {
      appliedCoupon = '';
      feedback.textContent = 'কুপন কোড লিখুন।';
      feedback.className = 'coupon-feedback error';
    } else if (!rule) {
      appliedCoupon = '';
      feedback.textContent = 'এই কুপন কোডটি সঠিক নয়।';
      feedback.className = 'coupon-feedback error';
    } else if (getSubtotal() < rule.minimum) {
      appliedCoupon = '';
      feedback.textContent = 'এই কুপন ব্যবহারে ন্যূনতম ' + formatMoney(rule.minimum) + ' কেনাকাটা করতে হবে।';
      feedback.className = 'coupon-feedback error';
    } else {
      appliedCoupon = code;
      feedback.textContent = '✓ ' + code + ' প্রয়োগ হয়েছে — ' + rule.label;
      feedback.className = 'coupon-feedback success';
    }
    updateTotals();
  }

  function selectedPayment() {
    const chosen = document.querySelector('input[name="paymentMethod"]:checked');
    return chosen ? chosen.value : 'cod';
  }

  function buildOrderPayload(form) {
    const values = new FormData(form);
    const areaId = values.get('deliveryArea');
    const area = DELIVERY_AREAS[areaId];
    return {
      customer: {
        name: String(values.get('customerName') || '').trim(),
        phone: String(values.get('phone') || '').trim()
      },
      delivery: {
        areaId: areaId,
        areaName: area ? area.name : '',
        block: String(values.get('block') || '').trim(),
        road: String(values.get('road') || '').trim(),
        house: String(values.get('house') || '').trim(),
        fullAddress: String(values.get('fullAddress') || '').trim(),
        slot: String(values.get('deliverySlot') || ''),
        notes: String(values.get('notes') || '').trim()
      },
      payment: {
        method: selectedPayment(),
        payerPhone: String(values.get('payerPhone') || '').trim(),
        transactionId: String(values.get('transactionId') || '').trim()
      },
      couponCode: appliedCoupon,
      items: getLines().map(product => ({ id: product.id, quantity: Number(cart[product.id]) }))
    };
  }

  function whatsappOrderLink(orderId, payload, total) {
    if (!WHATSAPP_NUMBER) return '';
    const lines = getLines().map(product => product.name + ' × ' + cart[product.id] + ' = ' + formatMoney(product.price * cart[product.id]));
    const text = [
      'EcoGrocer BD — নতুন অর্ডার',
      'Order ID: ' + orderId,
      'নাম: ' + payload.customer.name,
      'মোবাইল: ' + payload.customer.phone,
      'এলাকা: ' + payload.delivery.areaName,
      'ঠিকানা: ' + payload.delivery.block + ', ' + payload.delivery.road + ', ' + payload.delivery.house + ', ' + payload.delivery.fullAddress,
      'ডেলিভারি সময়: ' + payload.delivery.slot,
      'পেমেন্ট: ' + payload.payment.method,
      'পণ্য:',
      lines.join('\n'),
      'মোট: ' + formatMoney(total)
    ].join('\n');
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
  }

  function createOrderId() {
    const timePart = new Date().toISOString().replace(/\\D/g, '').slice(0, 12);
    const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
    return 'EG' + timePart + randomPart;
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (requestInProgress) return;
    const form = byId('eco-checkout-form');
    if (!getLines().length) {
      setStatus('কার্টে কোনো পণ্য নেই। পণ্য যোগ করে আবার চেষ্টা করুন।', 'error');
      return;
    }
    if (!form.reportValidity()) return;

    const payload = buildOrderPayload(form);
    const orderId = createOrderId();
    const subtotal = getSubtotal();
    const deliveryFee = getDeliveryFee();
    const discount = getDiscount();
    const grandTotal = Math.max(0, subtotal + deliveryFee - discount);
    const orderLines = getLines().map(product => ({
      id: product.id,
      name: product.name,
      unit: product.unit,
      quantity: Number(cart[product.id]),
      unitPrice: product.price,
      lineTotal: product.price * Number(cart[product.id])
    }));

    byId('checkout-order-id').value = orderId;
    byId('checkout-order-items').value = JSON.stringify(orderLines);
    byId('checkout-order-subtotal').value = String(subtotal);
    byId('checkout-order-delivery').value = String(deliveryFee);
    byId('checkout-order-discount').value = String(discount);
    byId('checkout-order-grand-total').value = String(grandTotal);
    byId('checkout-order-area-name').value = payload.delivery.areaName;
    byId('checkout-order-coupon').value = appliedCoupon;
    byId('checkout-order-status').value = 'pending';
    byId('checkout-order-date').value = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', hour12: false });
    form.querySelector('input[name="subject"]').value = 'New EcoGrocer order — ' + orderId;

    requestInProgress = true;
    byId('checkout-submit').disabled = true;
    byId('checkout-submit').textContent = 'অর্ডার সার্ভারে জমা হচ্ছে…';
    clearStatus();

    try {
      const formData = new FormData(form);
      formData.set('form-name', 'ecogrocer-orders');
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });
      if (!response.ok) {
        throw new Error('সার্ভার অর্ডারটি গ্রহণ করেনি। অনুগ্রহ করে আবার চেষ্টা করুন। (HTTP ' + response.status + ')');
      }

      const whatsappUrl = whatsappOrderLink(orderId, payload, grandTotal);
      cart = {};
      saveCart();
      renderProducts();
      renderCart();
      form.reset();
      appliedCoupon = '';
      renderCheckoutItems();
      setStatus('অর্ডার সফলভাবে সার্ভারে জমা হয়েছে। আপনার অর্ডার নম্বর: ' + orderId + '। EcoGrocer BD টিম অর্ডারটি যাচাই করে যোগাযোগ করবে।', 'success');
      if (whatsappUrl) {
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'checkout-whatsapp-link';
        link.textContent = 'WhatsApp-এ অর্ডার সামারি খুলুন';
        byId('checkout-status').appendChild(document.createTextNode(' '));
        byId('checkout-status').appendChild(link);
      }
    } catch (error) {
      setStatus(error && error.message ? error.message : 'অর্ডার জমা দেওয়া যায়নি। আবার চেষ্টা করুন।', 'error');
    } finally {
      requestInProgress = false;
      byId('checkout-submit').disabled = getLines().length === 0;
      byId('checkout-submit').textContent = '✅ Order Confirm করুন';
    }
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !byId('checkout-scrim').hidden) closeCheckout();
  });

  byId('checkout-close').addEventListener('click', function () {
    if (document.body.classList.contains('checkout-page-mode')) {
      window.location.href = './';
      return;
    }
    closeCheckout();
  });
  byId('checkout-scrim').addEventListener('click', event => {
    if (event.target.id === 'checkout-scrim') closeCheckout();
  });
  byId('checkout-area-search').addEventListener('input', filterAreas);
  byId('checkout-area').addEventListener('change', updateTotals);
  byId('checkout-coupon-apply').addEventListener('click', applyCoupon);
  byId('checkout-coupon').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); applyCoupon(); }
  });
  document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
    input.addEventListener('change', () => {
      byId('payment-reference-fields').hidden = selectedPayment() === 'cod';
    });
  });
  byId('eco-checkout-form').addEventListener('submit', submitOrder);

  // A dedicated checkout page is used for Order Now so customers get a full page rather than a small overlay.
  // Standalone checkout is visible from the initial HTML; JS only enriches it.
  window.openEcoCheckout = openCheckout;
  if (document.body.classList.contains('checkout-page-mode')) {
    byId('checkout-scrim').hidden = false;
    document.body.classList.remove('no-scroll');
    const params = new URLSearchParams(window.location.search);
    const selectedProduct = params.get('product') || '';
    try {
      openCheckout(selectedProduct);
    } catch (error) {
      // Never leave customers on a blank/loading screen if enhancement code encounters an error.
      byId('checkout-scrim').hidden = false;
      document.body.classList.remove('no-scroll');
      console.error('EcoGrocer checkout enhancement failed:', error);
    }
  }
})();
