// ===== CHINAMART BD — APP.JS =====
const API = 'https://ds-shop-bd-backend.onrender.com/api';
let cart = JSON.parse(localStorage.getItem('cmCart')) || [];
let user = JSON.parse(localStorage.getItem('cmUser')) || null;
let products = [], settings = {}, currentOrder = [];
let deliveryCharge = 60, displayCount = 8, currentFilter = 'all';
let sliderIndex = 0, sliderTimer;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initSlider();
  initScroll();
  loadSettings();
  loadProducts();
  updateCartUI();
  if (user) updateAuthUI();
  document.querySelectorAll('input[name="pay"]').forEach(r => r.addEventListener('change', updatePayInstructions));
});

// LOADER
function initLoader() {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 2200);
}

// SLIDER
function initSlider() {
  sliderTimer = setInterval(nextSlide, 4000);
}
function nextSlide() {
  const slides = document.querySelectorAll('.slide');
  slides[sliderIndex].classList.remove('active');
  document.querySelectorAll('.dot')[sliderIndex].classList.remove('active');
  sliderIndex = (sliderIndex + 1) % slides.length;
  slides[sliderIndex].classList.add('active');
  document.querySelectorAll('.dot')[sliderIndex].classList.add('active');
  document.getElementById('sliderContainer').style.transform = `translateX(-${sliderIndex * 100}%)`;
}
function prevSlide() {
  const slides = document.querySelectorAll('.slide');
  slides[sliderIndex].classList.remove('active');
  document.querySelectorAll('.dot')[sliderIndex].classList.remove('active');
  sliderIndex = (sliderIndex - 1 + slides.length) % slides.length;
  slides[sliderIndex].classList.add('active');
  document.querySelectorAll('.dot')[sliderIndex].classList.add('active');
  document.getElementById('sliderContainer').style.transform = `translateX(-${sliderIndex * 100}%)`;
  clearInterval(sliderTimer);
  sliderTimer = setInterval(nextSlide, 4000);
}
function goToSlide(i) {
  const slides = document.querySelectorAll('.slide');
  slides[sliderIndex].classList.remove('active');
  document.querySelectorAll('.dot')[sliderIndex].classList.remove('active');
  sliderIndex = i;
  slides[sliderIndex].classList.add('active');
  document.querySelectorAll('.dot')[sliderIndex].classList.add('active');
  document.getElementById('sliderContainer').style.transform = `translateX(-${sliderIndex * 100}%)`;
}

// SCROLL
function initScroll() {
  const scrollBtn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    scrollBtn.classList.toggle('show', window.scrollY > 300);
  });
}

// MOBILE MENU
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// API
async function apiCall(endpoint, method = 'GET', data = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (user?.token) opts.headers['Authorization'] = `Bearer ${user.token}`;
  if (data) opts.body = JSON.stringify(data);
  try {
    const res = await fetch(API + endpoint, opts);
    return await res.json();
  } catch (e) { return null; }
}

// SETTINGS
async function loadSettings() {
  const data = await apiCall('/settings');
  if (data) {
    settings = data;
    deliveryCharge = data.deliveryCharge || 60;
  }
  const payment = await apiCall('/payment/info');
  if (payment) settings.payment = payment;
}

// PRODUCTS
async function loadProducts() {
  const data = await apiCall('/products');
  if (data && Array.isArray(data) && data.length > 0) {
    products = data;
  } else {
    products = getDemoProducts();
  }
  renderProducts();
}

function getDemoProducts() {
  return [
    { _id:'1', name:'LED Fairy Lights 10m', price:299, category:'lighting', emoji:'💡', rating:4.8, reviews:124, badge:'Hot' },
    { _id:'2', name:'Smart LED Bulb RGB', price:199, category:'lighting', emoji:'🔆', rating:4.7, reviews:89 },
    { _id:'3', name:'USB Mini Fan Portable', price:349, category:'electronics', emoji:'🌀', rating:4.6, reviews:67 },
    { _id:'4', name:'Wireless Earbuds', price:599, category:'electronics', emoji:'🎧', rating:4.5, reviews:156, badge:'New' },
    { _id:'5', name:'Remote Control Car', price:799, category:'toys', emoji:'🚗', rating:4.9, reviews:203, badge:'Hot' },
    { _id:'6', name:'Building Blocks Set', price:449, category:'toys', emoji:'🧱', rating:4.8, reviews:178 },
    { _id:'7', name:'Kitchen Organizer Set', price:399, category:'home', emoji:'🍳', rating:4.7, reviews:92 },
    { _id:'8', name:'Smart Door Lock', price:1299, category:'home', emoji:'🔐', rating:4.6, reviews:45, badge:'New' },
    { _id:'9', name:'Women Hair Accessories', price:249, category:'women', emoji:'💄', rating:4.8, reviews:134 },
    { _id:'10', name:'Ladies Watch Set', price:699, category:'women', emoji:'⌚', rating:4.7, reviews:88 },
    { _id:'11', name:'Men Wallet Premium', price:449, category:'men', emoji:'👜', rating:4.6, reviews:67 },
    { _id:'12', name:'Men Belt Genuine Leather', price:349, category:'men', emoji:'👔', rating:4.5, reviews:54 },
    { _id:'13', name:'Chinese Tea Set', price:899, category:'general', emoji:'🍵', rating:4.9, reviews:112, badge:'Hot' },
    { _id:'14', name:'Portable Phone Stand', price:199, category:'electronics', emoji:'📱', rating:4.7, reviews:234 },
    { _id:'15', name:'Kids Drawing Board', price:549, category:'toys', emoji:'🎨', rating:4.8, reviews:189 },
    { _id:'16', name:'LED Strip Lights 5m', price:399, category:'lighting', emoji:'🌈', rating:4.6, reviews:156 },
  ];
}

function getCatEmoji(cat) {
  const map = { lighting:'💡', electronics:'📱', toys:'🧸', home:'🏡', women:'👗', men:'👔', general:'🛍️' };
  return map[cat] || '🛍️';
}

function renderProducts(filter = currentFilter) {
  currentFilter = filter;
  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
  const grid = document.getElementById('productsGrid');
  const loadBtn = document.getElementById('loadMoreBtn');
  const toShow = filtered.slice(0, displayCount);

  if (!toShow.length) {
    grid.innerHTML = '<div class="loading-wrap"><p style="color:var(--gray)">No products found in this category</p></div>';
    loadBtn.style.display = 'none';
    return;
  }

  grid.innerHTML = toShow.map(p => `
    <div class="product-card" onclick="openProduct('${p._id}')">
      <div class="product-img">
        ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}">` : `<span>${p.emoji || getCatEmoji(p.category)}</span>`}
        ${p.discount ? `<div class="product-discount">-${p.discount}%</div>` : ''}
        ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">⭐ ${p.rating || '4.5'} (${p.reviews || 0} reviews)</div>
        <div class="product-pricing">
          <span class="product-price">৳${p.price}</span>
          ${p.oldPrice ? `<span class="product-old">৳${p.oldPrice}</span>` : ''}
        </div>
        <div class="product-btns" onclick="event.stopPropagation()">
          <button class="btn-cart" onclick="addToCart('${p._id}')">🛒 Add</button>
          <button class="btn-buy" onclick="buyNow('${p._id}')">Buy Now</button>
        </div>
      </div>
    </div>
  `).join('');

  loadBtn.style.display = filtered.length > displayCount ? 'inline-flex' : 'none';
}

function filterCat(cat, btn) {
  currentFilter = cat;
  displayCount = 8;
  document.querySelectorAll('.filter-btn, .cat-nav-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProducts(cat);
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function loadMoreProducts() {
  displayCount += 8;
  renderProducts(currentFilter);
}

function searchProducts(q) {
  if (!q.trim()) { renderProducts(currentFilter); return; }
  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()));
  const grid = document.getElementById('productsGrid');
  if (!filtered.length) {
    grid.innerHTML = '<div class="loading-wrap"><p style="color:var(--gray)">No products found for "' + q + '"</p></div>';
    return;
  }
  grid.innerHTML = filtered.map(p => `
    <div class="product-card" onclick="openProduct('${p._id}')">
      <div class="product-img">${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}">` : `<span>${p.emoji || getCatEmoji(p.category)}</span>`}</div>
      <div class="product-info">
        <div class="product-cat">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-pricing"><span class="product-price">৳${p.price}</span></div>
        <div class="product-btns" onclick="event.stopPropagation()">
          <button class="btn-cart" onclick="addToCart('${p._id}')">🛒 Add</button>
          <button class="btn-buy" onclick="buyNow('${p._id}')">Buy Now</button>
        </div>
      </div>
    </div>
  `).join('');
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// PRODUCT DETAIL
function openProduct(id) {
  const p = products.find(x => x._id === id);
  if (!p) return;
  document.getElementById('productDetail').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:400px">
      <div style="background:var(--gray4);display:flex;align-items:center;justify-content:center;font-size:120px;border-radius:16px 0 0 16px;padding:40px">
        ${p.images?.[0] ? `<img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover;border-radius:12px 0 0 12px">` : (p.emoji || getCatEmoji(p.category))}
      </div>
      <div style="padding:32px">
        <div style="font-size:11px;color:var(--blue2);font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">${p.category}</div>
        <h2 style="font-size:22px;font-weight:700;margin-bottom:12px;line-height:1.3">${p.name}</h2>
        <div style="margin-bottom:12px;font-size:13px;color:var(--gray)">⭐ ${p.rating || '4.5'} (${p.reviews || 0} reviews)</div>
        <div style="font-size:32px;font-weight:800;color:var(--blue2);margin-bottom:16px">৳${p.price}</div>
        <p style="color:var(--gray);font-size:14px;line-height:1.8;margin-bottom:20px">${p.description || 'Premium quality Chinese product. Best price guaranteed. Fast delivery all over Bangladesh.'}</p>
        ${p.colors?.length ? `<div style="margin-bottom:16px"><p style="font-size:12px;font-weight:600;margin-bottom:8px">COLORS</p><div style="display:flex;gap:8px">${p.colors.map(c => `<div style="width:28px;height:28px;background:${c};border-radius:50%;border:2px solid var(--gray3);cursor:pointer" onclick="this.style.borderColor='var(--blue2)'"></div>`).join('')}</div></div>` : ''}
        ${p.sizes?.length ? `<div style="margin-bottom:20px"><p style="font-size:12px;font-weight:600;margin-bottom:8px">SIZES</p><div style="display:flex;gap:8px">${p.sizes.map(s => `<button style="padding:6px 14px;background:var(--gray4);border:2px solid var(--gray3);border-radius:6px;cursor:pointer;font-family:var(--font)">${s}</button>`).join('')}</div></div>` : ''}
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="btn-cart" style="flex:1;padding:14px;font-size:14px" onclick="addToCart('${p._id}');closeModal('productModal')">🛒 Add to Cart</button>
          <button class="btn-buy" style="flex:1;padding:14px;font-size:14px" onclick="buyNow('${p._id}');closeModal('productModal')">Buy Now →</button>
        </div>
      </div>
    </div>
  `;
  openModal('productModal');
}

// CART
function addToCart(id) {
  const p = products.find(x => x._id === id);
  if (!p) return;
  const existing = cart.find(i => i._id === id);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cart.push({ ...p, qty: 1 });
  saveCart();
  updateCartUI();
  showToast(`✅ ${p.name} added to cart!`, 'success');
}
function removeFromCart(i) { cart.splice(i, 1); saveCart(); updateCartUI(); renderCart(); }
function changeQty(i, d) { cart[i].qty = Math.max(1, (cart[i].qty || 1) + d); saveCart(); updateCartUI(); renderCart(); }
function saveCart() { localStorage.setItem('cmCart', JSON.stringify(cart)); }
function updateCartUI() {
  const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
  document.getElementById('cartCount').textContent = count;
}
function renderCart() {
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  if (!cart.length) {
    body.innerHTML = '<div class="empty-cart"><span>🛒</span><p>Your cart is empty</p></div>';
    foot.style.display = 'none'; return;
  }
  foot.style.display = 'block';
  let total = 0;
  body.innerHTML = cart.map((item, i) => {
    const sub = item.price * (item.qty || 1);
    total += sub;
    return `
      <div class="cart-item">
        <div class="cart-item-img">${item.images?.[0] ? `<img src="${item.images[0]}">` : (item.emoji || '🛍️')}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">৳${sub}</div>
          <div class="cart-qty">
            <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
            <span style="font-size:13px;font-weight:600">${item.qty || 1}</span>
            <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${i})">✕</button>
      </div>`;
  }).join('');
  document.getElementById('cartTotal').textContent = `৳${total}`;
}
function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('active');
  renderCart();
}
function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('active');
}
function openCheckout() { closeCart(); if (!cart.length) return; currentOrder = [...cart]; openOrderModal(); }
function buyNow(id) {
  const p = products.find(x => x._id === id);
  if (!p) return;
  currentOrder = [{ ...p, qty: 1 }];
  openOrderModal();
}

// ORDER
function openOrderModal() {
  const box = document.getElementById('orderItemsBox');
  let subtotal = 0;
  box.innerHTML = currentOrder.map(i => {
    const s = i.price * (i.qty || 1); subtotal += s;
    return `<div class="summary-row" style="font-size:13px"><span>${i.name} x${i.qty||1}</span><span>৳${s}</span></div>`;
  }).join('');
  const total = subtotal + deliveryCharge;
  document.getElementById('oSubtotal').textContent = `৳${subtotal}`;
  document.getElementById('oDelivery').textContent = `৳${deliveryCharge}`;
  document.getElementById('oTotal').textContent = `৳${total}`;
  if (user) {
    document.getElementById('oName').value = user.name || '';
    document.getElementById('oPhone').value = user.phone || '';
    document.getElementById('oEmail').value = user.email || '';
  }
  openModal('orderModal');
}
function updatePayInstructions() {
  const method = document.querySelector('input[name="pay"]:checked')?.value;
  const instr = document.getElementById('payInstr');
  const txn = document.getElementById('txnGroup');
  if (!method) return;
  if (method === 'cod') {
    instr.style.display = 'block';
    instr.textContent = '💵 Cash on Delivery — Pay when your order arrives at your doorstep.';
    txn.style.display = 'none';
  } else {
    const info = settings.payment?.[method];
    instr.style.display = 'block';
    instr.innerHTML = `Send payment to <strong>${info?.number || 'Contact us for number'}</strong> via ${method.toUpperCase()} and enter Transaction ID below.`;
    txn.style.display = 'block';
  }
}
async function placeOrder(e) {
  e.preventDefault();
  const paymentMethod = document.querySelector('input[name="pay"]:checked')?.value;
  if (!paymentMethod) return showToast('Please select payment method', 'error');
  const subtotal = currentOrder.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const orderData = {
    customerName: document.getElementById('oName').value,
    customerPhone: document.getElementById('oPhone').value,
    customerEmail: document.getElementById('oEmail').value,
    address: document.getElementById('oAddress').value,
    note: document.getElementById('oNote').value,
    items: currentOrder.map(i => ({ productName: i.name, quantity: i.qty||1, price: i.price, category: i.category })),
    totalAmount: subtotal + deliveryCharge,
    paymentMethod,
    transactionId: document.getElementById('txnId')?.value || '',
    paymentNumber: document.getElementById('payNum')?.value || ''
  };
  const result = await apiCall('/orders', 'POST', orderData);
  if (result?._id) {
    closeModal('orderModal');
    cart = []; saveCart(); updateCartUI();
    showToast('🎉 Order placed successfully!', 'success');
    setTimeout(() => alert(`✅ Order Confirmed!\n\nOrder ID: ${result._id}\nTotal: ৳${orderData.totalAmount}\n\nWe will contact you soon at ${orderData.customerPhone}`), 500);
  } else showToast('Failed to place order. Please try again.', 'error');
}

// AUTH
function updateAuthUI() {
  const btn = document.querySelector('.btn-login');
  if (user) { btn.innerHTML = `<span>👤</span> ${user.name?.split(' ')[0]}`; btn.onclick = showUserMenu; }
}
function showUserMenu() {
  const menu = document.createElement('div');
  menu.style.cssText = `position:fixed;top:70px;right:20px;background:white;border:1px solid var(--gray3);border-radius:12px;padding:8px;z-index:5000;min-width:160px;box-shadow:0 8px 24px rgba(0,0,0,0.12)`;
  menu.innerHTML = `
    <div style="padding:10px 14px;font-size:12px;color:var(--blue2);font-weight:600;border-bottom:1px solid var(--gray3)">${user.name}</div>
    <button onclick="viewOrders()" style="display:block;width:100%;background:none;border:none;padding:10px 14px;text-align:left;cursor:pointer;font-size:13px;font-family:var(--font)">My Orders</button>
    <button onclick="doLogout()" style="display:block;width:100%;background:none;border:none;padding:10px 14px;text-align:left;cursor:pointer;color:#dc2626;font-size:13px;font-family:var(--font)">Logout</button>
  `;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 100);
}
async function doLogin(e) {
  e.preventDefault();
  const msg = document.getElementById('authMsg');
  const result = await apiCall('/auth/login', 'POST', { email: document.getElementById('lEmail').value, password: document.getElementById('lPass').value });
  if (result?.token) {
    user = result; localStorage.setItem('cmUser', JSON.stringify(user));
    updateAuthUI(); closeModal('loginModal');
    showToast(`Welcome back, ${user.name}! 👋`, 'success');
  } else { msg.textContent = result?.message || 'Login failed'; msg.className = 'auth-msg error'; }
}
async function doRegister(e) {
  e.preventDefault();
  const msg = document.getElementById('authMsg');
  const result = await apiCall('/auth/register', 'POST', { name: document.getElementById('rName').value, email: document.getElementById('rEmail').value, phone: document.getElementById('rPhone').value, password: document.getElementById('rPass').value });
  if (result?.token) {
    user = result; localStorage.setItem('cmUser', JSON.stringify(user));
    updateAuthUI(); closeModal('loginModal');
    showToast(`Welcome to ChinaMartBD, ${user.name}! 🎉`, 'success');
  } else { msg.textContent = result?.message || 'Registration failed'; msg.className = 'auth-msg error'; }
}
function doLogout() { user = null; localStorage.removeItem('cmUser'); document.querySelector('.btn-login').innerHTML = '<span>👤</span> Login'; document.querySelector('.btn-login').onclick = () => openModal('loginModal'); showToast('Logged out successfully'); }
async function viewOrders() {
  const orders = await apiCall('/orders/my');
  if (!orders?.length) return showToast('No orders found');
  alert('Your Recent Orders:\n\n' + orders.slice(0,5).map(o => `#${o._id.slice(-6)} — ৳${o.totalAmount} — ${o.status.toUpperCase()}`).join('\n'));
}

// MODAL
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function closeModalOut(e, id) { if (e.target.id === id) closeModal(id); }
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((b, i) => b.classList.toggle('active', (i===0)===(tab==='login')));
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('authMsg').textContent = '';
  document.getElementById('authMsg').className = 'auth-msg';
}

// TOAST
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 3500);
}
