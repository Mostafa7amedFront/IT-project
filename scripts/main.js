document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Logic
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Update icon
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

  // Layout Toggle Logic (Requirement: Multiple themes, each with its own layout/colors)
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

  // View Toggle Logic (Grid vs List View)
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

  // Dynamic Elements: Add to Cart logic (Show/Hide/Change elements)
  const cartCounters = document.querySelectorAll('.cart-count');
  const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
  let cartItems = 0;

  addToCartBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Dynamic Logic: add/remove/change elements and attributes
      cartItems++;
      cartCounters.forEach(counter => {
        counter.textContent = cartItems;
        // Animation effect
        counter.style.transform = 'scale(1.5)';
        setTimeout(() => {
          counter.style.transform = 'scale(1)';
        }, 200);
      });
      
      // Change button state temporarily
      const originalIcon = this.innerHTML;
      this.innerHTML = '<i class="fas fa-check"></i>';
      this.style.color = 'var(--success-color)';
      
      setTimeout(() => {
        this.innerHTML = originalIcon;
        this.style.color = '';
      }, 1000);
    });
  });

  // Tab Logic for Product Details (Show/Hide content)
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
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
  const compareTableBodyRow1 = document.getElementById('compare-table-price');
  const compareTableBodyRow2 = document.getElementById('compare-table-category');
  const compareTableBodyRow3 = document.getElementById('compare-table-rating');

  let compareList = [];

  function updateCompareUI() {
    if(!compareBar) return;
    
    // Update count
    compareCountSpan.textContent = compareList.length;
    
    // Update bar visibility
    if (compareList.length > 0) {
      compareBar.classList.add('active');
    } else {
      compareBar.classList.remove('active');
    }
    
    // Render preview icons
    compareBarContent.innerHTML = '';
    compareList.forEach(item => {
      const previewDiv = document.createElement('div');
      previewDiv.className = 'compare-item-preview';
      previewDiv.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <button class="remove-compare-item" data-id="${item.id}"><i class="fas fa-times"></i></button>
      `;
      compareBarContent.appendChild(previewDiv);
    });

    // Attach event listeners to remove buttons
    const removeBtns = document.querySelectorAll('.remove-compare-item');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idToRemove = e.currentTarget.getAttribute('data-id');
        compareList = compareList.filter(item => item.id !== idToRemove);
        // Uncheck the corresponding checkbox if it exists on page
        const cb = document.querySelector(`.compare-checkbox[data-id="${idToRemove}"]`);
        if (cb) cb.checked = false;
        updateCompareUI();
      });
    });
  }

  if (compareCheckboxes.length > 0) {
    compareCheckboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const item = {
          id: cb.getAttribute('data-id'),
          title: cb.getAttribute('data-title'),
          image: cb.getAttribute('data-image'),
          price: cb.getAttribute('data-price'),
          category: cb.getAttribute('data-category'),
          rating: cb.getAttribute('data-rating') || '4.5 / 5'
        };

        if (cb.checked) {
          if (compareList.length >= 4) {
            alert('You can only compare up to 4 items.');
            cb.checked = false;
            return;
          }
          compareList.push(item);
        } else {
          compareList = compareList.filter(i => i.id !== item.id);
        }
        updateCompareUI();
      });
    });
  }

  if (clearCompareBtn) {
    clearCompareBtn.addEventListener('click', () => {
      compareList = [];
      compareCheckboxes.forEach(cb => cb.checked = false);
      updateCompareUI();
    });
  }

  if (compareBtn && compareModal) {
    compareBtn.addEventListener('click', () => {
      if (compareList.length < 2) {
        alert('Please select at least 2 items to compare.');
        return;
      }
      
      // Populate table
      compareTableHeadRow.innerHTML = '<th>Product Feature</th>';
      compareTableBodyRow1.innerHTML = '<th>Price</th>';
      compareTableBodyRow2.innerHTML = '<th>Category</th>';
      compareTableBodyRow3.innerHTML = '<th>Rating</th>';

      compareList.forEach(item => {
        compareTableHeadRow.innerHTML += `
          <td>
            <img src="${item.image}" alt="${item.title}">
            <h4>${item.title}</h4>
          </td>
        `;
        compareTableBodyRow1.innerHTML += `<td>${item.price}</td>`;
        compareTableBodyRow2.innerHTML += `<td>${item.category}</td>`;
        compareTableBodyRow3.innerHTML += `<td>${item.rating}</td>`;
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

  // Parse URL params for initial state
  const urlParams = new URLSearchParams(window.location.search);
  const urlSearch = urlParams.get('search');
  const urlCategory = urlParams.get('category');

  if (urlSearch) {
    searchInputs.forEach(input => input.value = urlSearch);
  }

  if (urlCategory) {
    categoryFilters.forEach(cb => {
      if (cb.value.toLowerCase() === urlCategory.toLowerCase() || urlCategory.toLowerCase().includes(cb.value.toLowerCase().split(' ')[0])) {
        cb.checked = true;
      }
    });
  }

  function filterProducts() {
    let searchTerm = '';
    searchInputs.forEach(input => {
      if (input.value) searchTerm = input.value.toLowerCase().trim();
    });

    const activeCategories = Array.from(categoryFilters)
      .filter(cb => cb.checked)
      .map(cb => cb.value.toLowerCase());

    const maxPrice = priceFilter ? parseFloat(priceFilter.value) : Infinity;
    
    if (priceValueDisplay && priceFilter) {
      priceValueDisplay.textContent = priceFilter.value;
    }

    let visibleCount = 0;

    allProducts.forEach(card => {
      const titleElement = card.querySelector('.product-title');
      const categoryElement = card.querySelector('.product-category');
      const priceElement = card.querySelector('.product-price');
      
      if (!titleElement || !categoryElement || !priceElement) return;

      const title = titleElement.textContent.toLowerCase();
      const category = categoryElement.textContent.toLowerCase();
      const priceText = priceElement.textContent;
      const productPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));

      const matchesSearch = searchTerm === '' || title.includes(searchTerm);
      const matchesCategory = activeCategories.length === 0 || activeCategories.includes(category);
      const matchesPrice = isNaN(productPrice) || productPrice <= maxPrice;

      if (matchesSearch && matchesCategory && matchesPrice) {
        card.style.display = ''; // Revert to default (flex/block)
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

  // Setup event listeners for live search and filtering
  searchInputs.forEach((input, index) => {
    input.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const isProductsPage = window.location.pathname.includes('products.html');
        if (!isProductsPage) {
          window.location.href = `products.html?search=${encodeURIComponent(input.value)}`;
        } else {
          filterProducts();
        }
      } else {
        if (window.location.pathname.includes('products.html')) {
          filterProducts();
        }
      }
    });
  });

  searchBtns.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = searchInputs[index];
      const isProductsPage = window.location.pathname.includes('products.html');
      if (!isProductsPage && input.value.trim() !== '') {
        window.location.href = `products.html?search=${encodeURIComponent(input.value)}`;
      } else {
        filterProducts();
      }
    });
  });

  categoryFilters.forEach(cb => {
    cb.addEventListener('change', filterProducts);
  });

  // Initial filter run (important if URL params are present or if default filters are checked)
  filterProducts();

});
