'use strict';

// Public Supabase connection settings. The secret/service-role key is never sent to the browser.
window.ECOGROCER_CONFIG = window.ECOGROCER_CONFIG || {};
window.ECOGROCER_CONFIG.supabaseUrl = 'https://ucwaoytakqldicdtoran.supabase.co';
window.ECOGROCER_CONFIG.supabasePublishableKey = 'sb_publishable_wpp9kVHNg5pZeGRY0Eoxaw_iyyQez9Q';
window.ECOGROCER_CONFIG.orderApiUrl = window.ECOGROCER_CONFIG.supabaseUrl + '/functions/v1/place-order';
window.ECOGROCER_CONFIG.whatsappNumber = window.ECOGROCER_CONFIG.whatsappNumber || '';
window.ECOGROCER_CONFIG.phoneNumber = window.ECOGROCER_CONFIG.phoneNumber || '';
