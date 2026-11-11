'use strict';

// Netlify Forms stores checkout submissions in the site's authenticated Forms dashboard.
window.ECOGROCER_CONFIG = window.ECOGROCER_CONFIG || {};
window.ECOGROCER_CONFIG.orderApiUrl = window.ECOGROCER_CONFIG.orderApiUrl || '/'; // legacy PHP API is optional
window.ECOGROCER_CONFIG.whatsappNumber = window.ECOGROCER_CONFIG.whatsappNumber || '';

// Add the public shop contact numbers after EcoGrocer confirms them.
window.ECOGROCER_CONFIG.phoneNumber = window.ECOGROCER_CONFIG.phoneNumber || '';
