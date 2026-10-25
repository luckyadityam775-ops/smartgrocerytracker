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
    }
  },

  // ------------------ BUDGET ------------------
  getBudgetSettings() {
    try {
      const data = localStorage.getItem(this.getKey('budget'));
      if (data) return JSON.parse(data);
      const user = window.Auth ? window.Auth.getCurrentUser() : null;
      return { monthlyLimit: 500000, emergencyReserve: 50000, userName: user ? user.fullName : "Rian (Anak Rantau)" };
    } catch (e) {
      return { monthlyLimit: 500000, emergencyReserve: 50000, userName: "Rian (Anak Rantau)" };
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
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveActiveCart(cart) {
    localStorage.setItem(this.getKey('cart'), JSON.stringify(cart));
    this.notifyChange('cart');
  },

  addCartItem(item) {
    if (!item || !item.name || !item.name.trim()) return null;
    const cart = this.getActiveCart();
    const newItem = {
      id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: item.name.trim(),
      category: item.category || 'Sembako',
      unit: item.unit || 'pcs',
      qty: Math.max(1, parseInt(item.qty, 10) || 1),
      currentPrice: Math.max(0, parseFloat(item.currentPrice) || 0),
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
    return catalog.find((i) => i.name.toLowerCase() === lower) || null;
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
      else if (type === 'cart_discount') data = this.getCartDiscount();
      else if (type === 'history') data = this.getShoppingHistory();
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
    }
    this.notifyChange('all');
  }
};

window.Store = Store;
