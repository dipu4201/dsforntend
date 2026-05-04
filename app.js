// ===== DS STORE BD — APP.JS =====
const API_URL = 'https://ds-shop-bd-backend.onrender.com/api';

// STATE
let cart = JSON.parse(localStorage.getItem('dsCart')) || [];
let user = JSON.parse(localStorage.getItem('dsUser')) || null;
let products = [];
let settings = {};
let currentOrder = [];
let deliveryCharge = 60;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initCursor();
  initNavbar();
  loadSettings();
  loadProducts();
  updateCartUI();
  if (user) updateAuthUI();
});

// ===== LOADER =====
function initLoader() {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    initAnimations();
  }, 2500);
}

// ===== CURSOR =====
function initCursor() {
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  let fx = 0, fy = 0, lx = 0, ly = 0;
  document.addEventListener('mousemove', e => {
    fx = e.clientX; fy = e.clientY;
    cursor.style.left = fx - 4 + 'px';
    cursor.style.top = fy - 4 + 'px';
  });
  function animateFollower() {
    lx += (fx - lx) * 0.12;
    ly += (fy - ly) * 0.12;
    follower.style.left = lx - 15 + 'px';
    follower.style.top = ly - 15 + 'px';
    requestAnimationFrame(animateFollower);
  }
  animateFollower();
  document.querySelectorAll('a,button,.cat-card,.product-card,.color-swatch').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'scale(2)';
      follower.style.transform = 'scale(1.5)';
      follower.style.opacity = '0.8';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'scale(1)';
      follower.style.transform = 'scale(1)';
      follower.style.opacity = '0.5';
    });
  });
}

// ===== NAVBAR =====
function initNavbar() {
  window.addEventListener('scroll', () => {
    const nb = document.getElementById('navbar');
    nb.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveNav();
  });
}
function updateActiveNav() {
  const sections = ['home','shop','design','about','contact'];
  let current = 'home';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 100) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
}
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('active');
  document.getElementById('hamburger').classList.toggle('active');
}

// ===== ANIMATIONS =====
function initAnimations() {
  // Counter animation
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); }
      else el.textContent = Math.floor(current).toLocaleString();
    }, 30);
  });
  // Scroll reveal
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.cat-card, .product-card, .payment-card, .about-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`;
    observer.observe(el);
  });
}

// ===== API CALLS =====
async function apiCall(endpoint, method = 'GET', data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (user?.token) opts.headers['Authorization'] = `Bearer ${user.token}`;
  if (data) opts.body = JSON.stringify(data);
  try {
    const res = await fetch(API_URL + endpoint, opts);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return null;
  }
}

// ===== LOAD SETTINGS =====
async function loadSettings() {
  const data = await apiCall('/settings');
  if (data) {
    settings = data;
    deliveryCharge = data.deliveryCharge || 60;
    document.getElementById('contactPhone').textContent = data.contactPhone || 'Contact via social media';
    document.getElementById('contactEmail').textContent = data.contactEmail || 'info@dsshopbd.com';
    document.getElementById('contactAddress').textContent = data.address || 'Bangladesh';
  }
  // Load payment info
  const payment = await apiCall('/payment/info');
  if (payment) {
    document.getElementById('bkashNumber').textContent = payment.bkash?.number || 'N/A';
    document.getElementById('nagadNumber').textContent = payment.nagad?.number || 'N/A';
    document.getElementById('rocketNumber').textContent = payment.rocket?.number || 'N/A';
  }
}

// ===== LOAD PRODUCTS =====
async function loadProducts() {
  const data = await apiCall('/products');
  if (data && Array.isArray(data)) {
    products = data;
    renderProducts(products);
  } else {
    renderDemoProducts();
  }
}
function renderDemoProducts() {
  products = [
    { _id: '1', name: 'Premium Custom T-Shirt', price: 450, category: 'tshirt', isCustomizable: true },
    { _id: '2', name: 'Personalized Mug', price: 280, category: 'mug', isCustomizable: true },
    { _id: '3', name: 'Premium Hoodie', price: 850, category: 'hoodie', isCustomizable: true },
    { _id: '4', name: 'Business Polo Shirt', price: 550, category: 'polo', isCustomizable: false },
    { _id: '5', name: 'Custom Name Mug', price: 320, category: 'mug', isCustomizable: true },
    { _id: '6', name: 'Graphic T-Shirt', price: 380, category: 'tshirt', isCustomizable: true },
    { _id: '7', name: 'Oversized Hoodie', price: 950, category: 'hoodie', isCustomizable: true },
    { _id: '8', name: 'Classic Polo', price: 480, category: 'polo', isCustomizable: false },
  ];
  renderProducts(products);
}
function getCategoryEmoji(cat) {
  const map = { tshirt: '👕', mug: '☕', hoodie: '🧥', polo: '👔', other: '🛍️' };
  return map[cat] || '🛍️';
}
function renderProducts(list) {
  const grid = document.getElementById('productsGrid');
  if (!list.length) {
    grid.innerHTML = '<div class="loading-products"><p style="color:var(--gray)">No products found</p></div>';
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="product-card" onclick="openProduct('${p._id}')">
      <div class="product-img">
        ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}">` : `<span>${getCategoryEmoji(p.category)}</span>`}
        ${p.isCustomizable ? '<div class="product-badge">CUSTOMIZABLE</div>' : ''}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">৳${p.price}</div>
      </div>
      <div class="product-actions" onclick="event.stopPropagation()">
        <button class="btn-cart" onclick="addToCart('${p._id}')">Add to Cart</button>
        <button class="btn-buy" onclick="buyNow('${p._id}')">Buy Now</button>
      </div>
    </div>
  `).join('');
  setTimeout(initAnimations, 100);
}
function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const filtered = cat === 'all' ? products : products.filter(p => p.category === cat);
  renderProducts(filtered);
}

// ===== PRODUCT MODAL =====
function openProduct(id) {
  const p = products.find(x => x._id === id);
  if (!p) return;
  const content = document.getElementById('productModalContent');
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start">
      <div class="product-img" style="aspect-ratio:1;font-size:100px;background:var(--black3)">
        ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">` : getCategoryEmoji(p.category)}
      </div>
      <div>
        <p class="section-tag">✦ ${p.category?.toUpperCase()}</p>
        <h2 style="font-family:var(--font-display);font-size:36px;letter-spacing:2px;margin-bottom:16px">${p.name}</h2>
        <div style="font-family:var(--font-display);font-size:40px;color:var(--gold);margin-bottom:20px">৳${p.price}</div>
        <p style="color:var(--gray);line-height:1.8;margin-bottom:24px">${p.description || 'Premium quality product. Customize and make it yours!'}</p>
        ${p.colors?.length ? `
          <div style="margin-bottom:20px">
            <p style="font-size:11px;letter-spacing:2px;color:var(--gold);margin-bottom:10px">COLORS</p>
            <div style="display:flex;gap:8px">
              ${p.colors.map(c => `<div style="width:28px;height:28px;background:${c};border-radius:50%;border:2px solid var(--black3);cursor:pointer"></div>`).join('')}
            </div>
          </div>
        ` : ''}
        ${p.sizes?.length ? `
          <div style="margin-bottom:24px">
            <p style="font-size:11px;letter-spacing:2px;color:var(--gold);margin-bottom:10px">SIZES</p>
            <div style="display:flex;gap:8px">
              ${p.sizes.map(s => `<button onclick="selectSize(this,'${s}')" style="padding:8px 16px;background:var(--black3);border:1px solid var(--black4);color:var(--white);cursor:pointer;font-family:var(--font-body);transition:all 0.3s" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="if(!this.classList.contains('selected'))this.style.borderColor='var(--black4)'">${s}</button>`).join('')}
            </div>
          </div>
        ` : ''}
        ${p.isCustomizable ? `
          <div style="background:var(--black3);padding:20px;margin-bottom:24px;border:1px solid rgba(201,168,76,0.1)">
            <p style="font-size:11px;letter-spacing:2px;color:var(--gold);margin-bottom:12px">✦ CUSTOM TEXT</p>
            <input type="text" id="customText_${p._id}" placeholder="Enter your custom text or name..." maxlength="30" style="width:100%;background:var(--black2);border:1px solid var(--black4);color:var(--white);padding:12px 16px;font-family:var(--font-body);font-size:14px">
          </div>
        ` : ''}
        <div style="display:flex;gap:12px">
          <button class="btn-cart" style="flex:1;padding:14px" onclick="addToCart('${p._id}');closeModal('productModal')">Add to Cart</button>
          <button class="btn-buy" style="flex:1;padding:14px" onclick="buyNow('${p._id}');closeModal('productModal')">Buy Now</button>
        </div>
      </div>
    </div>
  `;
  openModal('productModal');
}
function selectSize(btn, size) {
  btn.closest('.modal').querySelectorAll('[onclick^="selectSize"]').forEach(b => {
    b.classList.remove('selected');
    b.style.borderColor = 'var(--black4)';
    b.style.color = 'var(--white)';
  });
  btn.classList.add('selected');
  btn.style.borderColor = 'var(--gold)';
  btn.style.color = 'var(--gold)';
}

// ===== CART =====
function addToCart(productId) {
  const p = products.find(x => x._id === productId);
  if (!p) return;
  const customText = document.getElementById(`customText_${productId}`)?.value || '';
  const existing = cart.find(i => i._id === productId && i.customText === customText);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cart.push({ ...p, qty: 1, customText });
  saveCart();
  updateCartUI();
  showToast(`✦ ${p.name} added to cart`, 'gold');
}
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  renderCartItems();
}
function saveCart() { localStorage.setItem('dsCart', JSON.stringify(cart)); }
function updateCartUI() {
  const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
  document.getElementById('cartCount').textContent = count;
}
function renderCartItems() {
  const el = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  if (!cart.length) {
    el.innerHTML = '<div class="empty-cart"><span>🛒</span><p>Your cart is empty</p></div>';
    footer.style.display = 'none';
    return;
  }
  footer.style.display = 'block';
  let total = 0;
  el.innerHTML = cart.map((item, i) => {
    const subtotal = item.price * (item.qty || 1);
    total += subtotal;
    return `
      <div class="cart-item">
        <div class="cart-item-img">${getCategoryEmoji(item.category)}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          ${item.customText ? `<div style="font-size:11px;color:var(--gray)">Text: ${item.customText}</div>` : ''}
          <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
            <div class="cart-item-price">৳${subtotal}</div>
            <div style="display:flex;align-items:center;gap:8px">
              <button onclick="changeQty(${i},-1)" style="background:var(--black3);border:none;color:var(--white);width:22px;height:22px;cursor:pointer;font-size:14px">-</button>
              <span style="font-size:13px">${item.qty || 1}</span>
              <button onclick="changeQty(${i},1)" style="background:var(--black3);border:none;color:var(--white);width:22px;height:22px;cursor:pointer;font-size:14px">+</button>
            </div>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${i})">✕</button>
      </div>
    `;
  }).join('');
  document.getElementById('cartTotal').textContent = `৳${total}`;
}
function changeQty(index, delta) {
  cart[index].qty = Math.max(1, (cart[index].qty || 1) + delta);
  saveCart();
  updateCartUI();
  renderCartItems();
}
function openCart() {
  document.getElementById('cartSidebar').classList.add('active');
  document.getElementById('cartOverlay').classList.add('active');
  renderCartItems();
}
function closeCart() {
  document.getElementById('cartSidebar').classList.remove('active');
  document.getElementById('cartOverlay').classList.remove('active');
}
function proceedToCheckout() {
  closeCart();
  if (!cart.length) return showToast('Your cart is empty');
  currentOrder = [...cart];
  openOrderModal();
}
function buyNow(productId) {
  const p = products.find(x => x._id === productId);
  if (!p) return;
  const customText = document.getElementById(`customText_${productId}`)?.value || '';
  currentOrder = [{ ...p, qty: 1, customText }];
  openOrderModal();
}

// ===== ORDER MODAL =====
function openOrderModal() {
  const itemsList = document.getElementById('orderItemsList');
  let subtotal = 0;
  itemsList.innerHTML = currentOrder.map(item => {
    const s = item.price * (item.qty || 1);
    subtotal += s;
    return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--black4);font-size:13px;color:var(--gray)"><span>${item.name} x${item.qty || 1}</span><span style="color:var(--white)">৳${s}</span></div>`;
  }).join('');
  const total = subtotal + deliveryCharge;
  document.getElementById('orderSubtotal').textContent = `৳${subtotal}`;
  document.getElementById('orderDelivery').textContent = `৳${deliveryCharge}`;
  document.getElementById('orderTotal').textContent = `৳${total}`;
  // Pre-fill if logged in
  if (user) {
    document.getElementById('orderName').value = user.name || '';
    document.getElementById('orderPhone').value = user.phone || '';
    document.getElementById('orderEmail').value = user.email || '';
    document.getElementById('orderAddress').value = user.address || '';
  }
  // Payment method change
  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', updatePaymentInstructions);
  });
  openModal('orderModal');
}
function updatePaymentInstructions() {
  const method = document.querySelector('input[name="payment"]:checked')?.value;
  const instrEl = document.getElementById('paymentInstructions');
  const transEl = document.getElementById('transactionGroup');
  if (method === 'cod') {
    instrEl.style.display = 'block';
    instrEl.textContent = '💵 Cash on Delivery — Pay when your order arrives.';
    transEl.style.display = 'none';
  } else if (method && settings[method + 'Number']) {
    instrEl.style.display = 'block';
    instrEl.innerHTML = `Send ৳<strong style="color:var(--gold)">${document.getElementById('orderTotal').textContent.replace('৳','')}</strong> to <strong style="color:var(--gold)">${settings[method + 'Number']}</strong> and enter the Transaction ID below.`;
    transEl.style.display = 'flex';
    transEl.style.flexDirection = 'column';
    transEl.style.gap = '10px';
  } else if (method) {
    instrEl.style.display = 'block';
    instrEl.textContent = `Send payment via ${method} and enter your Transaction ID.`;
    transEl.style.display = 'flex';
    transEl.style.flexDirection = 'column';
    transEl.style.gap = '10px';
  }
}
async function submitOrder(e) {
  e.preventDefault();
  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
  if (!paymentMethod) return showToast('Please select payment method');
  const subtotal = currentOrder.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const orderData = {
    customerName: document.getElementById('orderName').value,
    customerPhone: document.getElementById('orderPhone').value,
    customerEmail: document.getElementById('orderEmail').value,
    address: document.getElementById('orderAddress').value,
    note: document.getElementById('orderNote').value,
    items: currentOrder.map(i => ({
      productName: i.name,
      quantity: i.qty || 1,
      price: i.price,
      category: i.category,
      customText: i.customText || ''
    })),
    totalAmount: subtotal + deliveryCharge,
    paymentMethod,
    transactionId: document.getElementById('transactionId')?.value || '',
    paymentNumber: document.getElementById('paymentNumber')?.value || ''
  };
  const result = await apiCall('/orders', 'POST', orderData);
  if (result && result._id) {
    closeModal('orderModal');
    cart = [];
    saveCart();
    updateCartUI();
    showToast('✦ Order placed successfully! We will contact you soon.', 'gold');
    setTimeout(() => {
      alert(`🎉 Order Confirmed!\n\nOrder ID: ${result._id}\nTotal: ৳${orderData.totalAmount}\n\nWe will contact you at ${orderData.customerPhone}`);
    }, 500);
  } else {
    showToast('Failed to place order. Please try again.');
  }
}

// ===== AUTH =====
function updateAuthUI() {
  const btn = document.querySelector('.btn-login');
  if (user) {
    btn.textContent = user.name?.split(' ')[0] || 'Account';
    btn.onclick = showUserMenu;
  }
}
function showUserMenu() {
  const menu = document.createElement('div');
  menu.style.cssText = `position:fixed;top:70px;right:40px;background:var(--black2);border:1px solid rgba(201,168,76,0.2);padding:8px;z-index:5000;min-width:160px`;
  menu.innerHTML = `
    <div style="padding:12px 16px;font-size:12px;color:var(--gold);letter-spacing:2px;border-bottom:1px solid var(--black3)">${user.name}</div>
    <button onclick="viewOrders()" style="display:block;width:100%;background:none;border:none;color:var(--white);padding:12px 16px;text-align:left;cursor:pointer;font-family:var(--font-body);font-size:13px">My Orders</button>
    <button onclick="logout()" style="display:block;width:100%;background:none;border:none;color:#e74c3c;padding:12px 16px;text-align:left;cursor:pointer;font-family:var(--font-body);font-size:13px">Logout</button>
  `;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 100);
}
function logout() {
  user = null;
  localStorage.removeItem('dsUser');
  document.querySelector('.btn-login').textContent = 'Login';
  document.querySelector('.btn-login').onclick = () => openModal('loginModal');
  showToast('Logged out successfully');
}
async function handleLogin(e) {
  e.preventDefault();
  const msg = document.getElementById('modalMsg');
  const result = await apiCall('/auth/login', 'POST', {
    email: document.getElementById('loginEmail').value,
    password: document.getElementById('loginPassword').value
  });
  if (result?.token) {
    user = result;
    localStorage.setItem('dsUser', JSON.stringify(user));
    updateAuthUI();
    closeModal('loginModal');
    showToast(`✦ Welcome back, ${user.name}!`, 'gold');
  } else {
    msg.textContent = result?.message || 'Login failed';
    msg.className = 'modal-msg error';
  }
}
async function handleRegister(e) {
  e.preventDefault();
  const msg = document.getElementById('modalMsg');
  const result = await apiCall('/auth/register', 'POST', {
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    phone: document.getElementById('regPhone').value,
    password: document.getElementById('regPassword').value
  });
  if (result?.token) {
    user = result;
    localStorage.setItem('dsUser', JSON.stringify(user));
    updateAuthUI();
    closeModal('loginModal');
    showToast(`✦ Welcome to DS Store BD, ${user.name}!`, 'gold');
  } else {
    msg.textContent = result?.message || 'Registration failed';
    msg.className = 'modal-msg error';
  }
}
async function viewOrders() {
  if (!user) return openModal('loginModal');
  const orders = await apiCall('/orders/my');
  if (!orders?.length) return showToast('No orders found');
  const list = orders.slice(0, 5).map(o =>
    `Order #${o._id.slice(-6)} — ৳${o.totalAmount} — ${o.status.toUpperCase()}`
  ).join('\n');
  alert('Your Recent Orders:\n\n' + list);
}

// ===== DESIGN STUDIO =====
function openDesignStudio() {
  document.getElementById('design').scrollIntoView({ behavior: 'smooth' });
  showToast('✦ Design Studio is ready! Choose colors and add your text.', 'gold');
}
function changeProductColor(color, swatch) {
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');
  document.querySelector('.tshirt-shape').style.background = color;
  const textEl = document.querySelector('.canvas-text');
  textEl.style.color = color === '#ffffff' ? '#1a1a1a' : '#c9a84c';
}
function updatePreviewText(text) {
  document.getElementById('canvasText').textContent = text || 'YOUR TEXT';
}

// ===== MODAL HELPERS =====
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}
function closeModalOutside(e, id) {
  if (e.target.id === id) closeModal(id);
}
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', (i === 0) === (tab === 'login')));
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('modalMsg').textContent = '';
  document.getElementById('modalMsg').className = 'modal-msg';
}

// ===== CONTACT =====
function submitContact(e) {
  e.preventDefault();
  showToast('✦ Message sent successfully! We will get back to you soon.', 'gold');
  e.target.reset();
}

// ===== TOAST =====
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 3500);
}
