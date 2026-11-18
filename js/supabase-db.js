/**
 * Supabase Database Sync Module for Smart Grocery & Budget Tracker
 * Provides PostgreSQL cloud table persistence & live realtime subscriptions
 */

const SupabaseDB = {
  isReady: false,
  realtimeChannel: null,
  channelStatus: 'DISCONNECTED',
  isApplyingRemote: false,
  lastLocalWriteTime: 0,
  lastBroadcastReceivedTime: 0,
  cartPullTimer: null,
  historyPullTimer: null,
  syncDebounceTimers: {},

  /**
   * Resolve deterministic unified cloud user ID.
   * All Google-authenticated users share 'user_google_shared' so HP & Laptop remain 100% in-sync.
   */
  getCloudUserId(userId = null) {
    if (userId && userId !== 'user_rian' && userId !== 'user_aditya') {
      if (String(userId).startsWith('user_google_') || String(userId).includes('@')) {
        return 'user_google_shared';
      }
      return userId;
    }
    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    if (!user) return 'user_rian';
    const id = user.id || '';
    const email = (user.email || '').toLowerCase();
    if (id.startsWith('user_google_') || user.role === 'Google User' || email.includes('@')) {
      return 'user_google_shared';
    }
    return id;
  },

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

    if (this.realtimeChannel && this.channelStatus === 'SUBSCRIBED') {
      return;
    }

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_history' }, (payload) => {
          this.handleHistoryRemoteChange(payload);
        })
        .subscribe((status, err) => {
          this.channelStatus = status;
          console.log('[SupabaseDB Realtime Status]', status, err || '');
          if (status === 'SUBSCRIBED') {
            const badge = document.getElementById('realtime-badge-text');
            if (badge) badge.innerText = 'LIVE CLOUD';
            const badgeBtn = document.getElementById('btn-realtime-status');
            if (badgeBtn) {
              badgeBtn.style.display = 'none';
              badgeBtn.classList.add('hidden');
            }
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Auto-reconnect after transient network sleep
            setTimeout(() => {
              if (this.channelStatus !== 'SUBSCRIBED') {
                this.subscribeRealtime();
              }
            }, 2000);
          }
        });
    } catch (e) {
      console.warn('[SupabaseDB] Error saat setup realtime subscription:', e);
    }
  },

  /**
   * Handle incoming instant WebSocket broadcast from another device (<30ms instant sync)
   */
  handleBroadcastRemoteChange(payload) {
    if (!payload || !payload.snapshot) return;
    if (this.isApplyingRemote) return;

    const myClientId = window.Realtime ? window.Realtime.clientId : null;
    if (payload.originClientId && payload.originClientId === myClientId) return;

    const snapshot = payload.snapshot;
    const myCloudId = this.getCloudUserId();
    const incomingUserId = payload.userId || snapshot.userId;

    if (incomingUserId && incomingUserId !== myCloudId) {
      const isBothGoogle = String(incomingUserId).startsWith('user_google_') && String(myCloudId).startsWith('user_google_');
      if (!isBothGoogle) return;
    }

    // Record time so redundant postgres replication event within 3 seconds is skipped
    this.lastBroadcastReceivedTime = Date.now();

    console.log('[Supabase Realtime Broadcast] Menerima update seketika (<25ms):', snapshot.type);

    this.isApplyingRemote = true;
    try {
      if (window.Store) {
        window.Store.applySnapshot(snapshot);
      }
    } finally {
      this.isApplyingRemote = false;
    }
  },

  /**
   * Handle incoming realtime payload for cart items (Postgres replication fallback)
   */
  handleCartRemoteChange(payload) {
    if (this.isApplyingRemote) return;
    // Skip if this client wrote locally recently (< 1500ms)
    if (Date.now() - this.lastLocalWriteTime < 1500) return;
    // Skip if we just received the exact instant WebSocket broadcast (< 3000ms)
    if (Date.now() - this.lastBroadcastReceivedTime < 3000) return;

    const myCloudId = this.getCloudUserId();
    const item = payload.new || payload.old;
    if (!item) return;
    if (item.user_id && item.user_id !== myCloudId) {
      const isBothGoogle = String(item.user_id).startsWith('user_google_') && String(myCloudId).startsWith('user_google_');
      if (!isBothGoogle) return;
    }

    console.log('[SupabaseDB] Menerima pembaruan troli postgres (fallback):', payload.eventType);
    this.debouncePullCart(myCloudId);
  },

  /**
   * Debounce cart table pull to prevent multiple rapid roundtrips
   */
  debouncePullCart(userId) {
    if (this.cartPullTimer) clearTimeout(this.cartPullTimer);
    this.cartPullTimer = setTimeout(() => {
      this.pullCartOnly(userId);
    }, 60);
  },

  /**
   * Pull ONLY active cart table from Supabase (fast single-query sync)
   */
  async pullCartOnly(userId) {
    if (!window.supabaseClient || this.isApplyingRemote) return;
    const uid = this.getCloudUserId(userId);
    try {
      const { data: cartData, error } = await window.supabaseClient
        .from('grocery_cart')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(cartData)) {
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
    } catch (e) {
      console.warn('[SupabaseDB] Error pullCartOnly:', e);
    }
  },

  /**
   * Handle incoming realtime payload for budget
   */
  handleBudgetRemoteChange(payload) {
    if (this.isApplyingRemote) return;
    // Skip own postgres echo if this client just wrote locally
    if (Date.now() - this.lastLocalWriteTime < 1500) return;

    const myCloudId = this.getCloudUserId();
    const budget = payload.new;
    if (!budget) return;
    if (budget.user_id && budget.user_id !== myCloudId) {
      const isBothGoogle = String(budget.user_id).startsWith('user_google_') && String(myCloudId).startsWith('user_google_');
      if (!isBothGoogle) return;
    }

    console.log('[SupabaseDB] Menerima pembaruan saldo dompet postgres (instant)');
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
   * Handle incoming realtime payload for shopping history sessions
   */
  handleHistoryRemoteChange(payload) {
    if (this.isApplyingRemote) return;
    if (Date.now() - this.lastLocalWriteTime < 1500) return;
    if (Date.now() - this.lastBroadcastReceivedTime < 3000) return;

    const myCloudId = this.getCloudUserId();
    const item = payload.new || payload.old;
    if (!item) return;
    if (item.user_id && item.user_id !== myCloudId) {
      const isBothGoogle = String(item.user_id).startsWith('user_google_') && String(myCloudId).startsWith('user_google_');
      if (!isBothGoogle) return;
    }

    console.log('[SupabaseDB] Menerima pembaruan riwayat postgres:', payload.eventType);
    this.debouncePullHistory(myCloudId);
  },

  /**
   * Debounce history table pull
   */
  debouncePullHistory(userId) {
    if (this.historyPullTimer) clearTimeout(this.historyPullTimer);
    this.historyPullTimer = setTimeout(() => {
      this.pullHistoryOnly(userId);
    }, 100);
  },

  /**
   * Pull ONLY history table from Supabase
   */
  async pullHistoryOnly(userId) {
    if (!window.supabaseClient || this.isApplyingRemote) return;
    const uid = this.getCloudUserId(userId);
    try {
      const { data: historyData, error } = await window.supabaseClient
        .from('grocery_history')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(historyData)) {
        const monthNames = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const localHistory = historyData.map(row => {
          let mName = 'Belanja Bulanan';
          if (row.transaction_date) {
            const p = row.transaction_date.split('-');
            if (p.length === 3) {
              const mIdx = parseInt(p[1], 10) - 1;
              if (mIdx >= 0 && mIdx < 12) mName = `${monthNames[mIdx]} ${p[0]}`;
            }
          }
          return {
            id: row.id,
            date: row.transaction_date || new Date().toISOString().split('T')[0],
            monthName: mName,
            totalAmount: parseFloat(row.total_spent) || 0,
            totalSavings: parseFloat(row.total_saved) || 0,
            itemCount: Array.isArray(row.items) ? row.items.reduce((s, it) => s + (it.qty || 1), 0) : 0,
            status: "Selesai Belanja",
            items: row.items || [],
            createdAt: row.created_at
          };
        });

        this.isApplyingRemote = true;
        try {
          if (window.Store) {
            window.Store.applySnapshot({
              type: 'history',
              data: localHistory
            });
          }
        } finally {
          this.isApplyingRemote = false;
        }
      }
    } catch (e) {
      console.warn('[SupabaseDB] Error pullHistoryOnly:', e);
    }
  },

  /**
   * Pull complete user grocery data from Supabase (Cart, Budget, History)
   */
  async pullUserData(userId) {
    if (!window.supabaseClient) return;
    const uid = this.getCloudUserId(userId);

    try {
      // 1. Fetch Cart Items
      let { data: cartData, error: cartErr } = await window.supabaseClient
        .from('grocery_cart')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (!cartErr && Array.isArray(cartData)) {
        if (cartData.length === 0) {
          this.isApplyingRemote = true;
          try {
            if (window.Store) {
              window.Store.applySnapshot({
                type: 'cart',
                data: []
              });
            }
          } finally {
            this.isApplyingRemote = false;
          }
        } else {
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

      // 3. Fetch History Sessions
      let { data: historyData, error: histErr } = await window.supabaseClient
        .from('grocery_history')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (!histErr && Array.isArray(historyData)) {
        const monthNames = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const localHistory = historyData.map(row => {
          let mName = 'Belanja Bulanan';
          if (row.transaction_date) {
            const p = row.transaction_date.split('-');
            if (p.length === 3) {
              const mIdx = parseInt(p[1], 10) - 1;
              if (mIdx >= 0 && mIdx < 12) mName = `${monthNames[mIdx]} ${p[0]}`;
            }
          }
          return {
            id: row.id,
            date: row.transaction_date || new Date().toISOString().split('T')[0],
            monthName: mName,
            totalAmount: parseFloat(row.total_spent) || 0,
            totalSavings: parseFloat(row.total_saved) || 0,
            itemCount: Array.isArray(row.items) ? row.items.reduce((s, it) => s + (it.qty || 1), 0) : 0,
            status: "Selesai Belanja",
            items: row.items || [],
            createdAt: row.created_at
          };
        });

        this.isApplyingRemote = true;
        try {
          if (window.Store) {
            window.Store.applySnapshot({
              type: 'history',
              data: localHistory
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

    const cloudUserId = this.getCloudUserId();

    // 1. Broadcast instant WebSocket message to peer devices immediately (0ms delay, <25ms arrival!)
    if (this.realtimeChannel) {
      try {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'grocery_sync',
          payload: {
            snapshot,
            userId: cloudUserId,
            originClientId: window.Realtime ? window.Realtime.clientId : null,
            timestamp: Date.now()
          }
        });
      } catch (err) {
        console.warn('[SupabaseDB] Broadcast send error:', err);
      }
    }

    // 2. Debounce PostgreSQL disk writes (100ms) for snappy responsive responsiveness
    const key = snapshot.type;
    if (this.syncDebounceTimers[key]) {
      clearTimeout(this.syncDebounceTimers[key]);
    }

    this.syncDebounceTimers[key] = setTimeout(async () => {
      try {
        if (snapshot.type === 'cart' && Array.isArray(snapshot.data)) {
          await this.syncCartToSupabase(snapshot.data, cloudUserId);
        } else if (snapshot.type === 'budget' && snapshot.data) {
          await this.syncBudgetToSupabase(snapshot.data, cloudUserId);
        } else if (snapshot.type === 'history' && Array.isArray(snapshot.data) && snapshot.data.length > 0) {
          const latestHistory = snapshot.data[0];
          await this.syncHistoryToSupabase(latestHistory, cloudUserId);
        }
      } catch (e) {
        console.warn('[SupabaseDB] Gagal sync snapshot ke Supabase:', e);
      }
    }, 100);
  },

  /**
   * Sync active cart items array to grocery_cart table (optimized upsert + prune)
   */
  async syncCartToSupabase(cartItems, userId) {
    if (!window.supabaseClient) return;
    const uid = this.getCloudUserId(userId);

    try {
      if (!cartItems || cartItems.length === 0) {
        await window.supabaseClient
          .from('grocery_cart')
          .delete()
          .eq('user_id', uid);
        return;
      }

      // Upsert active cart items
      const rows = cartItems.map(item => ({
        id: item.id,
        user_id: uid,
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

      await window.supabaseClient
        .from('grocery_cart')
        .upsert(rows, { onConflict: 'id' });

      // Clean up any removed items
      const currentItemIds = cartItems.map(item => item.id);
      if (currentItemIds.length > 0) {
        await window.supabaseClient
          .from('grocery_cart')
          .delete()
          .eq('user_id', uid)
          .not('id', 'in', `(${currentItemIds.join(',')})`);
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
    const uid = this.getCloudUserId(userId);

    try {
      const row = {
        user_id: uid,
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
    const uid = this.getCloudUserId(userId);

    try {
      const totalSpent = Number(historyItem.totalAmount || historyItem.total || historyItem.totalSpent || 0);
      const totalSaved = Number(historyItem.totalSavings || historyItem.totalSaved || 0);

      const row = {
        id: historyItem.id || ('session_' + Date.now()),
        user_id: uid,
        store_name: historyItem.storeName || 'Supermarket',
        transaction_date: historyItem.date || new Date().toISOString().split('T')[0],
        total_spent: totalSpent,
        total_saved: totalSaved,
        items: historyItem.items || [],
        created_at: historyItem.createdAt || new Date().toISOString()
      };

      await window.supabaseClient
        .from('grocery_history')
        .upsert(row, { onConflict: 'id' });
      console.log('[SupabaseDB] Riwayat belanja berhasil disimpan ke Supabase:', totalSpent);
    } catch (e) {
      console.warn('[SupabaseDB] Error syncHistoryToSupabase:', e);
    }
  },

  /**
   * Delete shopping history record from grocery_history table
   */
  async deleteHistoryFromSupabase(sessionId) {
    if (!window.supabaseClient || !sessionId) return;
    try {
      await window.supabaseClient
        .from('grocery_history')
        .delete()
        .eq('id', sessionId);
      console.log('[SupabaseDB] Catatan riwayat dihapus dari Supabase:', sessionId);
    } catch (e) {
      console.warn('[SupabaseDB] Error deleteHistoryFromSupabase:', e);
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
  function startSupabaseDB() {
    if (window.SupabaseDB && !window.SupabaseDB.isReady) {
      window.SupabaseDB.init();
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(startSupabaseDB, 150);
    });
  } else {
    setTimeout(startSupabaseDB, 50);
  }

  // Re-connect and pull immediately when user unlocks phone or switches back to tab
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && window.SupabaseDB) {
        if (window.SupabaseDB.channelStatus !== 'SUBSCRIBED') {
          window.SupabaseDB.subscribeRealtime();
        }
        window.SupabaseDB.pullUserData();
      }
    });
  }

  window.addEventListener('online', () => {
    if (window.SupabaseDB) {
      window.SupabaseDB.subscribeRealtime();
      window.SupabaseDB.pullUserData();
    }
  });
}
