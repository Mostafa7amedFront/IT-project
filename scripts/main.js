document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEYS = {
    cart: 'amazecart-cart',
    wishlist: 'amazecart-wishlist',
  };

  function readStorage(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      return [];
    }
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item';
  }

  function parsePrice(value) {
    const numericValue = parseFloat(String(value || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  function formatPrice(value) {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function normalizeProduct(product) {
    const title = product.title || 'Untitled Product';
    const priceValue = parsePrice(product.priceValue ?? product.priceLabel ?? product.price);

    return {
      id: product.id || slugify(title),
      title,
      category: product.category || 'General',
      image: product.image || '',
      url: product.url || 'product-details.html',
      priceValue,
      priceLabel: formatPrice(priceValue),
    };
  }

  function getCart() {
    return readStorage(STORAGE_KEYS.cart);
  }

  function saveCart(cart) {
    writeStorage(STORAGE_KEYS.cart, cart);
    updateBadgeCounts();
  }

  function getWishlist() {
    return readStorage(STORAGE_KEYS.wishlist);
  }

  function saveWishlist(wishlist) {
    writeStorage(STORAGE_KEYS.wishlist, wishlist);
    updateBadgeCounts();
    syncWishlistButtons();
  }

  function getCartItemsCount() {
    return getCart().reduce((total, item) => total + (item.quantity || 0), 0);
  }

  function updateBadgeCounts() {
    const cartCount = getCartItemsCount();
    const wishlistCount = getWishlist().length;

    document.querySelectorAll('.cart-count').forEach(counter => {
      counter.textContent = cartCount;
    });

    document.querySelectorAll('.wishlist-count').forEach(counter => {
      counter.textContent = wishlistCount;
    });
  }

  function animateBadge(selector) {
    document.querySelectorAll(selector).forEach(counter => {
      counter.style.transform = 'scale(1.2)';
      setTimeout(() => {
        counter.style.transform = 'scale(1)';
      }, 200);
    });
  }

  function showButtonConfirmation(button, activeHtml) {
    const originalHtml = button.innerHTML;
    const originalColor = button.style.color;

    button.innerHTML = activeHtml;
    button.style.color = 'var(--success-color)';

    setTimeout(() => {
      button.innerHTML = originalHtml;
      button.style.color = originalColor;
    }, 900);
  }

  function addToCart(product, quantity = 1) {
    const normalizedProduct = normalizeProduct(product);
    const cart = getCart();
    const existingItem = cart.find(item => item.id === normalizedProduct.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...normalizedProduct, quantity });
    }

    saveCart(cart);
    animateBadge('.cart-count');
  }

  function updateCartQuantity(productId, delta) {
    const cart = getCart()
      .map(item => item.id === productId ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0);

    saveCart(cart);
  }

  function removeFromCart(productId) {
    saveCart(getCart().filter(item => item.id !== productId));
  }

  function addToWishlist(product) {
    const normalizedProduct = normalizeProduct(product);
    const wishlist = getWishlist();

    if (!wishlist.some(item => item.id === normalizedProduct.id)) {
      wishlist.push(normalizedProduct);
      saveWishlist(wishlist);
      animateBadge('.wishlist-count');
    }
  }

  function removeFromWishlist(productId) {
    saveWishlist(getWishlist().filter(item => item.id !== productId));
  }

  function isInWishlist(productId) {
    return getWishlist().some(item => item.id === productId);
  }

  function toggleWishlist(product) {
    const normalizedProduct = normalizeProduct(product);

    if (isInWishlist(normalizedProduct.id)) {
      removeFromWishlist(normalizedProduct.id);
      return false;
    }

    addToWishlist(normalizedProduct);
    return true;
  }

  function getProductFromCard(card) {
    if (!card) {
      return null;
    }

    const compareCheckbox = card.querySelector('.compare-checkbox');
    const title = compareCheckbox?.dataset.title || card.querySelector('.product-title')?.textContent.trim();
    const category = compareCheckbox?.dataset.category || card.querySelector('.product-category')?.textContent.trim();
    const image = compareCheckbox?.dataset.image || card.querySelector('.product-card-img')?.src;
    const priceLabel = compareCheckbox?.dataset.price || card.querySelector('.product-price')?.textContent.trim();
    const url = card.querySelector('a[href]')?.getAttribute('href') || 'product-details.html';

    return normalizeProduct({
      id: compareCheckbox?.dataset.id || slugify(title),
      title,
      category,
      image,
      priceLabel,
      url,
    });
  }

  function getProductFromDetails() {
    const title = document.querySelector('.product-info h1')?.textContent.trim();

    if (!title) {
      return null;
    }

    return normalizeProduct({
      id: slugify(title),
      title,
      category: document.querySelector('.product-info .product-category')?.textContent.trim(),
      image: document.querySelector('.main-image')?.src,
      priceLabel: document.querySelector('.price-large')?.textContent.trim(),
      url: window.location.pathname.split('/').pop() || 'product-details.html',
    });
  }

  function ensureWishlistButtonsOnCards() {
    document.querySelectorAll('.product-card').forEach(card => {
      const priceRow = card.querySelector('.product-price-row');
      const addToCartBtn = priceRow?.querySelector('.add-to-cart-btn');

      if (!priceRow || !addToCartBtn) {
        return;
      }

      let quickActions = priceRow.querySelector('.product-quick-actions');
      if (!quickActions) {
        quickActions = document.createElement('div');
        quickActions.className = 'product-quick-actions';
        priceRow.appendChild(quickActions);
        quickActions.appendChild(addToCartBtn);
      }

      if (!quickActions.querySelector('.wishlist-toggle-btn')) {
        const product = getProductFromCard(card);
        const wishlistBtn = document.createElement('button');
        wishlistBtn.className = 'wishlist-toggle-btn';
        wishlistBtn.type = 'button';
        wishlistBtn.dataset.productId = product.id;
        wishlistBtn.title = 'Add to Wishlist';
        wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';

        wishlistBtn.addEventListener('click', () => {
          const added = toggleWishlist(product);
          wishlistBtn.classList.toggle('is-active', added);
          wishlistBtn.title = added ? 'Remove from Wishlist' : 'Add to Wishlist';
        });

        quickActions.prepend(wishlistBtn);
      }
    });
  }

  function ensureWishlistButtonOnDetails() {
    const detailsButton = document.querySelector('.wishlist-detail-btn');
    const product = getProductFromDetails();

    if (!detailsButton || !product) {
      return;
    }

    detailsButton.dataset.productId = product.id;
    detailsButton.addEventListener('click', () => {
      const added = toggleWishlist(product);
      detailsButton.classList.toggle('is-active', added);
      detailsButton.innerHTML = added
        ? '<i class="fas fa-heart"></i> Saved to Wishlist'
        : '<i class="fas fa-heart"></i> Save to Wishlist';
    });
  }

  function syncWishlistButtons() {
    document.querySelectorAll('.wishlist-toggle-btn').forEach(button => {
      const isActive = isInWishlist(button.dataset.productId);
      button.classList.toggle('is-active', isActive);
      button.title = isActive ? 'Remove from Wishlist' : 'Add to Wishlist';
    });

    const detailsButton = document.querySelector('.wishlist-detail-btn');
    if (detailsButton) {
      const isActive = isInWishlist(detailsButton.dataset.productId);
      detailsButton.classList.toggle('is-active', isActive);
      detailsButton.innerHTML = isActive
        ? '<i class="fas fa-heart"></i> Saved to Wishlist'
        : '<i class="fas fa-heart"></i> Save to Wishlist';
    }
  }

  function bindProductAddToCartButtons() {
    document.querySelectorAll('.product-card .add-to-cart-btn, .product-info .add-to-cart-btn').forEach(button => {
      if (button.dataset.bound === 'true') {
        return;
      }

      button.dataset.bound = 'true';
      button.addEventListener('click', function () {
        const product = this.closest('.product-card')
          ? getProductFromCard(this.closest('.product-card'))
          : getProductFromDetails();

        if (!product) {
          return;
        }

        addToCart(product);
        showButtonConfirmation(this, '<i class="fas fa-check"></i>');
      });
    });
  }

  function renderCartPage() {
    const cartItemsList = document.getElementById('cart-items-list');
    const cartEmptyState = document.getElementById('cart-empty-state');

    if (!cartItemsList || !cartEmptyState) {
      return;
    }

    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.priceValue * item.quantity), 0);
    const shipping = cart.length > 0 ? 15 : 0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    if (cart.length === 0) {
      cartItemsList.innerHTML = '';
      cartEmptyState.style.display = 'block';
    } else {
      cartEmptyState.style.display = 'none';
      cartItemsList.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.title}">
          <div class="cart-item-details">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-meta">${item.category}</div>
            <div class="cart-item-price">${formatPrice(item.priceValue)}</div>
            <div class="cart-item-actions">
              <div class="qty-controls">
                <button class="qty-btn" type="button" data-action="decrease-qty" data-id="${item.id}">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" type="button" data-action="increase-qty" data-id="${item.id}">+</button>
              </div>
              <button class="link-btn" type="button" data-action="save-for-later" data-id="${item.id}">
                <i class="fas fa-heart"></i> Save to Wishlist
              </button>
            </div>
          </div>
          <button class="remove-btn" type="button" title="Remove Item" data-action="remove-cart-item" data-id="${item.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `).join('');
    }

    const summarySubtotal = document.getElementById('cart-subtotal');
    const summaryShipping = document.getElementById('cart-shipping');
    const summaryTax = document.getElementById('cart-tax');
    const summaryTotal = document.getElementById('cart-total');
    const summaryButton = document.getElementById('checkout-btn');

    if (summarySubtotal) summarySubtotal.textContent = formatPrice(subtotal);
    if (summaryShipping) summaryShipping.textContent = formatPrice(shipping);
    if (summaryTax) summaryTax.textContent = formatPrice(tax);
    if (summaryTotal) summaryTotal.textContent = formatPrice(total);
    if (summaryButton) summaryButton.disabled = cart.length === 0;
  }

  function renderWishlistPage() {
    const wishlistGrid = document.getElementById('wishlist-grid');
    const wishlistEmptyState = document.getElementById('wishlist-empty-state');

    if (!wishlistGrid || !wishlistEmptyState) {
      return;
    }

    const wishlist = getWishlist();
    const wishlistItemsCount = document.getElementById('wishlist-items-count');

    if (wishlistItemsCount) {
      wishlistItemsCount.textContent = `${wishlist.length} item${wishlist.length === 1 ? '' : 's'}`;
    }

    if (wishlist.length === 0) {
      wishlistGrid.innerHTML = '';
      wishlistEmptyState.style.display = 'block';
      return;
    }

    wishlistEmptyState.style.display = 'none';
    wishlistGrid.innerHTML = wishlist.map(item => `
      <article class="wishlist-card">
        <img src="${item.image}" alt="${item.title}" class="wishlist-card-img">
        <div class="wishlist-card-body">
          <div class="product-category">${item.category}</div>
          <h3 class="product-title">${item.title}</h3>
          <div class="wishlist-card-price">${formatPrice(item.priceValue)}</div>
          <div class="wishlist-card-actions">
            <a href="${item.url}" class="btn btn-secondary">View Details</a>
            <button type="button" class="btn btn-primary" data-action="wishlist-add-to-cart" data-id="${item.id}">
              <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
            <button type="button" class="btn btn-secondary wishlist-remove-btn" data-action="wishlist-remove" data-id="${item.id}">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function bindCartPageEvents() {
    const cartItemsList = document.getElementById('cart-items-list');

    if (!cartItemsList) {
      return;
    }

    cartItemsList.addEventListener('click', event => {
      const actionButton = event.target.closest('[data-action]');

      if (!actionButton) {
        return;
      }

      const productId = actionButton.dataset.id;

      if (actionButton.dataset.action === 'increase-qty') {
        updateCartQuantity(productId, 1);
      }

      if (actionButton.dataset.action === 'decrease-qty') {
        updateCartQuantity(productId, -1);
      }

      if (actionButton.dataset.action === 'remove-cart-item') {
        removeFromCart(productId);
      }

      if (actionButton.dataset.action === 'save-for-later') {
        const cartItem = getCart().find(item => item.id === productId);
        if (cartItem) {
          addToWishlist(cartItem);
        }
      }

      renderCartPage();
      renderWishlistPage();
    });
  }

  function bindWishlistPageEvents() {
    const wishlistGrid = document.getElementById('wishlist-grid');

    if (!wishlistGrid) {
      return;
    }

    wishlistGrid.addEventListener('click', event => {
      const actionButton = event.target.closest('[data-action]');

      if (!actionButton) {
        return;
      }

      const productId = actionButton.dataset.id;
      const wishlistItem = getWishlist().find(item => item.id === productId);

      if (actionButton.dataset.action === 'wishlist-add-to-cart' && wishlistItem) {
        addToCart(wishlistItem);
      }

      if (actionButton.dataset.action === 'wishlist-remove') {
        removeFromWishlist(productId);
      }

      renderCartPage();
      renderWishlistPage();
    });
  }

  // Theme Toggle Logic
  const themeToggleBtn = document.getElementById('theme-toggle');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);

      const icon = themeToggleBtn.querySelector('i');
      if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
      } else {
        icon.className = 'fas fa-moon';
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
      }
    });
  }

  // Layout Toggle Logic
  const layoutToggleBtn = document.getElementById('layout-toggle');
  if (layoutToggleBtn) {
    layoutToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('layout-alternative');

      const isAlt = document.body.classList.contains('layout-alternative');
      layoutToggleBtn.innerHTML = isAlt
        ? '<i class="fas fa-border-all"></i> Default Layout'
        : '<i class="fas fa-columns"></i> Alt Layout';
    });
  }

  // View Toggle Logic
  const gridViewBtn = document.getElementById('grid-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');
  const productContainer = document.getElementById('product-container');

  if (gridViewBtn && listViewBtn && productContainer) {
    gridViewBtn.addEventListener('click', () => {
      productContainer.className = 'product-grid';
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
    });

    listViewBtn.addEventListener('click', () => {
      productContainer.className = 'product-list-layout';
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
    });
  }

  // Tab Logic for Product Details
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(button => button.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  // Comparison Feature Logic
  const compareCheckboxes = document.querySelectorAll('.compare-checkbox');
  const compareBar = document.getElementById('compare-bar');
  const compareBarContent = document.getElementById('compare-bar-content');
  const compareCountSpan = document.getElementById('compare-count');
  const compareBtn = document.getElementById('compare-btn');
  const clearCompareBtn = document.getElementById('clear-compare-btn');
  const compareModal = document.getElementById('compare-modal');
  const closeModalBtn = document.getElementById('close-compare-modal');
  const compareTableHeadRow = document.getElementById('compare-table-head');
  const compareTablePriceRow = document.getElementById('compare-table-price');
  const compareTableCategoryRow = document.getElementById('compare-table-category');
  const compareTableRatingRow = document.getElementById('compare-table-rating');

  let compareList = [];

  function updateCompareUI() {
    if (!compareBar || !compareBarContent || !compareCountSpan) {
      return;
    }

    compareCountSpan.textContent = compareList.length;
    compareBar.classList.toggle('active', compareList.length > 0);
    compareBarContent.innerHTML = '';

    compareList.forEach(item => {
      const previewDiv = document.createElement('div');
      previewDiv.className = 'compare-item-preview';
      previewDiv.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <button class="remove-compare-item" type="button" data-id="${item.id}"><i class="fas fa-times"></i></button>
      `;
      compareBarContent.appendChild(previewDiv);
    });

    compareBarContent.querySelectorAll('.remove-compare-item').forEach(button => {
      button.addEventListener('click', event => {
        const productId = event.currentTarget.getAttribute('data-id');
        compareList = compareList.filter(item => item.id !== productId);
        const checkbox = document.querySelector(`.compare-checkbox[data-id="${productId}"]`);
        if (checkbox) {
          checkbox.checked = false;
        }
        updateCompareUI();
      });
    });
  }

  if (compareCheckboxes.length > 0) {
    compareCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const item = {
          id: checkbox.getAttribute('data-id'),
          title: checkbox.getAttribute('data-title'),
          image: checkbox.getAttribute('data-image'),
          price: checkbox.getAttribute('data-price'),
          category: checkbox.getAttribute('data-category'),
          rating: checkbox.getAttribute('data-rating') || '4.5 / 5',
        };

        if (checkbox.checked) {
          if (compareList.length >= 4) {
            alert('You can only compare up to 4 items.');
            checkbox.checked = false;
            return;
          }
          compareList.push(item);
        } else {
          compareList = compareList.filter(product => product.id !== item.id);
        }

        updateCompareUI();
      });
    });
  }

  if (clearCompareBtn) {
    clearCompareBtn.addEventListener('click', () => {
      compareList = [];
      compareCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
      updateCompareUI();
    });
  }

  if (compareBtn && compareModal) {
    compareBtn.addEventListener('click', () => {
      if (compareList.length < 2) {
        alert('Please select at least 2 items to compare.');
        return;
      }

      compareTableHeadRow.innerHTML = '<th>Product Feature</th>';
      compareTablePriceRow.innerHTML = '<th>Price</th>';
      compareTableCategoryRow.innerHTML = '<th>Category</th>';
      compareTableRatingRow.innerHTML = '<th>Rating</th>';

      compareList.forEach(item => {
        compareTableHeadRow.innerHTML += `
          <td>
            <img src="${item.image}" alt="${item.title}">
            <h4>${item.title}</h4>
          </td>
        `;
        compareTablePriceRow.innerHTML += `<td>${item.price}</td>`;
        compareTableCategoryRow.innerHTML += `<td>${item.category}</td>`;
        compareTableRatingRow.innerHTML += `<td>${item.rating}</td>`;
      });

      compareModal.classList.add('active');
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      compareModal.classList.remove('active');
    });
  }

  // Search and Filter Logic
  const searchInputs = document.querySelectorAll('.search-bar input');
  const searchBtns = document.querySelectorAll('.search-bar button');
  const categoryFilters = document.querySelectorAll('.category-filter');
  const allProducts = document.querySelectorAll('.product-card');
  const searchResultsCount = document.querySelector('.products-header h2');
  const priceFilter = document.getElementById('price-filter');
  const priceValueDisplay = document.getElementById('price-value');

  const urlParams = new URLSearchParams(window.location.search);
  const urlSearch = urlParams.get('search');
  const urlCategory = urlParams.get('category');

  if (urlSearch) {
    searchInputs.forEach(input => {
      input.value = urlSearch;
    });
  }

  if (urlCategory) {
    categoryFilters.forEach(checkbox => {
      const filterValue = checkbox.value.toLowerCase();
      const categoryValue = urlCategory.toLowerCase();
      if (filterValue === categoryValue || categoryValue.includes(filterValue.split(' ')[0])) {
        checkbox.checked = true;
      }
    });
  }

  function filterProducts() {
    let searchTerm = '';
    searchInputs.forEach(input => {
      if (input.value) {
        searchTerm = input.value.toLowerCase().trim();
      }
    });

    const activeCategories = Array.from(categoryFilters)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value.toLowerCase());

    const maxPrice = priceFilter ? parseFloat(priceFilter.value) : Infinity;

    if (priceValueDisplay && priceFilter) {
      priceValueDisplay.textContent = priceFilter.value;
    }

    let visibleCount = 0;

    allProducts.forEach(card => {
      const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
      const category = card.querySelector('.product-category')?.textContent.toLowerCase() || '';
      const productPrice = parsePrice(card.querySelector('.product-price')?.textContent);

      const matchesSearch = searchTerm === '' || title.includes(searchTerm);
      const matchesCategory = activeCategories.length === 0 || activeCategories.includes(category);
      const matchesPrice = productPrice <= maxPrice;

      if (matchesSearch && matchesCategory && matchesPrice) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (searchResultsCount) {
      searchResultsCount.textContent = `Search Results (${visibleCount} items)`;
    }
  }

  if (priceFilter) {
    priceFilter.addEventListener('input', filterProducts);
  }

  searchInputs.forEach((input, index) => {
    input.addEventListener('keyup', event => {
      if (event.key === 'Enter') {
        const isProductsPage = window.location.pathname.includes('products.html');
        if (!isProductsPage) {
          window.location.href = `products.html?search=${encodeURIComponent(input.value)}`;
        } else {
          filterProducts();
        }
      } else if (window.location.pathname.includes('products.html')) {
        filterProducts();
      }
    });
  });

  searchBtns.forEach((button, index) => {
    button.addEventListener('click', event => {
      event.preventDefault();
      const input = searchInputs[index];
      const isProductsPage = window.location.pathname.includes('products.html');

      if (!isProductsPage && input.value.trim() !== '') {
        window.location.href = `products.html?search=${encodeURIComponent(input.value)}`;
      } else {
        filterProducts();
      }
    });
  });

  categoryFilters.forEach(checkbox => {
    checkbox.addEventListener('change', filterProducts);
  });

  updateBadgeCounts();
  ensureWishlistButtonsOnCards();
  ensureWishlistButtonOnDetails();
  syncWishlistButtons();
  bindProductAddToCartButtons();
  bindCartPageEvents();
  bindWishlistPageEvents();
  renderCartPage();
  renderWishlistPage();
  filterProducts();
});
