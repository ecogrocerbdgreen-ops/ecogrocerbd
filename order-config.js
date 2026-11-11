'use strict';

(function () {
  const config = window.ECOGROCER_CONFIG = window.ECOGROCER_CONFIG || {};

  // Public storefront credentials only. Never place a Supabase secret/service-role key here.
  config.supabaseUrl = 'https://ucwaoytakqldicdtoran.supabase.co';
  config.supabasePublishableKey = 'sb_publishable_wpp9kVHNg5pZeGRY0Eoxaw_iyyQez9Q';

  const baseUrl = config.supabaseUrl.replace(/\/+$/, '');
  config.supabaseRestUrl = baseUrl + '/rest/v1';
  config.productsUrl = config.supabaseRestUrl +
    '/products?select=id,category_id,name,english_name,description,aliases,price,compare_at_price,unit,image_url,featured,track_inventory,stock_quantity&is_active=eq.true&order=sort_order.asc';
  config.categoriesUrl = config.supabaseRestUrl +
    '/categories?select=id,name,name_bn,sort_order&is_active=eq.true&order=sort_order.asc';
  config.deliveryAreasUrl = config.supabaseRestUrl +
    '/delivery_areas?select=id,name,fee,sort_order&is_active=eq.true&order=sort_order.asc';
  config.deliverySlotsUrl = config.supabaseRestUrl +
    '/delivery_slots?select=id,label,sort_order&is_active=eq.true&order=sort_order.asc';

  config.orderApiUrl = baseUrl + '/functions/v1/place-order';
  config.whatsappNumber = config.whatsappNumber || '';
  config.phoneNumber = config.phoneNumber || '';
})();
