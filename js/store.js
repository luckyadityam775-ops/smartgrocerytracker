/**
 * Storage Layer for Smart Grocery Tracker [F-06]
 * Structured cleanly to map 1:1 with future Firebase Firestore collections:
 * - 'budgetSettings' doc
 * - 'activeCart' collection
 * - 'catalog' collection (price history index)
 * - 'shoppingSessions' collection (archived history)
 */

const Store = {
  KEYS: {
    BUDGET: 'smartgrocery_budget_v1',
    CART: 'smartgrocery_cart_v1',
    CATALOG: 'smartgrocery_catalog_v1',
    HISTORY: 'smartgrocery_history_v1',
    CART_DISCOUNT: 'smartgrocery_cart_discount_v1'
  },

  /**
   * Initialize local database with seed data if not present
   */
  init() {
    if (!localStorage.getItem(this.KEYS.BUDGET)) {
      this.saveBudgetSettings(window.SEED_DATA.budgetSettings);
    }
    if (!localStorage.getItem(this.KEYS.CATALOG)) {
      this.saveCatalog(window.SEED_DATA.catalog);
    }
    if (!localStorage.getItem(this.KEYS.CART)) {
      this.saveActiveCart(window.SEED_DATA.activeCart);
    }
    if (!localStorage.getItem(this.KEYS.HISTORY)) {
      this.saveHistory(window.SEED_DATA.history);
    }
    if (!localStorage.getItem(this.KEYS.CART_DISCOUNT)) {
      this.saveCartDiscount({ type: 'none', value: 0 });
    }
  },

  // ------------------ BUDGET ------------------
  getBudgetSettings() {
    try {
      const data = localStorage.getItem(this.KEYS.BUDGET);
      return data ? JSON.parse(data) : { monthlyLimit: 500000, emergencyReserve: 50000, userName: "Rian (Anak Rantau)" };
    } catch (e) {
      return { monthlyLimit: 500000, emergencyReserve: 50000, userName: "Rian (Anak Rantau)" };
    }
  },

  saveBudgetSettings(settings) {
    localStorage.setItem(this.KEYS.BUDGET, JSON.stringify(settings));
    this.notifyChange('budget');
  },

  // ------------------ ACTIVE CART ------------------
  getActiveCart() {
    try {
      const data = localStorage.getItem(this.KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveActiveCart(cart) {
    localStorage.setItem(this.KEYS.CART, JSON.stringify(cart));
    this.notifyChange('cart');
  },

  addCartItem(item) {
    const cart = this.getActiveCart();
    const newItem = {
      id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: item.name.trim(),
      category: item.category || 'Sembako',
      unit: item.unit || 'pcs',
      qty: Math.max(1, parseInt(item.qty, 10) || 1),
      currentPrice: parseFloat(item.currentPrice) || 0,
      lastPrice: parseFloat(item.lastPrice) || 0,
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
      const data = localStorage.getItem(this.KEYS.CART_DISCOUNT);
      return data ? JSON.parse(data) : { type: 'none', value: 0 };
    } catch (e) {
      return { type: 'none', value: 0 };
    }
  },

  saveCartDiscount(discount) {
    localStorage.setItem(this.KEYS.CART_DISCOUNT, JSON.stringify(discount));
    this.notifyChange('cart');
  },

  // ------------------ CATALOG ------------------
  getCatalog() {
    try {
      const data = localStorage.getItem(this.KEYS.CATALOG);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCatalog(catalog) {
    localStorage.setItem(this.KEYS.CATALOG, JSON.stringify(catalog));
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
      const data = localStorage.getItem(this.KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveHistory(history) {
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
    this.notifyChange('history');
  },

  /**
   * Selesaikan & Simpan Belanja Bulan Ini:
   * 1. Creates an archived shopping session record in history
   * 2. Updates 'Harga Terakhir' for all items in catalog so future comparison works automatically
   * 3. Clears active cart
   */
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

    // 1. Create history archive
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

    // 2. Update catalog: current prices become next session's lastPrice!
    cart.forEach(item => {
      this.upsertCatalogItem({
        name: item.name,
        category: item.category,
        unit: item.unit,
        lastPrice: item.currentPrice // base unit price recorded as new benchmark
      });
    });

    // 3. Reset active cart & cart discount
    this.saveActiveCart([]);
    this.saveCartDiscount({ type: 'none', value: 0 });

    return sessionRecord;
  },

  /**
   * Calculate spending per category in active cart
   */
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

  // ------------------ EVENTS ------------------
  listeners: [],
  onChange(fn) {
    this.listeners.push(fn);
  },
  notifyChange(type) {
    this.listeners.forEach(fn => fn(type));
  },

  resetDemo() {
    localStorage.removeItem(this.KEYS.BUDGET);
    localStorage.removeItem(this.KEYS.CART);
    localStorage.removeItem(this.KEYS.CATALOG);
    localStorage.removeItem(this.KEYS.HISTORY);
    localStorage.removeItem(this.KEYS.CART_DISCOUNT);
    this.init();
    this.notifyChange('all');
  }
};

window.Store = Store;
