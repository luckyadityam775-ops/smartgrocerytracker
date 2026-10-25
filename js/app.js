/**
 * Main Application Orchestrator for Smart Grocery & Budget Safety Tracker
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize auth & data store
  if (window.Auth) window.Auth.init();
  Store.init();

  // 2. Initial UI render
  UI.render();

  // 3. React to Store & Auth updates automatically
  Store.onChange(() => {
    UI.render();
  });
  if (window.Auth) {
    window.Auth.onAuthChange(() => {
      UI.render();
    });
  }

  // 4. Bind Bottom Navigation Bar
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      UI.switchTab(tab);
    });
  });

  // 5. Handle URL parameters (e.g. shortcuts or PWA links)
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab');
  const requestedAction = urlParams.get('action');

  if (requestedTab && ['belanja', 'riwayat', 'anggaran'].includes(requestedTab)) {
    UI.switchTab(requestedTab);
  } else {
    UI.switchTab('belanja');
  }

  if (requestedAction === 'quickadd') {
    setTimeout(() => {
      UI.openAddItemModal();
    }, 200);
  }

  // 6. Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // 7. PWA Install Prompt Handler
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBanner = document.getElementById('pwa-install-banner');
    if (installBanner) {
      installBanner.classList.remove('hidden');
      const btnInstall = document.getElementById('btn-pwa-install');
      if (btnInstall) {
        btnInstall.addEventListener('click', () => {
          installBanner.classList.add('hidden');
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('[PWA] User accepted the install prompt');
            }
            deferredPrompt = null;
          });
        });
      }
      const btnDismiss = document.getElementById('btn-pwa-dismiss');
      if (btnDismiss) {
        btnDismiss.addEventListener('click', () => {
          installBanner.classList.add('hidden');
        });
      }
    }
  });

  // 8. Log initial ready status
  console.log('Smart Grocery & Budget Safety Tracker Initialized successfully.');
});
