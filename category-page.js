'use strict';

(() => {
  const categories = {
    grocery: { title: 'Grocery', bangla: 'মুদি পণ্য' },
    vegetables: { title: 'Vegetables', bangla: 'শাক-সবজি' },
    meat: { title: 'Meat', bangla: 'মাংস' },
    fish: { title: 'Fish', bangla: 'মাছ' }
  };

  const categoryId = new URLSearchParams(window.location.search).get('category') || '';
  const category = categories[categoryId];

  if (!category) {
    window.location.replace('index.html#categories');
    return;
  }

  document.body.dataset.categoryPage = categoryId;
  document.title = category.title + ' | EcoGrocer BD — প্রতিদিনের বাজার';

  const activeSection = document.querySelector('[data-section-category="' + categoryId + '"]');
  if (!activeSection) {
    window.location.replace('index.html#categories');
    return;
  }

  document.querySelectorAll('[data-section-category]').forEach(section => {
    const isActive = section === activeSection;
    section.classList.toggle('category-page-active', isActive);
    section.hidden = !isActive;
  });

  const description = document.getElementById('category-page-description');
  if (description) {
    description.textContent = category.bangla + ' বিভাগের সব পণ্য এক জায়গায় দেখুন। পছন্দের পণ্য কার্টে যোগ করতে পারেন এবং বিস্তারিত জানতে পণ্যের কার্ডে ক্লিক করুন।';
  }

  document.querySelectorAll('[data-category-tab]').forEach(tab => {
    const isActive = tab.dataset.categoryTab === categoryId;
    tab.classList.toggle('is-current', isActive);
    if (isActive) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    const hash = link.getAttribute('href');
    if (hash && hash !== '#main-content') link.setAttribute('href', 'index.html' + hash);
  });

  const grid = activeSection.querySelector('[data-product-grid="' + categoryId + '"]');
  const countLabel = activeSection.querySelector('.product-count');
  const updateCount = () => {
    if (!grid || !countLabel) return;
    const count = grid.querySelectorAll('.product-card').length;
    countLabel.textContent = new Intl.NumberFormat('bn-BD').format(count) + 'টি পণ্য';
  };
  updateCount();
  if (grid && 'MutationObserver' in window) {
    new MutationObserver(updateCount).observe(grid, { childList: true });
  }

  const searchInput = document.getElementById('product-search');
  if (searchInput) searchInput.dispatchEvent(new Event('input', { bubbles: true }));
})();
