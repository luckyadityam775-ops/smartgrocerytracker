/**
 * Storage Layer for Smart Grocery Tracker [F-06]
 * Fully scoped per user account, ensuring complete data isolation.
 * Schema maps 1:1 with future Firebase Firestore collections:
 * - 'users/{userId}/budgetSettings'
 * - 'users/{userId}/activeCart'
 * - 'users/{userId}/catalog'
 * - 'users/{userId}/shoppingSessions'
 */

const Store = {
  /**
   * Dynamically build user-scoped storage key
   * @param {string} category 'budget' | 'cart' | 'catalog' | 'history' | 'cart_discount'
   */
  getKey(category) {
    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    const uid = user ? user.id : 'user_rian';
    return `smartgrocery_${uid}_${category}`;
  },

  /**
   * Initialize local database
   */
  init() {
    // Auth handles seeding users and user data
    if (window.Auth) {
      window.Auth.init();
      if (!window.Auth.getCurrentUser()) {
        const users = window.Auth.getAllUsers();
        if (users && users.length > 0) {
          window.Auth.setActiveUser(users[0]);
        }
      }
    }
    // Ensure catalog has benchmark DT2 items
    this.ensureBenchmarkCatalog();
  },

  ensureBenchmarkCatalog() {
    const catalog = this.getCatalog();
    const benchmarks = [
      { name: "Beras Rojolele", category: "Bahan Pokok", unit: "karung/5kg", lastPrice: 68000 },
      { name: "Beras 5kg", category: "Bahan Pokok", unit: "pack", lastPrice: 68000 },
      { name: "Telur 1kg", category: "Bahan Pokok", unit: "kg", lastPrice: 32000 },
      { name: "Garam 500g", category: "Dapur & Bumbu", unit: "pack", lastPrice: 5000 },
      { name: "Minyak Goreng 2L", category: "Bahan Pokok", unit: "liter", lastPrice: 43000 },
      { name: "Sabun Cuci", category: "Toiletries", unit: "pcs", lastPrice: 20000 },
      { name: "Wajan", category: "Lainnya", unit: "pcs", lastPrice: 100000 }
    ];
    let changed = false;
    benchmarks.forEach(bm => {
      const exists = catalog.some(c => c.name.toLowerCase() === bm.name.toLowerCase());
      if (!exists) {
        catalog.push({
          id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: bm.name,
          category: bm.category,
          unit: bm.unit,
          lastPrice: bm.lastPrice,
          updatedAt: '2026-09-26'
        });
        changed = true;
      }
    });
    if (changed) {
      this.saveCatalog(catalog);
    }
  },

  // ------------------ SESSION (STORE & DATE) [F-01, F-06A] ------------------
  getSessionInfo() {
    try {
      const data = localStorage.getItem(this.getKey('session'));
      if (data) return JSON.parse(data);
    } catch (e) {}
    return {
      storeName: "Lotte Mart Grocery - Puri Indah",
      date: "2026-10-26"
    };
  },

  saveSessionInfo(session) {
    localStorage.setItem(this.getKey('session'), JSON.stringify(session));
    this.notifyChange('session');
  },

  // ------------------ BUDGET ------------------
  getBudgetSettings() {
    try {
      const data = localStorage.getItem(this.getKey('budget'));
      if (data) return JSON.parse(data);
      const user = window.Auth ? window.Auth.getCurrentUser() : null;
      return { monthlyLimit: 500000, emergencyReserve: 50000, userName: user ? user.fullName : "Pengguna Utama" };
    } catch (e) {
      return { monthlyLimit: 500000, emergencyReserve: 50000, userName: "Pengguna Utama" };
    }
  },

  saveBudgetSettings(settings) {
    localStorage.setItem(this.getKey('budget'), JSON.stringify(settings));
    this.notifyChange('budget');
  },

  // ------------------ ACTIVE CART ------------------
  getActiveCart() {
    try {
      const data = localStorage.getItem(this.getKey('cart'));
      if (data && data !== '[]') {
        return JSON.parse(data);
      }
      // If user's cart has never been populated or is empty on first open:
      const isExplicitlyCleared = localStorage.getItem(this.getKey('cart_cleared')) === '1';
      if (!isExplicitlyCleared && (!data || data === '[]')) {
        const starter = (typeof SEED_DATA !== 'undefined' && SEED_DATA.userData_user_rian)
          ? SEED_DATA.userData_user_rian.activeCart.map(item => ({ ...item }))
          : [];
        if (starter.length > 0) {
          localStorage.setItem(this.getKey('cart'), JSON.stringify(starter));
          return starter;
        }
      }
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  loadStarterDemoItems() {
    localStorage.removeItem(this.getKey('cart_cleared'));
    const starter = (typeof SEED_DATA !== 'undefined' && SEED_DATA.userData_user_rian)
      ? SEED_DATA.userData_user_rian.activeCart.map(item => ({ ...item }))
      : [];
    this.saveActiveCart(starter);
    return starter;
  },

  saveActiveCart(cart) {
    if (cart && Array.isArray(cart) && cart.length > 0) {
      localStorage.removeItem(this.getKey('cart_cleared'));
    }
    localStorage.setItem(this.getKey('cart'), JSON.stringify(cart));
    this.notifyChange('cart');
  },

  addCartItem(item) {
    if (!item || !item.name || !item.name.trim()) return null;
    const price = parseFloat(item.currentPrice);
    if (isNaN(price) || price <= 0) return null; // Reject empty, 0, or negative price!

    const cart = this.getActiveCart();
    const newItem = {
      id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: item.name.trim(),
      category: item.category || 'Bahan Pokok',
      unit: item.unit || 'pcs',
      qty: Math.max(1, parseInt(item.qty, 10) || 1),
      currentPrice: price,
      lastPrice: Math.max(0, parseFloat(item.lastPrice) || 0),
      discountType: item.discountType || 'none',
      discountA: parseFloat(item.discountA) || 0,
      discountB: parseFloat(item.discountB) || 0,
      discountNominal: parseFloat(item.discountNominal) || 0,
      createdAt: new Date().toISOString()
    };

    // If item already exists in catalog, ensure lastPrice is synced
    const catalogItem = this.findCatalogItemByName(newItem.name);
    if (catalogItem && (!newItem.lastPrice || newItem.lastPrice === 0)) {
      newItem.lastPrice = catalogItem.lastPrice;
    }

    cart.unshift(newItem);
    this.saveActiveCart(cart);

    // Update catalog item metadata as well
    this.upsertCatalogItem({
      name: newItem.name,
      category: newItem.category,
      unit: newItem.unit,
      lastPrice: newItem.lastPrice > 0 ? newItem.lastPrice : newItem.currentPrice
    });

    return newItem;
  },

  updateCartItem(id, updates) {
    const cart = this.getActiveCart();
    const index = cart.findIndex((i) => i.id === id);
    if (index !== -1) {
      cart[index] = { ...cart[index], ...updates };
      this.upsertCatalogItem({
        name: cart[index].name,
        category: cart[index].category,
        unit: cart[index].unit,
        lastPrice: cart[index].lastPrice > 0 ? cart[index].lastPrice : cart[index].currentPrice
      });
      this.saveActiveCart(cart);
      return cart[index];
    }
    return null;
  },

  updateItemQty(id, delta) {
    const cart = this.getActiveCart();
    const index = cart.findIndex((i) => i.id === id);
    if (index !== -1) {
      const newQty = Math.max(1, (cart[index].qty || 1) + delta);
      cart[index].qty = newQty;
      this.saveActiveCart(cart);
      return cart[index];
    }
    return null;
  },

  removeCartItem(id) {
    let cart = this.getActiveCart();
    cart = cart.filter((i) => i.id !== id);
    this.saveActiveCart(cart);
  },

  clearActiveCart() {
    localStorage.setItem(this.getKey('cart_cleared'), '1');
    this.saveActiveCart([]);
  },

  // ------------------ CART DISCOUNT ------------------
  getCartDiscount() {
    try {
      const data = localStorage.getItem(this.getKey('cart_discount'));
      return data ? JSON.parse(data) : { type: 'none', value: 0 };
    } catch (e) {
      return { type: 'none', value: 0 };
    }
  },

  saveCartDiscount(discount) {
    localStorage.setItem(this.getKey('cart_discount'), JSON.stringify(discount));
    this.notifyChange('cart');
  },

  // ------------------ CATALOG ------------------
  getCatalog() {
    try {
      const data = localStorage.getItem(this.getKey('catalog'));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCatalog(catalog) {
    localStorage.setItem(this.getKey('catalog'), JSON.stringify(catalog));
  },

  findCatalogItemByName(name) {
    if (!name) return null;
    const catalog = this.getCatalog();
    const lower = name.trim().toLowerCase();
    const exact = catalog.find((i) => i.name.toLowerCase() === lower);
    if (exact) return exact;
    return catalog.find((i) => i.name.toLowerCase().includes(lower) || lower.includes(i.name.toLowerCase())) || null;
  },

  searchCatalog(query) {
    if (!query) return [];
    const catalog = this.getCatalog();
    const q = query.trim().toLowerCase();
    return catalog.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 5);
  },

  upsertCatalogItem(item) {
    const catalog = this.getCatalog();
    const index = catalog.findIndex((i) => i.name.toLowerCase() === item.name.toLowerCase());
    const timestamp = new Date().toISOString().split('T')[0];

    if (index !== -1) {
      catalog[index] = {
        ...catalog[index],
        category: item.category || catalog[index].category,
        unit: item.unit || catalog[index].unit,
        lastPrice: item.lastPrice !== undefined ? item.lastPrice : catalog[index].lastPrice,
        updatedAt: timestamp
      };
    } else {
      catalog.push({
        id: 'cat_' + Date.now(),
        name: item.name.trim(),
        category: item.category || 'Sembako',
        unit: item.unit || 'pcs',
        lastPrice: item.lastPrice || 0,
        updatedAt: timestamp
      });
    }
    this.saveCatalog(catalog);
  },

  // ------------------ HISTORY & ARCHIVING [F-06] ------------------
  getHistory() {
    try {
      const data = localStorage.getItem(this.getKey('history'));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveHistory(history) {
    localStorage.setItem(this.getKey('history'), JSON.stringify(history));
    this.notifyChange('history');
  },

  archiveCurrentCart(cartSummary, notes = '') {
    const cart = this.getActiveCart();
    if (!cart || cart.length === 0) return null;

    const now = new Date();
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const sessionMonthName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    const dateFormatted = now.toISOString().split('T')[0];

    const sessionRecord = {
      id: 'session_' + Date.now(),
      date: dateFormatted,
      monthName: sessionMonthName,
      totalAmount: cartSummary.grandTotal,
      totalSavings: cartSummary.allSavings,
      itemCount: cartSummary.totalItemsCount,
      budgetLimit: cartSummary.budgetLimit,
      remainingBudget: cartSummary.remainingBudget,
      status: cartSummary.remainingBudget >= 0 ? "Selesai (Di Bawah Anggaran)" : "Selesai (Melebihi Anggaran)",
      notes: notes,
      items: cart.map(item => {
        const row = Calculator.calculateItemRow(item);
        return {
          name: row.name,
          category: row.category,
          unit: row.unit,
          qty: row.qty,
          price: row.discountInfo.finalPrice,
          originalPrice: row.currentPrice,
          subtotal: row.subtotalFinal,
          savings: row.subtotalSavings
        };
      })
    };

    const history = this.getHistory();
    history.unshift(sessionRecord);
    this.saveHistory(history);

    // Update catalog with latest prices as benchmark
    cart.forEach(item => {
      this.upsertCatalogItem({
        name: item.name,
        category: item.category,
        unit: item.unit,
        lastPrice: item.currentPrice
      });
    });

    // Reset active cart
    localStorage.setItem(this.getKey('cart_cleared'), '1');
    this.saveActiveCart([]);
    this.saveCartDiscount({ type: 'none', value: 0 });

    return sessionRecord;
  },

  getCategoryBreakdown(items) {
    const breakdown = {};
    (items || []).forEach(item => {
      const row = Calculator.calculateItemRow(item);
      const cat = row.category || 'Lainnya';
      if (!breakdown[cat]) {
        breakdown[cat] = { category: cat, total: 0, count: 0 };
      }
      breakdown[cat].total += row.subtotalFinal;
      breakdown[cat].count += row.qty;
    });
    return Object.values(breakdown).sort((a, b) => b.total - a.total);
  },

  // ------------------ RENCANA PEMBELIAN (SHOPPING PLAN) ------------------
  getPlannedItems() {
    try {
      const data = localStorage.getItem(this.getKey('planned_items'));
      if (data) return JSON.parse(data);
      // Default sample items for shopping plan
      const defaultPlan = [
        { id: 'plan_1', name: 'Susu UHT Full Cream 1L', category: 'Bahan Pokok', unit: 'kotak', qty: 2, estimatedPrice: 21000, priority: 'Tinggi', notes: 'Kebutuhan sarapan' },
        { id: 'plan_2', name: 'Kecap Manis 550ml', category: 'Dapur & Bumbu', unit: 'pouch', qty: 1, estimatedPrice: 18500, priority: 'Sedang', notes: 'Stok dapur menipis' },
        { id: 'plan_3', name: 'Pasta Gigi Herbal', category: 'Toiletries', unit: 'pcs', qty: 1, estimatedPrice: 16000, priority: 'Rendah', notes: 'Cari promo toko' }
      ];
      this.savePlannedItems(defaultPlan);
      return defaultPlan;
    } catch (e) {
      return [];
    }
  },

  savePlannedItems(items) {
    localStorage.setItem(this.getKey('planned_items'), JSON.stringify(items));
    this.notifyChange('planned_items');
  },

  addPlannedItem(item) {
    if (!item || !item.name || !item.name.trim()) return null;
    const estPrice = parseFloat(item.estimatedPrice) || 0;
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    const planList = this.getPlannedItems();
    const newItem = {
      id: 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: item.name.trim(),
      category: item.category || 'Bahan Pokok',
      unit: item.unit || 'pcs',
      qty: qty,
      estimatedPrice: estPrice,
      priority: item.priority || 'Sedang',
      notes: (item.notes || '').trim(),
      createdAt: new Date().toISOString()
    };
    planList.unshift(newItem);
    this.savePlannedItems(planList);
    return newItem;
  },

  removePlannedItem(id) {
    const planList = this.getPlannedItems();
    const filtered = planList.filter(item => item.id !== id);
    this.savePlannedItems(filtered);
  },

  movePlanToCart(id) {
    const planList = this.getPlannedItems();
    const item = planList.find(p => p.id === id);
    if (!item) return null;

    // Add to active cart
    const addedCartItem = this.addCartItem({
      name: item.name,
      category: item.category,
      unit: item.unit,
      qty: item.qty,
      currentPrice: item.estimatedPrice > 0 ? item.estimatedPrice : 10000,
      lastPrice: item.estimatedPrice > 0 ? item.estimatedPrice : 10000
    });

    // Remove from planned list
    this.removePlannedItem(id);
    return addedCartItem;
  },

  // ------------------ REALTIME & ON_SNAPSHOT EVENTS ------------------
  listeners: [],
  onChange(fn) {
    this.listeners.push(fn);
  },

  /**
   * Subscribe to real-time snapshot events
   * @param {Function} fn (snapshot) => void
   */
  onSnapshot(fn) {
    if (window.Realtime && typeof window.Realtime.onSnapshot === 'function') {
      return window.Realtime.onSnapshot(fn);
    }
    this.listeners.push(fn);
    return () => {
      const idx = this.listeners.indexOf(fn);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  },

  /**
   * Notify local UI listeners only (without re-broadcasting)
   */
  notifyChangeLocally(type) {
    this.listeners.forEach(fn => {
      try {
        fn(type);
      } catch (e) {
        console.error(e);
      }
    });
  },

  /**
   * Notify change locally AND broadcast snapshot across tabs and to Cloud Firestore
   */
  notifyChange(type) {
    this.notifyChangeLocally(type);

    if (window.Realtime && typeof window.Realtime.broadcast === 'function') {
      let data = null;
      if (type === 'cart') data = this.getActiveCart();
      else if (type === 'budget') data = this.getBudgetSettings();
      else if (type === 'session') data = this.getSessionInfo();
      else if (type === 'cart_discount') data = this.getCartDiscount();
      else if (type === 'history') data = this.getHistory();
      window.Realtime.broadcast(type, data);
    }
  },

  /**
   * Apply remote incoming snapshot without triggering broadcast echo
   */
  applySnapshot(snapshot) {
    if (!snapshot) return;
    try {
      if (snapshot.type === 'cart' && Array.isArray(snapshot.data)) {
        localStorage.setItem(this.getKey('cart'), JSON.stringify(snapshot.data));
        if (snapshot.discount) {
          localStorage.setItem(this.getKey('cart_discount'), JSON.stringify(snapshot.discount));
        }
      } else if (snapshot.type === 'budget' && snapshot.data) {
        localStorage.setItem(this.getKey('budget'), JSON.stringify(snapshot.data));
      } else if (snapshot.type === 'session' && snapshot.data) {
        localStorage.setItem(this.getKey('session'), JSON.stringify(snapshot.data));
      } else if (snapshot.type === 'cart_discount' && snapshot.data) {
        localStorage.setItem(this.getKey('cart_discount'), JSON.stringify(snapshot.data));
      } else if (snapshot.type === 'history' && Array.isArray(snapshot.data)) {
        localStorage.setItem(this.getKey('history'), JSON.stringify(snapshot.data));
      }
      this.notifyChangeLocally(snapshot.type);
    } catch (e) {
      console.warn('[Store] applySnapshot error:', e);
    }
  },

  resetDemo() {
    // Preserve registered user accounts and their budgets!
    const usersJson = localStorage.getItem('smartgrocery_users_v2');
    const activeUserJson = localStorage.getItem('smartgrocery_active_user_v2');

    // Only clear active cart and demo temporary states
    localStorage.removeItem('smartgrocery_user_rian_cart');
    localStorage.removeItem('smartgrocery_user_aditya_cart');

    if (usersJson) localStorage.setItem('smartgrocery_users_v2', usersJson);
    if (activeUserJson) localStorage.setItem('smartgrocery_active_user_v2', activeUserJson);

    if (window.Auth) {
      window.Auth.init();
      if (!window.Auth.getCurrentUser()) {
        const users = window.Auth.getAllUsers();
        if (users && users.length > 0) {
          window.Auth.setActiveUser(users[0]);
        }
      }
    }
    this.notifyChange('all');
  }
};

window.Store = Store;
