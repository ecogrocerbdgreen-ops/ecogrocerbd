'use strict';

// Same-origin Netlify Function. Public catalogue/orders use the public API;
// privileged admin operations require a short-lived signed admin session.
window.ECOGROCER_CONFIG = window.ECOGROCER_CONFIG || {};
window.ECOGROCER_CONFIG.apiUrl = '/.netlify/functions/api';
window.ECOGROCER_CONFIG.orderApiUrl = '/.netlify/functions/api?action=orders';
window.ECOGROCER_CONFIG.whatsappNumber = window.ECOGROCER_CONFIG.whatsappNumber || '';
window.ECOGROCER_CONFIG.phoneNumber = window.ECOGROCER_CONFIG.phoneNumber || '';
