// keep prices as raw numbers for math
const defaultProducts = [
  {
    id: 1,
    brand: "ROADSTER",
    name: "Pure Cotton Relaxed Fit Casual Shirt",
    price: 799,
    mrp: 1499,
    category: "Apparel",
    rating: "4.2",
    reviews: "2.1k",
    icon: "👔",
    bg: "#fee2e2"
  },
  {
    id: 2,
    brand: "HRX BY HRITHIK",
    name: "Rapid-Dry Performance Training Tee",
    price: 499,
    mrp: 999,
    category: "Apparel",
    rating: "4.4",
    reviews: "5.8k",
    icon: "👕",
    bg: "#e0f2fe"
  },
  {
    id: 3,
    brand: "HIGHLANDER",
    name: "Slim Fit Stretch Denim Jeans",
    price: 1199,
    mrp: 2299,
    category: "Apparel",
    rating: "4.1",
    reviews: "1.9k",
    icon: "👖",
    bg: "#dbeafe"
  },
  {
    id: 4,
    brand: "PUMA",
    name: "Men Smashic Leather Casual Sneakers",
    price: 2499,
    mrp: 4499,
    category: "Footwear",
    rating: "4.5",
    reviews: "3.4k",
    icon: "👟",
    bg: "#fef3c7"
  },
  {
    id: 5,
    brand: "RED TAPE",
    name: "Classic Low-Top Retro Trainers",
    price: 1399,
    mrp: 3299,
    category: "Footwear",
    rating: "4.3",
    reviews: "4.2k",
    icon: "👞",
    bg: "#f3e8ff"
  },
  {
    id: 6,
    brand: "BOAT",
    name: "Rockerz 450 Pro Wireless Headphones",
    price: 1699,
    mrp: 3990,
    category: "Electronics",
    rating: "4.3",
    reviews: "12.6k",
    icon: "🎧",
    bg: "#ffedd5"
  },
  {
    id: 7,
    brand: "NOISE",
    name: "ColorFit Pro 4 Max Smartwatch",
    price: 2199,
    mrp: 5999,
    category: "Electronics",
    rating: "4.2",
    reviews: "8.1k",
    icon: "⌚",
    bg: "#e0e7ff"
  },
  {
    id: 8,
    brand: "URBAN MONKEY",
    name: "Vintage Corduroy Snapback Cap",
    price: 449,
    mrp: 999,
    category: "Accessories",
    rating: "4.6",
    reviews: "890",
    icon: "🧢",
    bg: "#ecfdf5"
  },
  {
    id: 9,
    brand: "WILDHORN",
    name: "Genuine Leather Bi-Fold RFID Wallet",
    price: 389,
    mrp: 899,
    category: "Accessories",
    rating: "4.3",
    reviews: "1.5k",
    icon: "👛",
    bg: "#fef9c3"
  },
  {
    id: 10,
    brand: "FASTTRACK",
    name: "Aviator UV-Protected Polarized Sunglasses",
    price: 899,
    mrp: 1799,
    category: "Accessories",
    rating: "4.1",
    reviews: "2.3k",
    icon: "🕶️",
    bg: "#f1f5f9"
  }
];

let products = [...defaultProducts];
let activeCategory = 'All';
let searchQuery = '';
let currentSort = 'recommended';

// sync cart state with browser localstorage
let cart = (() => {
  try {
    const saved = localStorage.getItem('myntra_cart');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
})();

// sync wishlist state with browser storage
let wishlist = (() => {
  try {
    const saved = localStorage.getItem('myntra_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
})();

const formatINR = (val) => {
  return Number(val).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
};

function saveCart() {
  localStorage.setItem('myntra_cart', JSON.stringify(cart));
}

function saveWishlist() {
  localStorage.setItem('myntra_wishlist', JSON.stringify(wishlist));
}

// lookup by id to avoid index mismatch bugs
function addToCart(id) {
  const item = products.find(p => p.id === id);
  if (!item) return;

  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  showToast(`Added ${item.brand} item to your bag 🛍️`);
}

function changeQuantity(id, delta) {
  if (!cart[id]) return;

  cart[id] += delta;

  // drop item if qty reaches 0 or below
  if (cart[id] <= 0) {
    delete cart[id];
  }

  saveCart();
  renderCart();
}

function removeItem(id) {
  delete cart[id];
  saveCart();
  renderCart();
}

// toggle wishlist item state
function toggleWishlist(id) {
  const index = wishlist.indexOf(id);
  if (index > -1) {
    wishlist.splice(index, 1);
  } else {
    wishlist.push(id);
    const item = products.find(p => p.id === id);
    if (item) showToast(`Saved ${item.brand} to Wishlist ♡`);
  }
  saveWishlist();
  updateWishlistUI();
}

function updateWishlistUI() {
  const badge = document.getElementById('wishlistCount');
  if (badge) badge.textContent = wishlist.length;

  document.querySelectorAll('.btn-wishlist').forEach(btn => {
    const id = Number(btn.dataset.id);
    const isWishlisted = wishlist.includes(id);
    btn.classList.toggle('active', isWishlisted);
    btn.textContent = isWishlisted ? '♥' : '♡';
  });
}

// try fetching from backend api, fallback to local data if offline
async function loadProductsFromBackend() {
  try {
    const params = new URLSearchParams();
    if (activeCategory !== 'All') params.append('category', activeCategory);
    if (searchQuery) params.append('search', searchQuery);
    if (currentSort !== 'recommended') params.append('sort', currentSort);

    const res = await fetch(`/api/products?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        products = data.data;
        renderProducts();
        return;
      }
    }
  } catch {
    // backend not running, use client-side filter
  }

  // client fallback filtering
  let filtered = [...defaultProducts];
  if (activeCategory !== 'All') {
    filtered = filtered.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }
  if (currentSort === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'rating') {
    filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  }
  products = filtered;
  renderProducts();
}

function renderCategoryPills() {
  const container = document.getElementById('categoryFilters');
  const categories = ['All', 'Apparel', 'Footwear', 'Accessories', 'Electronics'];

  container.innerHTML = categories.map(cat => `
    <button 
      type="button" 
      class="pill-btn ${cat === activeCategory ? 'active' : ''}" 
      data-category="${cat}">
      ${cat}
    </button>
  `).join('');

  container.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      renderCategoryPills();
      syncNavLinks();
      loadProductsFromBackend();
    });
  });
}

function syncNavLinks() {
  document.querySelectorAll('.nav-link').forEach(link => {
    const navCat = link.dataset.navCat;
    link.classList.toggle('active', navCat === activeCategory);
  });
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const countEl = document.getElementById('itemsCountDisplay');
  if (countEl) countEl.textContent = `Showing ${products.length} items`;

  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: #535766;">
        <p style="font-size: 1.1rem; font-weight: 700;">No matching products found</p>
        <p style="font-size: 0.85rem; margin-top: 0.25rem;">Try adjusting your category filter or search keywords.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(p => {
    const isWishlisted = wishlist.includes(p.id);
    const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);

    return `
      <article class="myntra-card">
        <div class="card-visual-wrapper" style="background-color: ${p.bg || '#f1f5f9'};">
          <button 
            type="button" 
            class="btn-wishlist ${isWishlisted ? 'active' : ''}" 
            data-id="${p.id}" 
            aria-label="Wishlist ${p.name}">
            ${isWishlisted ? '♥' : '♡'}
          </button>
          
          <div class="card-icon" aria-hidden="true">${p.icon}</div>

          <div class="rating-badge">
            <span class="star">★</span>
            <span>${p.rating}</span>
            <span class="count">${p.reviews}</span>
          </div>
        </div>

        <div class="card-content">
          <div class="brand-title">${p.brand}</div>
          <p class="product-desc" title="${p.name}">${p.name}</p>
          
          <div class="price-row">
            <span class="current-price">${formatINR(p.price)}</span>
            <span class="mrp-price">${formatINR(p.mrp)}</span>
            <span class="discount-percentage">(${discount}% OFF)</span>
          </div>

          <button 
            type="button" 
            class="btn-add-bag" 
            data-id="${p.id}">
            🛍️ ADD TO BAG
          </button>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.btn-add-bag').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      addToCart(id);
    });
  });

  grid.querySelectorAll('.btn-wishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      toggleWishlist(id);
    });
  });
}

function renderCart() {
  // lookup product objects from master catalogue list
  const cartEntries = Object.entries(cart).map(([id, qty]) => ({
    product: defaultProducts.find(p => p.id === Number(id)),
    quantity: qty
  })).filter(e => e.product);

  const totalQuantity = cartEntries.reduce((sum, item) => sum + item.quantity, 0);

  // calculate subtotal directly from active cart items
  const subtotal = cartEntries.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalMrp = cartEntries.reduce((sum, item) => sum + (item.product.mrp * item.quantity), 0);
  const totalDiscount = totalMrp - subtotal;

  // free delivery above 500, flat 40 below
  const deliveryFee = (subtotal > 0 && subtotal < 500) ? 40 : 0;
  const grandTotal = subtotal + deliveryFee;

  document.getElementById('navCartCount').textContent = totalQuantity;
  document.getElementById('cartTotalItems').textContent = `${totalQuantity} ${totalQuantity === 1 ? 'Item' : 'Items'}`;

  const emptyCartEl = document.getElementById('emptyCart');
  const cartContentEl = document.getElementById('cartContent');
  const checkoutBtn = document.getElementById('openCheckoutBtn');

  if (cartEntries.length === 0) {
    emptyCartEl.hidden = false;
    cartContentEl.hidden = true;
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  emptyCartEl.hidden = true;
  cartContentEl.hidden = false;
  if (checkoutBtn) checkoutBtn.disabled = false;

  const tableBody = document.getElementById('cartTableBody');
  tableBody.innerHTML = cartEntries.map(({ product, quantity }) => {
    const lineTotal = product.price * quantity;
    return `
      <tr>
        <td>
          <div class="cart-product-cell">
            <div class="cart-thumb" style="background-color: ${product.bg || '#f1f5f9'};">
              ${product.icon}
            </div>
            <div>
              <div class="cart-item-brand">${product.brand}</div>
              <div class="cart-item-name" title="${product.name}">${product.name}</div>
            </div>
          </div>
        </td>
        <td class="text-right">
          <div style="font-weight: 700;">${formatINR(product.price)}</div>
        </td>
        <td class="text-center">
          <div class="qty-stepper">
            <button 
              type="button" 
              class="btn-step" 
              data-action="decrease" 
              data-id="${product.id}" 
              aria-label="Decrease quantity">-</button>
            <span class="qty-number">${quantity}</span>
            <button 
              type="button" 
              class="btn-step" 
              data-action="increase" 
              data-id="${product.id}" 
              aria-label="Increase quantity">+</button>
          </div>
        </td>
        <td class="text-right cart-line-total">${formatINR(lineTotal)}</td>
        <td class="text-center">
          <button 
            type="button" 
            class="btn-remove-item" 
            data-id="${product.id}" 
            aria-label="Remove item">&times;</button>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('.btn-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const delta = btn.dataset.action === 'increase' ? 1 : -1;
      changeQuantity(id, delta);
    });
  });

  tableBody.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      removeItem(id);
    });
  });

  const deliveryNoticeEl = document.getElementById('deliveryNotice');
  if (subtotal >= 500) {
    deliveryNoticeEl.className = 'delivery-meter-box free';
    deliveryNoticeEl.innerHTML = `<span>🎉</span> Congratulations! You have unlocked <strong>FREE Delivery</strong>.`;
  } else {
    const remaining = 500 - subtotal;
    deliveryNoticeEl.className = 'delivery-meter-box fee';
    deliveryNoticeEl.innerHTML = `<span>📦</span> Add <strong>${formatINR(remaining)}</strong> more to unlock <strong>FREE Delivery</strong>!`;
  }

  document.getElementById('mrpTotalAmount').textContent = formatINR(totalMrp);
  document.getElementById('mrpDiscountAmount').textContent = `-${formatINR(totalDiscount)}`;
  document.getElementById('subtotalAmount').textContent = formatINR(subtotal);
  document.getElementById('deliveryAmount').textContent = deliveryFee === 0 ? 'FREE' : formatINR(deliveryFee);
  document.getElementById('grandTotalAmount').textContent = formatINR(grandTotal);
}

function setupCheckoutModal() {
  const dialog = document.getElementById('checkoutDialog');
  const openBtn = document.getElementById('openCheckoutBtn');
  const closeBtn = document.getElementById('closeDialogBtn');
  const cancelBtn = document.getElementById('cancelCheckoutBtn');
  const confirmBtn = document.getElementById('confirmOrderBtn');

  openBtn.addEventListener('click', () => {
    const cartEntries = Object.entries(cart).map(([id, qty]) => ({
      product: defaultProducts.find(p => p.id === Number(id)),
      quantity: qty
    })).filter(e => e.product);

    if (cartEntries.length === 0) return;

    const subtotal = cartEntries.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const deliveryFee = (subtotal > 0 && subtotal < 500) ? 40 : 0;
    const grandTotal = subtotal + deliveryFee;

    const listEl = document.getElementById('dialogOrderList');
    listEl.innerHTML = cartEntries.map(({ product, quantity }) => `
      <div class="modal-item-row">
        <div class="modal-item-info">
          <span>${product.brand} - ${product.name}</span>
          <span class="modal-item-qty">Qty: ${quantity}</span>
        </div>
        <span style="font-weight: 700;">${formatINR(product.price * quantity)}</span>
      </div>
    `).join('');

    document.getElementById('modalSubtotal').textContent = formatINR(subtotal);
    document.getElementById('modalDelivery').textContent = deliveryFee === 0 ? 'FREE' : formatINR(deliveryFee);
    document.getElementById('modalGrandTotal').textContent = formatINR(grandTotal);

    dialog.showModal();
  });

  const closeDialog = () => dialog.close();
  closeBtn.addEventListener('click', closeDialog);
  cancelBtn.addEventListener('click', closeDialog);

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "PLACING ORDER...";

    const cartEntries = Object.entries(cart).map(([id, qty]) => ({
      product: defaultProducts.find(p => p.id === Number(id)),
      quantity: qty
    })).filter(e => e.product);

    if (cartEntries.length === 0) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "CONFIRM DEMO ORDER";
      dialog.close();
      return;
    }

    const subtotal = cartEntries.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalMrp = cartEntries.reduce((sum, item) => sum + (item.product.mrp * item.quantity), 0);
    const deliveryFee = (subtotal > 0 && subtotal < 500) ? 40 : 0;
    const grandTotal = subtotal + deliveryFee;

    const now = new Date();
    const arrival = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const arrivalString = arrival.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    // fallback order guarantee for offline or standalone file mode
    let finalOrder = {
      orderId: `MYN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: now.toISOString(),
      deliveryEstimate: `${arrivalString} by 8:00 PM`,
      items: cartEntries.map(e => ({
        id: e.product.id,
        name: e.product.name,
        brand: e.product.brand,
        price: e.product.price,
        mrp: e.product.mrp,
        icon: e.product.icon,
        bg: e.product.bg,
        quantity: e.quantity,
        lineTotal: e.product.price * e.quantity
      })),
      totalItems: cartEntries.reduce((acc, i) => acc + i.quantity, 0),
      totalMrp,
      discount: totalMrp - subtotal,
      subtotal,
      deliveryFee,
      grandTotal,
      customer: {
        name: "Aditya Rahate",
        pincode: "400001",
        city: "Mumbai",
        phone: "+91 98765 43210"
      },
      paymentMethod: "Demo Checkout (COD / Simulation)",
      status: "Confirmed"
    };

    // send checkout payload to backend server
    const orderPayload = {
      customerName: "Aditya Rahate",
      pincode: "400001",
      items: Object.entries(cart).map(([id, quantity]) => ({
        id: Number(id),
        quantity
      }))
    };

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order && data.order.orderId) {
          finalOrder = data.order;
        }
      }
    } catch {
      // offline mode fallback
    }

    // sync local orders cache for offline access
    try {
      const local = JSON.parse(localStorage.getItem('myntra_orders') || '[]');
      local.unshift(finalOrder);
      localStorage.setItem('myntra_orders', JSON.stringify(local));
    } catch {
      // ignore storage errors
    }

    // clear cart after successful order confirmation
    cart = {};
    localStorage.removeItem('myntra_cart');

    dialog.close();
    confirmBtn.disabled = false;
    confirmBtn.textContent = "CONFIRM DEMO ORDER";

    renderCart();
    fetchHomeOrders();

    // scroll directly to orders section so user immediately sees their order
    const ordersSection = document.getElementById('ordersSection');
    if (ordersSection) {
      setTimeout(() => {
        ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }

    showToast(`Order Confirmed! Ref: ${finalOrder.orderId} 🎉 Scroll down to view order details`, 'success');
  });
}

// fetch and render orders on home page
async function fetchHomeOrders() {
  let serverOrders = [];

  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        serverOrders = data.orders;
      }
    }
  } catch {
    // offline mode fallback
  }

  let localOrders = [];
  try {
    const local = JSON.parse(localStorage.getItem('myntra_orders') || '[]');
    localOrders = local;
  } catch {
    localOrders = [];
  }

  // merge server and local orders by id
  const mergedMap = new Map();
  serverOrders.forEach(o => mergedMap.set(o.orderId, o));
  localOrders.forEach(o => {
    if (!mergedMap.has(o.orderId)) {
      mergedMap.set(o.orderId, o);
    }
  });

  const ordersList = Array.from(mergedMap.values());

  const badge = document.getElementById('navOrdersBadge');
  if (badge) badge.textContent = ordersList.length;

  const emptyEl = document.getElementById('emptyHomeOrders');
  const feedEl = document.getElementById('homeOrdersFeed');

  if (!feedEl) return;

  if (ordersList.length === 0) {
    if (emptyEl) emptyEl.hidden = false;
    feedEl.innerHTML = '';
    return;
  }

  if (emptyEl) emptyEl.hidden = true;

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  feedEl.innerHTML = ordersList.map(order => {
    const isCancelled = order.status === 'Cancelled';
    const statusClass = isCancelled ? 'status-cancelled' : 'status-confirmed';
    const statusText = isCancelled ? '● Cancelled' : '● Confirmed';

    return `
      <article class="order-card">
        <div class="order-card-header">
          <div>
            <span class="order-id-tag">ORDER #${order.orderId}</span>
            <span class="order-timestamp">Placed on ${formatDate(order.createdAt)}</span>
          </div>
          <div class="order-status-group">
            <span class="order-status-pill ${statusClass}">${statusText}</span>
            <span class="order-total-price">${formatINR(order.grandTotal)}</span>
          </div>
        </div>

        <div class="order-delivery-banner ${isCancelled ? 'cancelled' : ''}">
          <span class="delivery-icon">${isCancelled ? '❌' : '⚡'}</span>
          <div>
            ${isCancelled 
              ? `<strong>This order has been cancelled</strong>` 
              : `<strong>Estimated Delivery:</strong> ${order.deliveryEstimate || 'Tomorrow by 8:00 PM'}`}
            <p class="delivery-address-line">
              Shipping to: <strong>${order.customer?.name || 'Aditya Rahate'}</strong>, ${order.customer?.city || 'Mumbai'} (${order.customer?.pincode || '400001'})
            </p>
          </div>
        </div>

        <div class="order-items-list">
          ${order.items.map(item => `
            <div class="order-item-entry">
              <div class="order-thumb" style="background-color: ${item.bg || '#f1f5f9'};">
                ${item.icon || '🛍️'}
              </div>
              <div class="order-item-text">
                <div class="order-item-brand">${item.brand || 'MYNTRA'}</div>
                <div class="order-item-title">${item.name}</div>
                <div class="order-item-qty">Qty: ${item.quantity} &times; ${formatINR(item.price)}</div>
              </div>
              <div class="order-item-subtotal">${formatINR(item.lineTotal || (item.price * item.quantity))}</div>
            </div>
          `).join('')}
        </div>

        <div class="order-bill-summary">
          <span>Items: <strong>${order.totalItems}</strong></span>
          <span>Delivery: <strong>${order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}</strong></span>
          <span>Payment: <strong>${order.paymentMethod || 'Demo Pay'}</strong></span>
          <span class="total-tag">Paid: <strong>${formatINR(order.grandTotal)}</strong></span>
        </div>

        <div class="order-actions-bar">
          ${!isCancelled ? `
            <button 
              type="button" 
              class="btn-cancel-order" 
              data-id="${order.orderId}">
              Cancel Order
            </button>
          ` : `
            <span class="cancelled-note">Order cancelled on demo request</span>
          `}
          <a href="#productGrid" class="btn-buy-more">Buy More Gear ➔</a>
        </div>
      </article>
    `;
  }).join('');

  feedEl.querySelectorAll('.btn-cancel-order').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.id;
      if (!confirm(`Are you sure you want to cancel order #${orderId}?`)) return;

      try {
        await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      } catch {
        // offline fallback
      }

      try {
        const local = JSON.parse(localStorage.getItem('myntra_orders') || '[]');
        const target = local.find(o => o.orderId === orderId);
        if (target) {
          target.status = 'Cancelled';
          localStorage.setItem('myntra_orders', JSON.stringify(local));
        }
      } catch {}

      showToast(`Order #${orderId} has been cancelled`);
      fetchHomeOrders();
    });
  });
}

function setupFiltersAndSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value.trim();
        loadProductsFromBackend();
      }, 250);
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadProductsFromBackend();
    });
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      activeCategory = link.dataset.navCat;
      renderCategoryPills();
      syncNavLinks();
      loadProductsFromBackend();
    });
  });

  const checkPinBtn = document.querySelector('.btn-check-pin');
  if (checkPinBtn) {
    checkPinBtn.addEventListener('click', () => {
      const pin = prompt('Enter delivery pincode:', '400001');
      if (pin && pin.trim().length === 6) {
        document.querySelector('.pincode-header strong').textContent = `${pin.trim()} (Custom)`;
        showToast(`Delivery pincode set to ${pin.trim()}`);
      }
    });
  }
}

function showToast(message, type = 'info') {
  const shelf = document.getElementById('toastShelf');
  const toast = document.createElement('div');
  toast.className = `toast-msg ${type === 'success' ? 'success' : ''}`;
  toast.innerHTML = message;

  shelf.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}

// bootstrap application on load
document.addEventListener('DOMContentLoaded', () => {
  renderCategoryPills();
  updateWishlistUI();
  setupFiltersAndSearch();
  loadProductsFromBackend();
  renderCart();
  setupCheckoutModal();
  fetchHomeOrders();
});
