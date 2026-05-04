// ===== DS STORE BD — ADMIN PANEL JS =====
const API = 'https://ds-shop-bd-backend.onrender.com/api';
let adminUser = JSON.parse(localStorage.getItem('dsAdmin')) || null;
let allOrders = [], allProducts = [], allUsers = [], allSliders = [];
let currentSettings = {};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  if (adminUser?.token && adminUser?.role === 'admin') {
    showDashboard();
  }
  startClock();
});

function startClock() {
  setInterval(() => {
    const now = new Date();
    const t = document.getElementById('topbarTime');
    if (t) t.textContent = now.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
  }, 1000);
}

// ===== API =====
async function api(endpoint, method = 'GET', data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminUser?.token}` }
  };
  if (data) opts.body = JSON.stringify(data);
  try {
    const res = await fetch(API + endpoint, opts);
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ===== LOGIN =====
async function adminLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const msg = document.getElementById('loginMsg');
  btn.innerHTML = '<span>Authenticating...</span>';
  btn.disabled = true;

  const result = await api('/auth/login', 'POST', {
    email: document.getElementById('adminEmail').value,
    password: document.getElementById('adminPass').value
  });

  btn.innerHTML = '<span>Access Dashboard</span><span class="arrow">→</span>';
  btn.disabled = false;

  if (result?.token && result?.role === 'admin') {
    adminUser = result;
    localStorage.setItem('dsAdmin', JSON.stringify(adminUser));
    showDashboard();
  } else if (result?.role === 'user') {
    msg.textContent = 'Access denied. Admin accounts only.';
    msg.className = 'login-msg error';
  } else {
    msg.textContent = result?.message || 'Invalid email or password.';
    msg.className = 'login-msg error';
  }
}

function showDashboard() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminWrap').style.display = 'flex';
  document.getElementById('userName').textContent = adminUser.name || 'Admin';
  document.getElementById('userAvatar').textContent = (adminUser.name || 'A')[0].toUpperCase();
  document.getElementById('welcomeName').textContent = adminUser.name?.split(' ')[0] || 'Admin';
  loadDashboard();
}

function adminLogout() {
  confirmAction('Are you sure you want to logout?', () => {
    localStorage.removeItem('dsAdmin');
    adminUser = null;
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('adminWrap').style.display = 'none';
  });
}

// ===== NAVIGATION =====
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick')?.includes(page)) n.classList.add('active');
  });
  document.getElementById('pageTitle').textContent = page.charAt(0).toUpperCase() + page.slice(1);

  const loaders = { orders: loadOrders, products: loadProducts, users: loadUsers, slider: loadSliders, settings: loadSettings, payment: loadPaymentSettings };
  if (loaders[page]) loaders[page]();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('open');
  sb.classList.toggle('hidden');
}

// ===== DASHBOARD =====
async function loadDashboard() {
  const stats = await api('/dashboard/stats');
  if (stats) {
    animateNum('st-orders', stats.totalOrders || 0);
    animateNum('st-revenue', stats.totalRevenue || 0, '৳');
    animateNum('st-pending', stats.pendingOrders || 0);
    animateNum('st-products', stats.totalProducts || 0);
    animateNum('st-users', stats.totalUsers || 0);
    animateNum('st-delivered', stats.deliveredOrders || 0);

    const badge = document.getElementById('pendingBadge');
    if (stats.pendingOrders > 0) {
      badge.textContent = stats.pendingOrders;
      badge.classList.add('show');
    }

    if (stats.recentOrders?.length) {
      renderRecentOrders(stats.recentOrders);
    }
  }
}
function animateNum(id, target, prefix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = target / 40;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = prefix + Math.floor(current).toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 30);
}
function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersBody');
  tbody.innerHTML = orders.slice(0, 5).map(o => `
    <tr>
      <td style="color:var(--gold);font-weight:500">#${o._id.slice(-6).toUpperCase()}</td>
      <td>${o.customerName}</td>
      <td style="color:var(--gold)">৳${o.totalAmount}</td>
      <td><span class="badge badge-${o.paymentStatus === 'paid' ? 'paid' : 'unpaid'}">${o.paymentMethod?.toUpperCase()}</span></td>
      <td><span class="badge badge-${o.status}">${o.status.toUpperCase()}</span></td>
      <td><button class="btn-sm btn-view" onclick="viewOrder('${o._id}')">View</button></td>
    </tr>
  `).join('');
}

// ===== ORDERS =====
async function loadOrders() {
  document.getElementById('ordersBody').innerHTML = '<tr><td colspan="9" class="loading-row">Loading orders...</td></tr>';
  const data = await api('/orders');
  allOrders = Array.isArray(data) ? data : [];
  renderOrders(allOrders);
}
function renderOrders(orders) {
  const tbody = document.getElementById('ordersBody');
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="loading-row">No orders found</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td style="color:var(--gold);font-weight:500">#${o._id.slice(-6).toUpperCase()}</td>
      <td>
        <div style="font-weight:500">${o.customerName}</div>
        <div style="font-size:11px;color:var(--gray)">${o.address?.slice(0,30)}...</div>
      </td>
      <td>${o.customerPhone}</td>
      <td style="font-size:12px;color:var(--gray)">${o.items?.length || 0} items</td>
      <td style="color:var(--gold);font-weight:500">৳${o.totalAmount}</td>
      <td>
        <span class="badge badge-${o.paymentStatus === 'paid' ? 'paid' : 'unpaid'}">${o.paymentMethod?.toUpperCase()}</span>
        ${o.transactionId ? `<div style="font-size:10px;color:var(--gray);margin-top:4px">TXN: ${o.transactionId}</div>` : ''}
      </td>
      <td>
        <select class="status-select" onchange="updateOrderStatus('${o._id}', this.value)">
          ${['pending','confirmed','processing','shipped','delivered','cancelled'].map(s =>
            `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
          ).join('')}
        </select>
      </td>
      <td style="font-size:11px;color:var(--gray)">${new Date(o.createdAt).toLocaleDateString('en-BD')}</td>
      <td>
        <div class="action-btns">
          <button class="btn-sm btn-view" onclick="viewOrder('${o._id}')">View</button>
          <button class="btn-sm btn-delete" onclick="deleteOrder('${o._id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}
function filterOrders() {
  const val = document.getElementById('orderFilter').value;
  const filtered = val ? allOrders.filter(o => o.status === val) : allOrders;
  renderOrders(filtered);
}
async function updateOrderStatus(id, status) {
  const result = await api(`/orders/${id}/status`, 'PUT', { status });
  if (result?._id) showToast('Order status updated!', 'success');
  else showToast('Update failed', 'error');
}
function viewOrder(id) {
  const o = allOrders.find(x => x._id === id);
  if (!o) return;
  document.getElementById('orderDetailContent').innerHTML = `
    <div class="order-detail-grid">
      <div class="detail-section">
        <h4>Customer Info</h4>
        <div class="detail-row"><span>Name</span><span>${o.customerName}</span></div>
        <div class="detail-row"><span>Phone</span><span>${o.customerPhone}</span></div>
        <div class="detail-row"><span>Email</span><span>${o.customerEmail || 'N/A'}</span></div>
        <div class="detail-row"><span>Address</span><span style="max-width:200px;text-align:right">${o.address}</span></div>
        ${o.note ? `<div class="detail-row"><span>Note</span><span>${o.note}</span></div>` : ''}
      </div>
      <div class="detail-section">
        <h4>Payment Info</h4>
        <div class="detail-row"><span>Method</span><span style="text-transform:uppercase">${o.paymentMethod}</span></div>
        <div class="detail-row"><span>Status</span><span class="badge badge-${o.paymentStatus === 'paid' ? 'paid' : 'unpaid'}">${o.paymentStatus?.toUpperCase()}</span></div>
        ${o.transactionId ? `<div class="detail-row"><span>TXN ID</span><span>${o.transactionId}</span></div>` : ''}
        ${o.paymentNumber ? `<div class="detail-row"><span>Pay Number</span><span>${o.paymentNumber}</span></div>` : ''}
        <div class="detail-row"><span>Total</span><span style="color:var(--gold);font-size:18px;font-family:var(--font-display)">৳${o.totalAmount}</span></div>
      </div>
    </div>
    <div style="padding:20px">
      <div class="detail-section">
        <h4>Order Items (${o.items?.length || 0})</h4>
        <div class="order-items-list">
          ${o.items?.map(item => `
            <div class="order-item-row">
              <span>${item.productName} ${item.customText ? `<span style="color:var(--gold)">(${item.customText})</span>` : ''} x${item.quantity}</span>
              <span style="color:var(--gold)">৳${item.price * item.quantity}</span>
            </div>
          `).join('') || 'No items'}
        </div>
      </div>
    </div>
    <div class="status-update-row">
      <span style="color:var(--gray);font-size:12px">Update Status:</span>
      <select class="status-select" id="modalStatusSelect">
        ${['pending','confirmed','processing','shipped','delivered','cancelled'].map(s =>
          `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
        ).join('')}
      </select>
      <select class="status-select" id="modalPayStatus">
        ${['pending','paid','failed'].map(s =>
          `<option value="${s}" ${o.paymentStatus === s ? 'selected' : ''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
        ).join('')}
      </select>
      <button class="btn-gold" onclick="updateFromModal('${o._id}')">Update →</button>
    </div>
  `;
  openModal('orderModal');
}
async function updateFromModal(id) {
  const status = document.getElementById('modalStatusSelect').value;
  const paymentStatus = document.getElementById('modalPayStatus').value;
  await api(`/orders/${id}/status`, 'PUT', { status, paymentStatus });
  closeModal('orderModal');
  showToast('Order updated!', 'success');
  loadOrders();
}
async function deleteOrder(id) {
  confirmAction('Delete this order permanently?', async () => {
    await api(`/orders/${id}`, 'DELETE');
    showToast('Order deleted', 'success');
    loadOrders();
  });
}

// ===== PRODUCTS =====
async function loadProducts() {
  document.getElementById('productsBody').innerHTML = '<tr><td colspan="7" class="loading-row">Loading products...</td></tr>';
  const data = await api('/products/admin/all');
  allProducts = Array.isArray(data) ? data : [];
  renderProducts(allProducts);
}
function getCatEmoji(cat) {
  return { tshirt:'👕', mug:'☕', hoodie:'🧥', polo:'👔', other:'🛍️' }[cat] || '🛍️';
}
function renderProducts(products) {
  const tbody = document.getElementById('productsBody');
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No products found</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div class="product-thumb">
          ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}">` : getCatEmoji(p.category)}
        </div>
      </td>
      <td>
        <div style="font-weight:500">${p.name}</div>
        ${p.isCustomizable ? '<div style="font-size:10px;color:var(--gold);margin-top:2px">✦ Customizable</div>' : ''}
      </td>
      <td><span style="text-transform:capitalize;color:var(--gray)">${p.category}</span></td>
      <td style="color:var(--gold);font-weight:500">৳${p.price}</td>
      <td>${p.stock || 0}</td>
      <td><span class="badge badge-${p.isActive ? 'active' : 'inactive'}">${p.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-sm btn-edit" onclick="editProduct('${p._id}')">Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteProduct('${p._id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}
function openProductForm(id = null) {
  document.getElementById('productModalTitle').textContent = id ? 'Edit Product' : 'Add Product';
  document.getElementById('productForm').reset();
  document.getElementById('p-id').value = '';
  if (!id) { openModal('productModal'); return; }
  const p = allProducts.find(x => x._id === id);
  if (!p) return;
  document.getElementById('p-id').value = p._id;
  document.getElementById('p-name').value = p.name || '';
  document.getElementById('p-category').value = p.category || '';
  document.getElementById('p-price').value = p.price || '';
  document.getElementById('p-stock').value = p.stock || '';
  document.getElementById('p-desc').value = p.description || '';
  document.getElementById('p-colors').value = p.colors?.join(', ') || '';
  document.getElementById('p-sizes').value = p.sizes?.join(', ') || '';
  document.getElementById('p-image').value = p.images?.[0] || '';
  document.getElementById('p-custom').value = p.isCustomizable ? 'true' : 'false';
  document.getElementById('p-active').value = p.isActive ? 'true' : 'false';
  openModal('productModal');
}
function editProduct(id) { openProductForm(id); }
async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('p-id').value;
  const data = {
    name: document.getElementById('p-name').value,
    category: document.getElementById('p-category').value,
    price: Number(document.getElementById('p-price').value),
    stock: Number(document.getElementById('p-stock').value) || 100,
    description: document.getElementById('p-desc').value,
    colors: document.getElementById('p-colors').value.split(',').map(s => s.trim()).filter(Boolean),
    sizes: document.getElementById('p-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
    images: document.getElementById('p-image').value ? [document.getElementById('p-image').value] : [],
    isCustomizable: document.getElementById('p-custom').value === 'true',
    isActive: document.getElementById('p-active').value === 'true'
  };
  const result = id ? await api(`/products/${id}`, 'PUT', data) : await api('/products', 'POST', data);
  if (result?._id) {
    closeModal('productModal');
    showToast(id ? 'Product updated!' : 'Product added!', 'success');
    loadProducts();
  } else { showToast('Save failed', 'error'); }
}
async function deleteProduct(id) {
  confirmAction('Delete this product permanently?', async () => {
    await api(`/products/${id}`, 'DELETE');
    showToast('Product deleted', 'success');
    loadProducts();
  });
}

// ===== USERS =====
async function loadUsers() {
  document.getElementById('usersBody').innerHTML = '<tr><td colspan="7" class="loading-row">Loading users...</td></tr>';
  const data = await api('/auth/users');
  allUsers = Array.isArray(data) ? data : [];
  const tbody = document.getElementById('usersBody');
  if (!allUsers.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No users found</td></tr>';
    return;
  }
  tbody.innerHTML = allUsers.map(u => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dark),var(--gold));display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--black);font-size:13px">${u.name?.[0]?.toUpperCase() || 'U'}</div>
          <span>${u.name}</span>
        </div>
      </td>
      <td style="color:var(--gray)">${u.email}</td>
      <td style="color:var(--gray)">${u.phone || 'N/A'}</td>
      <td><span class="badge badge-${u.role}">${u.role?.toUpperCase()}</span></td>
      <td><span class="badge badge-${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'ACTIVE' : 'BLOCKED'}</span></td>
      <td style="color:var(--gray);font-size:12px">${new Date(u.createdAt).toLocaleDateString('en-BD')}</td>
      <td>
        ${u._id !== adminUser._id ? `<button class="btn-sm ${u.isActive ? 'btn-delete' : 'btn-edit'}" onclick="toggleUser('${u._id}')">${u.isActive ? 'Block' : 'Unblock'}</button>` : '<span style="color:var(--gray);font-size:11px">You</span>'}
      </td>
    </tr>
  `).join('');
}
async function toggleUser(id) {
  await api(`/auth/users/${id}/toggle`, 'PUT');
  showToast('User status updated', 'success');
  loadUsers();
}

// ===== SLIDER =====
async function loadSliders() {
  const data = await api('/slider/admin/all');
  allSliders = Array.isArray(data) ? data : [];
  const grid = document.getElementById('sliderGrid');
  if (!allSliders.length) {
    grid.innerHTML = '<div class="loading-row">No slides found. Add your first slide!</div>';
    return;
  }
  grid.innerHTML = allSliders.map(s => `
    <div class="slider-card">
      <div class="slider-img">
        ${s.image ? `<img src="${s.image}" alt="${s.title || 'Slide'}">` : '🖼️'}
      </div>
      <div class="slider-info">
        <div class="slider-title">${s.title || 'Untitled Slide'}</div>
        <div style="font-size:12px;color:var(--gray)">${s.subtitle || ''}</div>
        <div style="margin-top:8px"><span class="badge badge-${s.isActive ? 'active' : 'inactive'}">${s.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div>
        <div class="slider-actions">
          <button class="btn-sm btn-edit" onclick="editSlider('${s._id}')">Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteSlider('${s._id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}
function openSliderForm() {
  document.getElementById('sliderModalTitle').textContent = 'Add Slide';
  document.querySelector('#sliderModal form').reset();
  document.getElementById('sl-id').value = '';
  openModal('sliderModal');
}
function editSlider(id) {
  const s = allSliders.find(x => x._id === id);
  if (!s) return;
  document.getElementById('sliderModalTitle').textContent = 'Edit Slide';
  document.getElementById('sl-id').value = s._id;
  document.getElementById('sl-image').value = s.image || '';
  document.getElementById('sl-title').value = s.title || '';
  document.getElementById('sl-subtitle').value = s.subtitle || '';
  document.getElementById('sl-link').value = s.link || '';
  document.getElementById('sl-order').value = s.order || 0;
  document.getElementById('sl-active').value = s.isActive ? 'true' : 'false';
  openModal('sliderModal');
}
async function saveSlider(e) {
  e.preventDefault();
  const id = document.getElementById('sl-id').value;
  const data = {
    image: document.getElementById('sl-image').value,
    title: document.getElementById('sl-title').value,
    subtitle: document.getElementById('sl-subtitle').value,
    link: document.getElementById('sl-link').value,
    order: Number(document.getElementById('sl-order').value) || 0,
    isActive: document.getElementById('sl-active').value === 'true'
  };
  const result = id ? await api(`/slider/${id}`, 'PUT', data) : await api('/slider', 'POST', data);
  if (result?._id) {
    closeModal('sliderModal');
    showToast(id ? 'Slide updated!' : 'Slide added!', 'success');
    loadSliders();
  } else { showToast('Save failed', 'error'); }
}
async function deleteSlider(id) {
  confirmAction('Delete this slide?', async () => {
    await api(`/slider/${id}`, 'DELETE');
    showToast('Slide deleted', 'success');
    loadSliders();
  });
}

// ===== SETTINGS =====
async function loadSettings() {
  const data = await api('/settings');
  if (data) {
    currentSettings = data;
    document.getElementById('s-shopName').value = data.shopName || '';
    document.getElementById('s-phone').value = data.contactPhone || '';
    document.getElementById('s-email').value = data.contactEmail || '';
    document.getElementById('s-address').value = data.address || '';
    document.getElementById('s-delivery').value = data.deliveryCharge || 60;
    document.getElementById('s-freeDelivery').value = data.freeDeliveryAbove || 1000;
    document.getElementById('s-facebook').value = data.socialFacebook || '';
    document.getElementById('s-whatsapp').value = data.socialWhatsapp || '';
    document.getElementById('s-instagram').value = data.socialInstagram || '';
  }
}
async function saveSettings(e) {
  e.preventDefault();
  const data = {
    shopName: document.getElementById('s-shopName').value,
    contactPhone: document.getElementById('s-phone').value,
    contactEmail: document.getElementById('s-email').value,
    address: document.getElementById('s-address').value,
    deliveryCharge: Number(document.getElementById('s-delivery').value),
    freeDeliveryAbove: Number(document.getElementById('s-freeDelivery').value)
  };
  const result = await api('/settings', 'PUT', data);
  if (result?._id || result?.shopName) showToast('Settings saved!', 'success');
  else showToast('Save failed', 'error');
}
async function saveSocial(e) {
  e.preventDefault();
  const data = {
    socialFacebook: document.getElementById('s-facebook').value,
    socialWhatsapp: document.getElementById('s-whatsapp').value,
    socialInstagram: document.getElementById('s-instagram').value,
  };
  const result = await api('/settings', 'PUT', data);
  if (result) showToast('Social links saved!', 'success');
  else showToast('Save failed', 'error');
}

// ===== PAYMENT SETTINGS =====
async function loadPaymentSettings() {
  const data = await api('/settings');
  if (data) {
    document.getElementById('p-bkash').value = data.bkashNumber || '';
    document.getElementById('p-bkashInstr').value = data.bkashInstructions || '';
    document.getElementById('p-nagad').value = data.nagadNumber || '';
    document.getElementById('p-nagadInstr').value = data.nagadInstructions || '';
    document.getElementById('p-rocket').value = data.rocketNumber || '';
    document.getElementById('p-rocketInstr').value = data.rocketInstructions || '';
  }
}
async function savePayment(e, method) {
  e.preventDefault();
  const data = {};
  data[method + 'Number'] = document.getElementById(`p-${method}`).value;
  data[method + 'Instructions'] = document.getElementById(`p-${method}Instr`).value;
  const result = await api('/settings', 'PUT', data);
  if (result) showToast(`${method.charAt(0).toUpperCase()+method.slice(1)} settings saved!`, 'success');
  else showToast('Save failed', 'error');
}

// ===== MODAL HELPERS =====
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function confirmAction(msg, callback) {
  document.getElementById('confirmMsg').textContent = msg;
  const btn = document.getElementById('confirmBtn');
  btn.onclick = () => { callback(); closeModal('confirmModal'); };
  openModal('confirmModal');
}

// ===== TOAST =====
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 3000);
}
