/**
 * Realtime & onSnapshot Synchronization Engine for Smart Grocery Tracker
 * Dual-Engine:
 * 1. BroadcastChannel & Storage Event Engine (Zero-config instant multi-tab & cross-window live sync)
 * 2. Firebase Firestore onSnapshot Engine (Cross-device cloud realtime over the internet)
 */

(function () {
  const CLIENT_ID = 'client_' + Math.random().toString(36).substring(2, 9);
  const CHANNEL_NAME = 'smartgrocery_realtime_channel_v1';
  const FIREBASE_CONFIG_KEY = 'smartgrocery_firebase_config';

  let broadcastChannel = null;
  const snapshotListeners = [];
  let firestoreDb = null;
  let firestoreUnsubscribers = [];
  let isFirestoreActive = false;

  const Realtime = {
    clientId: CLIENT_ID,

    /**
     * Initialize Realtime Engine
     */
    init() {
      // 1. Initialize BroadcastChannel if supported
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
          broadcastChannel.onmessage = (event) => {
            this.handleIncomingMessage(event.data, 'broadcast');
          };
        } catch (err) {
          console.warn('[Realtime] BroadcastChannel init error:', err);
        }
      }

      // 2. Storage event listener (fallback & cross-window sync)
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', (e) => {
          if (e.key && e.key.startsWith('smartgrocery_')) {
            const user = window.Auth ? window.Auth.getCurrentUser() : null;
            const uid = user ? user.id : 'user_rian';
            if (e.key.includes(uid)) {
              let type = 'cart';
              if (e.key.includes('_budget')) type = 'budget';
              if (e.key.includes('_history')) type = 'history';
              if (e.key.includes('_catalog')) type = 'catalog';
              if (e.key.includes('_cart_discount')) type = 'cart_discount';

              this.dispatchSnapshot({
                type,
                source: 'storage_event',
                originClientId: 'external_window',
                timestamp: Date.now()
              });
            }
          }
        });
      }

      // 3. Initialize Firebase Firestore if configured
      this.initFirestoreIfConfigured();

      console.log(`[Realtime] Engine ready (Client ID: ${CLIENT_ID})`);
    },

    /**
     * Subscribe to onSnapshot changes (Firestore pattern)
     * @param {Function} callback (snapshot) => void
     * @returns {Function} Unsubscribe function
     */
    onSnapshot(callback) {
      if (typeof callback !== 'function') return () => {};
      snapshotListeners.push(callback);
      return () => {
        const index = snapshotListeners.indexOf(callback);
        if (index !== -1) snapshotListeners.splice(index, 1);
      };
    },

    /**
     * Broadcast a local mutation snapshot to other tabs and Firestore
     * @param {string} type 'cart' | 'budget' | 'history' | 'cart_discount' | 'catalog'
     * @param {any} data
     */
    broadcast(type, data) {
      const user = window.Auth ? window.Auth.getCurrentUser() : null;
      const snapshot = {
        type,
        data,
        source: 'local',
        originClientId: CLIENT_ID,
        userId: user ? user.id : 'user_rian',
        timestamp: Date.now()
      };

      // 1. Notify local in-memory listeners
      this.dispatchSnapshot(snapshot);

      // 2. Send through BroadcastChannel to other tabs/windows
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage(snapshot);
        } catch (e) {
          console.warn('[Realtime] BroadcastChannel postMessage error:', e);
        }
      }

      // 3. Sync to Firebase Firestore if connected
      if (isFirestoreActive && firestoreDb) {
        this.syncToFirestore(snapshot);
      }
    },

    /**
     * Handle incoming snapshot from another tab or window
     */
    handleIncomingMessage(snapshot, sourceName) {
      if (!snapshot) return;
      // Prevent echoing back messages originating from this exact client tab
      if (snapshot.originClientId === CLIENT_ID) return;

      snapshot.source = sourceName || 'broadcast';

      // Verify the update belongs to currently active user
      const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
      const currentUid = currentUser ? currentUser.id : 'user_rian';
      if (snapshot.userId && snapshot.userId !== currentUid) {
        return; // Ignore updates meant for another logged-in profile
      }

      // Apply snapshot to local memory store
      if (window.Store && typeof window.Store.applySnapshot === 'function') {
        window.Store.applySnapshot(snapshot);
      }

      // Notify registered onSnapshot listeners
      this.dispatchSnapshot(snapshot);
    },

    /**
     * Dispatch snapshot event to all subscribers
     */
    dispatchSnapshot(snapshot) {
      snapshotListeners.forEach((fn) => {
        try {
          fn(snapshot);
        } catch (err) {
          console.error('[Realtime] Listener execution error:', err);
        }
      });
    },

    // -------------------------------------------------------------
    // FIREBASE FIRESTORE ON_SNAPSHOT INTEGRATION
    // -------------------------------------------------------------

    /**
     * Get saved Firebase configuration from local storage
     */
    getFirebaseConfig() {
      try {
        const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Save Firebase configuration and initialize connection
     */
    saveFirebaseConfig(config) {
      if (!config) {
        localStorage.removeItem(FIREBASE_CONFIG_KEY);
        this.disconnectFirestore();
        return false;
      }
      localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
      return this.initFirestoreIfConfigured();
    },

    /**
     * Initialize Firebase Firestore with onSnapshot listeners
     */
    initFirestoreIfConfigured() {
      const config = this.getFirebaseConfig();
      if (!config || !config.apiKey || !config.projectId) {
        isFirestoreActive = false;
        return false;
      }

      if (typeof firebase === 'undefined') {
        console.warn('[Realtime] Firebase SDK not loaded in page.');
        return false;
      }

      try {
        // Initialize or retrieve existing Firebase app
        let app;
        if (!firebase.apps.length) {
          app = firebase.initializeApp(config);
        } else {
          app = firebase.app();
        }

        firestoreDb = firebase.firestore(app);
        isFirestoreActive = true;
        this.attachFirestoreSnapshots();
        console.log('[Realtime] Connected to Cloud Firestore successfully!');
        return true;
      } catch (err) {
        console.error('[Realtime] Firestore connection failed:', err);
        isFirestoreActive = false;
        return false;
      }
    },

    /**
     * Attach Firestore .onSnapshot() listeners to collections
     */
    attachFirestoreSnapshots() {
      if (!firestoreDb) return;
      this.disconnectFirestoreListeners();

      const user = window.Auth ? window.Auth.getCurrentUser() : null;
      const uid = user ? user.id : 'user_rian';

      try {
        // 1. Listen on activeCart document snapshot
        const cartDocRef = firestoreDb.collection('smartgrocery_users').doc(uid).collection('state').doc('cart');
        const unsubCart = cartDocRef.onSnapshot((docSnapshot) => {
          if (docSnapshot.exists) {
            const data = docSnapshot.data();
            if (data && data.originClientId !== CLIENT_ID) {
              const snapshot = {
                type: 'cart',
                data: data.items || [],
                discount: data.discount || { type: 'none', value: 0 },
                source: 'firestore',
                originClientId: data.originClientId || 'remote_firestore',
                userId: uid,
                timestamp: Date.now()
              };
              if (window.Store && typeof window.Store.applySnapshot === 'function') {
                window.Store.applySnapshot(snapshot);
              }
              this.dispatchSnapshot(snapshot);
            }
          }
        }, (err) => {
          console.warn('[Realtime Firestore Cart Error]:', err);
        });
        firestoreUnsubscribers.push(unsubCart);

        // 2. Listen on budgetSettings document snapshot
        const budgetDocRef = firestoreDb.collection('smartgrocery_users').doc(uid).collection('state').doc('budget');
        const unsubBudget = budgetDocRef.onSnapshot((docSnapshot) => {
          if (docSnapshot.exists) {
            const data = docSnapshot.data();
            if (data && data.originClientId !== CLIENT_ID) {
              const snapshot = {
                type: 'budget',
                data: data.settings || {},
                source: 'firestore',
                originClientId: data.originClientId || 'remote_firestore',
                userId: uid,
                timestamp: Date.now()
              };
              if (window.Store && typeof window.Store.applySnapshot === 'function') {
                window.Store.applySnapshot(snapshot);
              }
              this.dispatchSnapshot(snapshot);
            }
          }
        }, (err) => {
          console.warn('[Realtime Firestore Budget Error]:', err);
        });
        firestoreUnsubscribers.push(unsubBudget);

      } catch (e) {
        console.warn('[Realtime] Error attaching Firestore onSnapshot listeners:', e);
      }
    },

    /**
     * Push update to Firestore
     */
    syncToFirestore(snapshot) {
      if (!firestoreDb || !isFirestoreActive) return;
      const user = window.Auth ? window.Auth.getCurrentUser() : null;
      const uid = user ? user.id : 'user_rian';

      try {
        if (snapshot.type === 'cart') {
          const cart = window.Store ? window.Store.getActiveCart() : [];
          const discount = window.Store ? window.Store.getCartDiscount() : {};
          firestoreDb.collection('smartgrocery_users').doc(uid).collection('state').doc('cart').set({
            items: cart,
            discount: discount,
            originClientId: CLIENT_ID,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } else if (snapshot.type === 'budget') {
          const budget = window.Store ? window.Store.getBudgetSettings() : {};
          firestoreDb.collection('smartgrocery_users').doc(uid).collection('state').doc('budget').set({
            settings: budget,
            originClientId: CLIENT_ID,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      } catch (err) {
        console.warn('[Realtime] Failed to sync update to Firestore:', err);
      }
    },

    /**
     * Disconnect existing listeners
     */
    disconnectFirestoreListeners() {
      firestoreUnsubscribers.forEach((unsub) => {
        try {
          if (typeof unsub === 'function') unsub();
        } catch (e) {}
      });
      firestoreUnsubscribers = [];
    },

    /**
     * Fully disconnect Firebase
     */
    disconnectFirestore() {
      this.disconnectFirestoreListeners();
      firestoreDb = null;
      isFirestoreActive = false;
    },

    /**
     * Get current status of Realtime engine
     */
    getStatus() {
      return {
        clientId: CLIENT_ID,
        broadcastChannelAvailable: !!broadcastChannel,
        channelName: CHANNEL_NAME,
        isFirestoreActive: isFirestoreActive,
        hasFirebaseConfig: !!this.getFirebaseConfig()
      };
    }
  };

  window.Realtime = Realtime;
})();
