let allOrders = [];
let currentFilter = 'all';

const formatINR = (val) => {
  return Number(val).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
};

const formatDate = (isoString) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
};

// fetch all placed orders from backend api
async function fetchOrders() {
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
    // backend offline
  }

  let localOrders = [];
  try {
    const local = localStorage.getItem('myntra_orders');
    localOrders = local ? JSON.parse(local) : [];
  } catch {
    localOrders = [];
  }

  // merge by orderId so offline & online orders both display
  const mergedMap = new Map();
  serverOrders.forEach(o => mergedMap.set(o.orderId, o));
  localOrders.forEach(o => {
    if (!mergedMap.has(o.orderId)) {
      mergedMap.set(o.orderId, o);
    }
  });

  allOrders = Array.from(mergedMap.values());
  renderOrders();
}

// cancel demo order via backend api
async function cancelOrder(orderId) {
  if (!confirm(`Are you sure you want to cancel order #${orderId}?`)) return;

  try {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        showToast(`Order #${orderId} has been cancelled`);
        fetchOrders();
        return;
      }
    }
  } catch {
    // offline fallback
  }

  // update local cache state if offline
  const target = allOrders.find(o => o.orderId === orderId);
  if (target) {
    target.status = 'Cancelled';
    localStorage.setItem('myntra_orders', JSON.stringify(allOrders));
    showToast(`Order #${orderId} marked as cancelled`);
    renderOrders();
  }
}

function renderOrders() {
  const feed = document.getElementById('ordersFeed');
  const emptyView = document.getElementById('emptyOrdersView');
  const countBadge = document.getElementById('ordersCountBadge');

  if (countBadge) countBadge.textContent = allOrders.length;

  const filtered = currentFilter === 'all'
    ? allOrders
    : allOrders.filter(o => o.status === currentFilter);

  if (filtered.length === 0) {
    feed.innerHTML = '';
    emptyView.hidden = false;
    return;
  }

  emptyView.hidden = true;

  feed.innerHTML = filtered.map(order => {
    const isCancelled = order.status === 'Cancelled';
    const statusClass = isCancelled ? 'status-cancelled' : 'status-confirmed';
    const statusText = isCancelled ? '● Cancelled' : '● Confirmed';

    return `
      <article class="order-card">
        <!-- Order Header Bar -->
        <div class="order-card-header">
          <div class="order-meta-info">
            <span class="order-id-tag">ORDER #${order.orderId}</span>
            <span class="order-timestamp">Placed on ${formatDate(order.createdAt)}</span>
          </div>
          <div class="order-status-group">
            <span class="order-status-pill ${statusClass}">${statusText}</span>
            <span class="order-total-price">${formatINR(order.grandTotal)}</span>
          </div>
        </div>

        <!-- Delivery Status Banner -->
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

        <!-- Itemized Products List -->
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

        <!-- Bill Details Bar -->
        <div class="order-bill-summary">
          <span>Items: <strong>${order.totalItems}</strong></span>
          <span>Delivery: <strong>${order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}</strong></span>
          <span>Payment: <strong>${order.paymentMethod || 'Demo Pay'}</strong></span>
          <span class="total-tag">Paid: <strong>${formatINR(order.grandTotal)}</strong></span>
        </div>

        <!-- Action Buttons -->
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
          <a href="index.html" class="btn-buy-more">Buy Again ➔</a>
        </div>
      </article>
    `;
  }).join('');

  feed.querySelectorAll('.btn-cancel-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.dataset.id;
      cancelOrder(orderId);
    });
  });
}

function setupFilterChips() {
  const chips = document.querySelectorAll('.order-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderOrders();
    });
  });
}

function showToast(message, type = 'info') {
  const shelf = document.getElementById('toastShelf');
  if (!shelf) return;
  const toast = document.createElement('div');
  toast.className = `toast-msg ${type === 'success' ? 'success' : ''}`;
  toast.textContent = message;

  shelf.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 2800);
}

// bootstrap orders page
document.addEventListener('DOMContentLoaded', () => {
  setupFilterChips();
  fetchOrders();
});
