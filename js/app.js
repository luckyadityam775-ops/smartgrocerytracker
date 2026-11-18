/**
 * Main Application Orchestrator for Smart Grocery & Budget Safety Tracker
 * Bulletproof multi-trigger bootloader compatible with Live Server, PWA, and direct file access.
 */

function bootApp() {
  if (window.__APP_BOOTED__) return;
  window.__APP_BOOTED__ = true;

  console.log('[Boot] Initializing Smart Grocery & Budget Safety Tracker...');

  // 1. Initialize auth, realtime & data store safely
  try {
    if (window.Auth && typeof window.Auth.init === 'function') {
      window.Auth.init();
    }
  } catch (e) {
    console.error('[Boot] Auth.init error:', e);
  }

  try {
    if (window.Realtime && typeof window.Realtime.init === 'function') {
      window.Realtime.init();
    }
  } catch (e) {
    console.error('[Boot] Realtime.init error:', e);
  }

  try {
    if (window.Store && typeof window.Store.init === 'function') {
      window.Store.init();
    }
  } catch (e) {
    console.error('[Boot] Store.init error:', e);
  }

  // 2. Initial UI render
  try {
    if (window.UI && typeof window.UI.render === 'function') {
      window.UI.render();
    }
  } catch (e) {
    console.error('[Boot] UI.render error:', e);
  }

  // 3. React to Store & Auth updates automatically
  try {
    if (window.Store && typeof window.Store.onChange === 'function') {
      window.Store.onChange(() => {
        if (window.UI && typeof window.UI.render === 'function') {
          window.UI.render();
        }
      });
    }

    if (window.Auth && typeof window.Auth.onAuthChange === 'function') {
      window.Auth.onAuthChange(() => {
        if (window.UI && typeof window.UI.render === 'function') {
          window.UI.render();
        }
        if (window.Realtime && typeof window.Realtime.attachFirestoreSnapshots === 'function') {
          window.Realtime.attachFirestoreSnapshots();
        }
      });
    }

    // 3b. React to Realtime onSnapshot updates from other tabs or Cloud Firestore
    if (window.Store && typeof window.Store.onSnapshot === 'function') {
      window.Store.onSnapshot((snapshot) => {
        if (snapshot.source !== 'local') {
          if (window.UI && typeof window.UI.render === 'function') {
            window.UI.render();
            const sourceLabel = snapshot.source === 'firestore' ? 'Cloud Firestore' : 'Multi-Tab Realtime';
            if (typeof window.UI.showToast === 'function') {
              window.UI.showToast(`⚡ Sinkronisasi ${sourceLabel}: Data diperbarui seketika!`);
            }
          }
        }
      });
    }
  } catch (e) {
    console.warn('[Boot] Error binding store listeners:', e);
  }

  // 4. Bind Bottom Navigation Bar
  try {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (window.UI && typeof window.UI.switchTab === 'function') {
          window.UI.switchTab(tab);
        }
      });
    });
  } catch (e) {
    console.warn('[Boot] Error binding nav bar:', e);
  }

  // 5. Handle URL parameters (e.g. shortcuts or PWA links)
  try {
    const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
    const requestedTab = urlParams ? urlParams.get('tab') : null;
    const requestedAction = urlParams ? urlParams.get('action') : null;

    if (requestedTab && ['belanja', 'rencana', 'riwayat', 'anggaran'].includes(requestedTab)) {
      if (window.UI && typeof window.UI.switchTab === 'function') {
        window.UI.switchTab(requestedTab);
      }
    } else {
      if (window.UI && typeof window.UI.switchTab === 'function') {
        window.UI.switchTab('belanja');
      }
    }

    if (requestedAction === 'quickadd' && window.Auth && window.Auth.getCurrentUser()) {
      setTimeout(() => {
        if (window.UI && typeof window.UI.openAddItemModal === 'function') {
          window.UI.openAddItemModal();
        }
      }, 200);
    }
  } catch (e) {
    console.warn('[Boot] Error handling URL params:', e);
  }

  // 6. Register Service Worker for PWA
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    } catch (e) { }
  }

  // PWA ready
  console.log('[PWA] GrocerySafe app initialized.');

  console.log('Smart Grocery & Budget Safety Tracker Initialized successfully.');
}

// Multi-trigger bootloader to guarantee execution across all browsers and Live Server
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
  } else {
    bootApp();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', bootApp);
  // Additional safety timeout in case of delayed DOM injection
  setTimeout(bootApp, 100);
}
