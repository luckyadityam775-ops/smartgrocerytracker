/**
 * Supabase Database Sync Module for Smart Grocery & Budget Tracker
 * Provides PostgreSQL cloud table persistence & live realtime subscriptions
 */

const SupabaseDB = {
  isReady: false,
  realtimeChannel: null,
  isApplyingRemote: false,
  lastLocalWriteTime: 0,
  syncDebounceTimers: {},

  /**
   * Initialize Supabase Database synchronization
   */
  init() {
    if (!window.supabaseClient) {
      const client = window.initSupabaseClient ? window.initSupabaseClient() : null;
      if (!client) {
        console.info('[SupabaseDB] Menunggu Kunci API Supabase Anon...');
        return;
      }
    }

    this.isReady = true;
    console.log('[SupabaseDB] Database engine aktif.');

    // Setup Realtime Database Subscription for multi-device sync
    this.subscribeRealtime();

    // Fetch initial user data from Supabase
    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    if (user && user.id) {
      this.pullUserData(user.id);
    }
  },

  /**
   * Subscribe to Supabase Postgres Realtime changes & Instant Broadcast Channel
   */
  subscribeRealtime() {
    if (!window.supabaseClient) return;

    try {
      if (this.realtimeChannel) {
        try { window.supabaseClient.removeChannel(this.realtimeChannel); } catch (e) {}
      }

      this.realtimeChannel = window.supabaseClient
        .channel('smartgrocery_postgres_sync', {
          config: { broadcast: { self: false } }
        })
        .on('broadcast', { event: 'grocery_sync' }, ({ payload }) => {
          this.handleBroadcastRemoteChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_cart' }, (payload) => {
          this.handleCartRemoteChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_budget' }, (payload) => {
          this.handleBudgetRemoteChange(payload);
        })
        .subscribe((status) => {
          console.log('[SupabaseDB Realtime Status]', status);
          if (status === 'SUBSCRIBED') {
            const badge = document.getElementById('realtime-badge-text');
            if (badge) badge.innerText = 'LIVE CLOUD';
          }
        });
    } catch (e) {
      console.warn('[SupabaseDB] Error saat setup realtime subscription:', e);
    }
  },

  /**
   * Handle incoming instant WebSocket broadcast from another device
   */
  handleBroadcastRemoteChange(payload) {
    if (!payload || !payload.snapshot) return;
    if (this.isApplyingRemote) return;

    const myClientId = window.Realtime ? window.Realtime.clientId : null;
    if (payload.originClientId && payload.originClientId === myClientId) return;

    const snapshot = payload.snapshot;
    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    const currentUserId = user ? user.id : 'user_rian';

    const incomingUserId = payload.userId || snapshot.userId;
    if (incomingUserId && incomingUserId !== currentUserId) {
      const isSameGoogleUser = incomingUserId.startsWith('user_google_') && currentUserId.startsWith('user_google_');
      if (!isSameGoogleUser) return;
    }

    console.log('[Supabase Realtime Broadcast] Menerima update seketika dari perangkat lain:', snapshot.type);

    this.isApplyingRemote = true;
    try {
      if (window.Store) {
        window.Store.applySnapshot(snapshot);
      }
      if (window.UI) {
        window.UI.showToast('✨ Sinkronisasi Realtime: Troli diperbarui dari perangkat lain');
      }
    } finally {
      this.isApplyingRemote = false;
    }
  },

  /**
   * Handle incoming realtime payload for cart items
   */
  handleCartRemoteChange(payload) {
    if (this.isApplyingRemote) return;
    // Skip own postgres echo if this client just wrote locally
    if (Date.now() - this.lastLocalWriteTime < 2500) return;

    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    const currentUserId = user ? user.id : 'user_rian';

    const item = payload.new || payload.old;
    if (!item) return;
    if (item.user_id && item.user_id !== currentUserId) {
      const isSameGoogleUser = item.user_id.startsWith('user_google_') && currentUserId.startsWith('user_google_');
      if (!isSameGoogleUser) return;
    }

    console.log('[SupabaseDB] Menerima pembaruan troli postgres:', payload.eventType);
    
    // Pull fresh cart from Supabase and apply locally
    this.pullUserData(currentUserId);
  },

  /**
   * Handle incoming realtime payload for budget
   */
  handleBudgetRemoteChange(payload) {
    if (this.isApplyingRemote) return;
    // Skip own postgres echo if this client just wrote locally
    if (Date.now() - this.lastLocalWriteTime < 2500) return;

    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    const currentUserId = user ? user.id : 'user_rian';

    const budget = payload.new;
    if (!budget) return;
    if (budget.user_id && budget.user_id !== currentUserId) {
      const isSameGoogleUser = budget.user_id.startsWith('user_google_') && currentUserId.startsWith('user_google_');
      if (!isSameGoogleUser) return;
    }

    console.log('[SupabaseDB] Menerima pembaruan saldo dompet postgres');
    if (window.Store) {
      this.isApplyingRemote = true;
      try {
        window.Store.applySnapshot({
          type: 'budget',
          data: {
            monthlyLimit: parseFloat(budget.monthly_limit) || 500000,
            emergencyReserve: parseFloat(budget.emergency_reserve) || 50000,
            userName: budget.user_name || 'Pengguna Utama'
          }
        });
      } finally {
        this.isApplyingRemote = false;
      }
    }
  },

  /**
   * Pull complete user grocery data from Supabase
   */
  async pullUserData(userId) {
    if (!window.supabaseClient) return;
    const uid = userId || (window.Auth && window.Auth.getCurrentUser() ? window.Auth.getCurrentUser().id : 'user_rian');

    try {
      // 1. Fetch Cart Items
      let { data: cartData, error: cartErr } = await window.supabaseClient
        .from('grocery_cart')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      // Auto-migrate legacy rows if this is a newly assigned stable Google ID
      if ((!cartData || cartData.length === 0) && uid.startsWith('user_google_')) {
        const { data: legacyRows } = await window.supabaseClient
          .from('grocery_cart')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(20);
        if (legacyRows && legacyRows.length > 0) {
          cartData = legacyRows;
          await window.supabaseClient
            .from('grocery_cart')
            .update({ user_id: uid })
            .in('id', legacyRows.map(r => r.id));
        }
      }

      if (!cartErr && Array.isArray(cartData) && cartData.length > 0) {
        const localCart = cartData.map(row => ({
          id: row.id,
          name: row.name,
          category: row.category || 'Bahan Pokok',
          unit: row.unit || 'pcs',
          qty: parseFloat(row.qty) || 1,
          currentPrice: parseFloat(row.current_price) || 0,
          lastPrice: parseFloat(row.last_price) || 0,
          discountType: row.discount_type || 'none',
          discountA: parseFloat(row.discount_a) || 0,
          discountB: parseFloat(row.discount_b) || 0,
          discountNominal: parseFloat(row.discount_nominal) || 0,
          createdAt: row.created_at
        }));

        this.isApplyingRemote = true;
        try {
          if (window.Store) {
            window.Store.applySnapshot({
              type: 'cart',
              data: localCart
            });
          }
        } finally {
          this.isApplyingRemote = false;
        }
      }

      // 2. Fetch Budget
      let { data: budgetData, error: budgetErr } = await window.supabaseClient
        .from('grocery_budget')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (!budgetData && uid.startsWith('user_google_')) {
        const { data: legacyBudgets } = await window.supabaseClient
          .from('grocery_budget')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1);
        if (legacyBudgets && legacyBudgets.length > 0) {
          budgetData = legacyBudgets[0];
          await window.supabaseClient
            .from('grocery_budget')
            .upsert({
              user_id: uid,
              monthly_limit: budgetData.monthly_limit,
              emergency_reserve: budgetData.emergency_reserve,
              user_name: budgetData.user_name,
              updated_at: new Date().toISOString()
            });
        }
      }

      if (!budgetErr && budgetData) {
        this.isApplyingRemote = true;
        try {
          if (window.Store) {
            window.Store.applySnapshot({
              type: 'budget',
              data: {
                monthlyLimit: parseFloat(budgetData.monthly_limit) || 500000,
                emergencyReserve: parseFloat(budgetData.emergency_reserve) || 50000,
                userName: budgetData.user_name || 'Pengguna Utama'
              }
            });
          }
        } finally {
          this.isApplyingRemote = false;
        }
      }
    } catch (e) {
      console.warn('[SupabaseDB] Gagal menarik data:', e);
    }
  },

  /**
   * Sync a mutation snapshot to Supabase tables and send instant WebSocket broadcast
   */
  async syncSnapshot(snapshot) {
    if (!window.supabaseClient || this.isApplyingRemote) return;
    if (!snapshot || !snapshot.type) return;

    this.lastLocalWriteTime = Date.now();

    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    const userId = user ? user.id : (snapshot.userId || 'user_rian');

    // 1. Broadcast instant WebSocket message to peer devices immediately (<50ms, zero lag!)
    if (this.realtimeChannel) {
      try {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'grocery_sync',
          payload: {
            snapshot,
            userId,
            originClientId: window.Realtime ? window.Realtime.clientId : null
          }
        });
      } catch (err) {
        console.warn('[SupabaseDB] Broadcast send error:', err);
      }
    }

    // 2. Debounce heavy PostgreSQL table writes (350ms) to ensure butter-smooth 60fps UI tapping
    const key = snapshot.type;
    if (this.syncDebounceTimers[key]) {
      clearTimeout(this.syncDebounceTimers[key]);
    }

    this.syncDebounceTimers[key] = setTimeout(async () => {
      try {
        if (snapshot.type === 'cart' && Array.isArray(snapshot.data)) {
          await this.syncCartToSupabase(snapshot.data, userId);
        } else if (snapshot.type === 'budget' && snapshot.data) {
          await this.syncBudgetToSupabase(snapshot.data, userId);
        } else if (snapshot.type === 'history' && Array.isArray(snapshot.data) && snapshot.data.length > 0) {
          const latestHistory = snapshot.data[0];
          await this.syncHistoryToSupabase(latestHistory, userId);
        }
      } catch (e) {
        console.warn('[SupabaseDB] Gagal sync snapshot ke Supabase:', e);
      }
    }, 350);
  },

  /**
   * Sync active cart items array to grocery_cart table
   */
  async syncCartToSupabase(cartItems, userId) {
    if (!window.supabaseClient) return;

    // First delete old cart items for this user that are no longer in active cart
    const currentItemIds = cartItems.map(item => item.id);
    
    try {
      // 1. Delete removed items
      if (currentItemIds.length > 0) {
        await window.supabaseClient
          .from('grocery_cart')
          .delete()
          .eq('user_id', userId)
          .not('id', 'in', `(${currentItemIds.map(id => `"${id}"`).join(',')})`);
      } else {
        // Troli dikosongkan
        await window.supabaseClient
          .from('grocery_cart')
          .delete()
          .eq('user_id', userId);
        return;
      }

      // 2. Upsert existing/new items
      const rows = cartItems.map(item => ({
        id: item.id,
        user_id: userId,
        name: item.name,
        category: item.category || 'Bahan Pokok',
        unit: item.unit || 'pcs',
        qty: item.qty || 1,
        current_price: item.currentPrice || 0,
        last_price: item.lastPrice || 0,
        discount_type: item.discountType || 'none',
        discount_a: item.discountA || 0,
        discount_b: item.discountB || 0,
        discount_nominal: item.discountNominal || 0,
        updated_at: new Date().toISOString()
      }));

      const { error } = await window.supabaseClient
        .from('grocery_cart')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.warn('[SupabaseDB] Gagal upsert grocery_cart:', error.message);
      } else {
        console.log(`[SupabaseDB] Berhasil sinkron ${rows.length} item troli ke Supabase.`);
      }
    } catch (e) {
      console.warn('[SupabaseDB] Error syncCartToSupabase:', e);
    }
  },

  /**
   * Sync budget settings to grocery_budget table
   */
  async syncBudgetToSupabase(budget, userId) {
    if (!window.supabaseClient) return;

    try {
      const row = {
        user_id: userId,
        monthly_limit: budget.monthlyLimit || 500000,
        emergency_reserve: budget.emergencyReserve || 50000,
        user_name: budget.userName || 'Pengguna Utama',
        updated_at: new Date().toISOString()
      };

      const { error } = await window.supabaseClient
        .from('grocery_budget')
        .upsert(row, { onConflict: 'user_id' });

      if (error) {
        console.warn('[SupabaseDB] Gagal upsert grocery_budget:', error.message);
      } else {
        console.log('[SupabaseDB] Berhasil sinkron budget ke Supabase.');
      }
    } catch (e) {
      console.warn('[SupabaseDB] Error syncBudgetToSupabase:', e);
    }
  },

  /**
   * Sync archived shopping session to grocery_history table
   */
  async syncHistoryToSupabase(historyItem, userId) {
    if (!window.supabaseClient || !historyItem) return;

    try {
      const row = {
        id: historyItem.id || ('hist_' + Date.now()),
        user_id: userId,
        store_name: historyItem.storeName || 'Supermarket',
        transaction_date: historyItem.date || new Date().toISOString().split('T')[0],
        total_spent: historyItem.total || 0,
        total_saved: historyItem.totalSaved || 0,
        items: historyItem.items || [],
        created_at: historyItem.createdAt || new Date().toISOString()
      };

      await window.supabaseClient
        .from('grocery_history')
        .upsert(row, { onConflict: 'id' });
    } catch (e) {
      console.warn('[SupabaseDB] Error syncHistoryToSupabase:', e);
    }
  },

  /**
   * Test database connectivity and verify table existence
   */
  async testConnection() {
    if (!window.supabaseClient) {
      const client = window.initSupabaseClient ? window.initSupabaseClient() : null;
      if (!client) {
        return {
          success: false,
          code: 'NO_KEY',
          message: 'Kunci Anon API Supabase belum diisi. Masukkan kunci Anda terlebih dahulu.'
        };
      }
    }

    try {
      const { data, error } = await window.supabaseClient
        .from('grocery_cart')
        .select('id')
        .limit(1);

      if (error) {
        // Code 42P01 in Postgres means table does not exist
        if (error.code === '42P01' || error.message.includes('relation "public.grocery_cart" does not exist') || error.message.includes('does not exist')) {
          return {
            success: false,
            code: 'TABLE_NOT_FOUND',
            message: 'Tabel database belum dibuat di Supabase. Silakan jalankan script SQL Schema di SQL Editor Supabase terlebih dahulu.'
          };
        }
        return {
          success: false,
          code: error.code || 'QUERY_ERROR',
          message: 'Koneksi ke Supabase gagal: ' + error.message
        };
      }

      return {
        success: true,
        message: 'Koneksi ke Database Supabase BERHASIL! Tabel grocery_cart siap digunakan.'
      };
    } catch (e) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: 'Terjadi kesalahan jaringan: ' + e.message
      };
    }
  }
};

// Global reference
window.SupabaseDB = SupabaseDB;

// Auto-init on page load if client is already configured
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      SupabaseDB.init();
    }, 500);
  });
}
