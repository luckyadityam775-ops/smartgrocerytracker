/**
 * UI Renderer Module for Smart Grocery & Budget Safety Tracker
 * High aesthetics, mobile ergonomics, thumb-friendly targets, and reactive rendering.
 */

const UI = {
  createIcons() {
    if (typeof window !== 'undefined' && window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (e) { console.warn('[Lucide]', e); }
    }
  },
  activeTab: 'belanja',
  hapticTriggered: false,

  /**
   * Trigger haptic vibration if supported on mobile device
   * @param {Array<number>|number} pattern 
   */
  vibrate(pattern = 50) {
    // Disabled physical motor vibration to prevent hardware jitter & tap latency
    return;
  },

  /**
   * Render Top Sticky Budget Safety Cap Header [F-05]
   */
  renderBudgetHeader(summary) {
    const container = document.getElementById('sticky-budget-header');
    if (!container) return;

    // Budget Safety Cap hanya dimunculkan di menu Belanja saja
    if (this.activeTab && this.activeTab !== 'belanja') {
      container.classList.add('hidden');
      return;
    }

    const {
      budgetLimit,
      grandTotal,
      remainingBudget,
      budgetUsagePercent,
      safetyStatus,
      statusLabel,
      isOverbudget,
      allSavings
    } = summary;

    // Colors and visual alerts [SRS F-05]
    let barColor = 'bg-emerald-500';
    let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    let balanceTextColor = 'text-emerald-400';
    let headerBorder = 'border-slate-800';
    let containerBg = 'glass-panel';
    let shakeClass = '';

    if (safetyStatus === 'warning') {
      barColor = 'bg-amber-500';
      badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      balanceTextColor = 'text-amber-400';
      headerBorder = 'border-amber-500/60';
      containerBg = 'bg-slate-900/95';
    } else if (safetyStatus === 'danger') {
      barColor = 'bg-rose-500 animate-pulse';
      badgeBg = 'bg-rose-500/30 text-rose-200 border-rose-500/50';
      balanceTextColor = 'text-rose-400 font-extrabold';
      headerBorder = 'border-rose-500';
      containerBg = 'bg-rose-950/95 shadow-2xl shadow-rose-950/80';
      shakeClass = ''; // Header remains stable without jitter
    }

    container.className = `sticky top-0 z-30 ${containerBg} backdrop-blur-md border-b ${headerBorder} px-3.5 py-2 transition-all duration-300 shadow-md`;

    container.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <div class="flex items-center gap-1.5">
          <span class="inline-flex items-center justify-center w-5 h-5 rounded-md ${safetyStatus === 'danger' ? 'bg-rose-500 text-white' : safetyStatus === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}">
            <i data-lucide="${safetyStatus === 'danger' ? 'alert-triangle' : 'shield-check'}" class="w-3.5 h-3.5"></i>
          </span>
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300">Budget Safety Cap</span>
        </div>
        <button id="btn-quick-edit-budget" class="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 touch-scale border border-slate-700">
          <i data-lucide="edit-3" class="w-2.5 h-2.5 text-emerald-400"></i>
          <span>Ubah Batas</span>
        </button>
      </div>

      <!-- Main Balance Equation [Batas Saldo] - [Total Belanja] = [Sisa Saldo] -->
      <div class="grid grid-cols-3 gap-1 text-center bg-slate-900/90 rounded-xl py-1.5 px-1.5 border ${safetyStatus === 'danger' ? 'border-rose-500/50' : 'border-slate-800/80'} shadow-inner">
        <div class="flex flex-col items-center justify-center">
          <span class="text-[9px] text-slate-400 uppercase font-semibold">Batas Saldo</span>
          <span class="text-[11px] sm:text-xs font-bold text-slate-200 truncate max-w-full">${Calculator.formatRupiah(budgetLimit)}</span>
        </div>
        <div class="flex flex-col items-center justify-center border-x border-slate-800">
          <span class="text-[9px] text-slate-400 uppercase font-semibold">Total Belanja</span>
          <span class="text-[11px] sm:text-xs font-bold text-white truncate max-w-full">${Calculator.formatRupiah(grandTotal)}</span>
          ${(summary.previousMonthlySpent && summary.previousMonthlySpent > 0 && grandTotal === 0) ? `
            <span class="text-[8px] text-slate-400 leading-tight">Bulan ini: ${Calculator.formatRupiah(summary.previousMonthlySpent)}</span>
          ` : ''}
        </div>
        <div class="flex flex-col items-center justify-center">
          <span class="text-[9px] text-slate-400 uppercase font-semibold">${isOverbudget ? 'Kurang (Minus)' : 'Sisa Saldo'}</span>
          <span class="text-[11px] sm:text-xs font-extrabold ${balanceTextColor} truncate max-w-full">${Calculator.formatRupiah(remainingBudget)}</span>
        </div>
      </div>

      <!-- Visual Safety Cap Bar & Indicator -->
      <div class="mt-1.5">
        <div class="flex items-center justify-between text-[10px] mb-1">
          <div class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-semibold ${badgeBg}">
            <span class="w-1.5 h-1.5 rounded-full ${barColor}"></span>
            <span>${safetyStatus === 'danger' ? 'Bahaya (>100%)' : safetyStatus === 'warning' ? (budgetUsagePercent >= 90 ? 'Waspada (≥90%)' : 'Waspada (≥80%)') : 'Aman (Terkendali)'}</span>
          </div>
          <div class="flex items-center gap-2">
            ${allSavings > 0 ? `<span class="text-[9px] text-emerald-400 font-bold">Hemat ${Calculator.formatRupiah(allSavings)}</span>` : ''}
            <span class="font-bold text-slate-300 text-[10px]">${budgetUsagePercent}% Terpakai</span>
          </div>
        </div>
        
        <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div class="h-full rounded-full budget-bar-fill ${barColor}" style="width: ${Math.min(budgetUsagePercent, 100)}%"></div>
        </div>

        <!-- Warning Bar (≥90% / ≥80% - SRS F-05) -->
        ${safetyStatus === 'warning' ? `
          <div id="warning-budget-banner" class="mt-1.5 py-1 px-2 bg-amber-500/20 border border-amber-500/40 rounded-lg flex items-center gap-1.5 text-amber-200 text-[10px]">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 shrink-0 text-amber-400"></i>
            <span class="font-semibold leading-tight">Peringatan Waspada: Total belanja mendekati batas saldo dompet (${budgetUsagePercent >= 90 ? '≥90%' : '≥80%'})!</span>
          </div>
        ` : ''}

        <!-- Danger Banner (>100% - SRS F-05 Wajib Menyala Merah Tegas) -->
        ${safetyStatus === 'danger' ? `
          <div id="danger-budget-banner" class="mt-1.5 py-1.5 px-2 bg-rose-600 text-white rounded-lg flex items-start gap-1.5 shadow-lg shadow-rose-900/50 animate-pulse-danger">
            <i data-lucide="alert-octagon" class="w-4 h-4 shrink-0 text-white mt-0.5"></i>
            <div class="flex-1">
              <span class="text-[9px] font-black tracking-wide uppercase block">PERINGATAN BAHAYA SALDO DOMPET</span>
              <span class="text-[10px] font-bold leading-tight block">Total belanja melebihi batas saldo dompet! Kurangi kuantitas atau batalkan barang sekunder.</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    lucide.createIcons();

    // Bind quick edit budget button
    const editBtn = document.getElementById('btn-quick-edit-budget');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.openBudgetModal();
      });
    }
  },

  /**
   * Render Checkout Summary Card HTML
   */
  renderCheckoutSummaryHtml(summary) {
    const { items, grandTotal, allSavings, totalItemsCount } = summary;
    return `
      <div class="${summary.isOverbudget ? 'bg-gradient-to-r from-rose-950/70 to-slate-900/90 border-rose-500/40' : 'bg-gradient-to-r from-emerald-950/60 to-slate-900/90 border-emerald-500/20'} rounded-2xl p-4 border mb-4 shadow-xl">
        <!-- Header Rincian Pembelian Belanja -->
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
          <div class="flex items-center gap-1.5 text-xs font-bold text-white">
            <i data-lucide="receipt" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Rincian Belanja (${items.length} Macam / ${totalItemsCount} Barang)</span>
          </div>
        </div>

        <!-- Itemized Breakdown List -->
        <div class="space-y-1.5 max-h-52 overflow-y-auto pr-1 mb-3">
          ${items.map(item => `
            <div class="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/40">
              <div class="flex-1 min-w-0 pr-2">
                <span class="font-medium text-slate-200 block truncate">${item.name}</span>
                <span class="text-[10px] text-slate-400 font-mono">${item.qty} ${item.unit || 'pcs'} × ${Calculator.formatRupiah(item.discountInfo && item.discountInfo.finalPrice ? item.discountInfo.finalPrice : item.currentPrice)}</span>
              </div>
              <div class="text-right shrink-0">
                <span class="font-bold text-slate-200">${Calculator.formatRupiah(item.subtotalFinal)}</span>
                ${item.subtotalSavings > 0 ? `<span class="text-[9px] text-emerald-400 block font-semibold">-Hemat ${Calculator.formatRupiah(item.subtotalSavings)}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Grand Total Summary -->
        <div class="pt-2 border-t border-slate-800/80 space-y-1">
          <div class="flex items-center justify-between text-xs text-slate-300">
            <span>Total Item Belanja:</span>
            <span class="font-bold text-white">${totalItemsCount} barang</span>
          </div>
          ${allSavings > 0 ? `
            <div class="flex items-center justify-between text-xs text-emerald-400">
              <span>Total Hemat Promo:</span>
              <span class="font-bold">${Calculator.formatRupiah(allSavings)}</span>
            </div>
          ` : ''}
          <div class="flex items-center justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
            <span>Total Pembayaran:</span>
            <span class="text-base ${summary.isOverbudget ? 'text-rose-400 font-black' : 'text-emerald-400'}">${Calculator.formatRupiah(grandTotal)}</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render Tab 1: Belanja (Cart Items List, Store/Date Session & Controls) [SRS F-01, F-02, F-03, F-04]
   */
  renderBelanjaTab(summary) {
    const container = document.getElementById('belanja-body-container') || document.getElementById('tab-content-belanja');
    if (!container) return;

    const { items, grandTotal, allSavings, totalItemsCount } = summary;

    // Fast In-Place Update: If cart cards already exist in DOM, update values with 0ms delay!
    const existingList = document.getElementById('cart-items-list');
    const existingCards = existingList ? existingList.querySelectorAll('.glass-card[data-id]') : [];
    const existingIds = Array.from(existingCards).map(el => el.getAttribute('data-id'));
    const currentIds = items.map(i => i.id);

    const isSameStructure = existingList && items.length > 0 &&
      existingIds.length === currentIds.length &&
      currentIds.every((id, idx) => id === existingIds[idx]);

    if (isSameStructure) {
      items.forEach(item => {
        const card = existingList.querySelector(`.glass-card[data-id="${item.id}"]`);
        if (card) {
          const qtyInput = card.querySelector('.qty-input-inline');
          if (qtyInput && document.activeElement !== qtyInput) {
            qtyInput.value = item.qty;
          }
          const subtotalEl = card.querySelector('.row-subtotal-val');
          if (subtotalEl) {
            subtotalEl.textContent = Calculator.formatRupiah(item.subtotalFinal);
          }
        }
      });

      const countEl = document.getElementById('cart-header-count');
      if (countEl) countEl.textContent = totalItemsCount;

      const checkoutCard = document.getElementById('checkout-summary-card-container');
      if (checkoutCard) {
        checkoutCard.innerHTML = this.renderCheckoutSummaryHtml(summary);
        lucide.createIcons();
      }
      return;
    }

    const sessionInfo = Store.getSessionInfo ? Store.getSessionInfo() : { storeName: "Lotte Mart Grocery - Puri Indah", date: "2026-10-26" };
    const storeLocations = Store.getStoreLocations ? Store.getStoreLocations() : [
      "Lotte Mart Grocery - Puri Indah",
      "Superindo - Puri Indah",
      "Hypermart - Puri Indah",
      "Grand Lucky Superstore"
    ];
    if (sessionInfo.storeName && !storeLocations.includes(sessionInfo.storeName)) {
      storeLocations.push(sessionInfo.storeName);
    }

    let itemsHtml = '';
    if (items.length === 0) {
      const hasPriorSpent = summary.previousMonthlySpent && summary.previousMonthlySpent > 0;
      itemsHtml = `
        <div class="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div class="w-16 h-16 rounded-2xl ${hasPriorSpent ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-800/60 border border-slate-700/60 text-slate-500'} flex items-center justify-center mb-3 shadow-inner">
            <i data-lucide="${hasPriorSpent ? 'check-circle-2' : 'shopping-cart'}" class="w-8 h-8 ${hasPriorSpent ? 'text-emerald-400' : 'text-slate-400'}"></i>
          </div>
          <h3 class="text-base font-extrabold text-white mb-1">${hasPriorSpent ? 'Troli Baru Siap Belanja' : 'Troli Masih Kosong'}</h3>
          <p class="text-xs text-slate-400 max-w-xs mb-5">
            ${hasPriorSpent 
              ? `Belanja bulan ini tersimpan: <strong class="text-white">${Calculator.formatRupiah(summary.previousMonthlySpent)}</strong>. Sisa saldo dompet yang aman digunakan: <strong class="text-emerald-400 font-bold">${Calculator.formatRupiah(summary.remainingBudget)}</strong>.` 
              : 'Keranjang belanja masih kosong, silakan tambahkan barang belanja atau muat contoh 5 item belanjaan.'}
          </p>
          <div class="flex flex-col gap-2.5 w-full max-w-xs mx-auto">
            <button id="btn-load-benchmark-cart" class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/40 touch-scale transition">
              <i data-lucide="package-check" class="w-4 h-4"></i>
              <span>Muat 5 Contoh Barang Belanja</span>
            </button>
            <button id="btn-empty-add-item" class="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 touch-scale transition">
              <i data-lucide="plus-circle" class="w-4 h-4 text-emerald-400"></i>
              <span>+ Tambah Barang Manual</span>
            </button>
          </div>
        </div>
      `;
    } else {
      itemsHtml = items.map((item) => {
        const comp = Comparator.compare(item.currentPrice, item.lastPrice);
        const hasDiscount = item.discountType && item.discountType !== 'none';

        return `
          <div class="glass-card rounded-2xl p-3.5 mb-3 transition-all duration-200 relative overflow-hidden" data-id="${item.id}">
            <!-- Top Row: Product Name & Category Badge & Delete -->
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                    ${item.category || 'Bahan Pokok'}
                  </span>
                  <span class="text-[10px] text-slate-400">
                    Satuan: <strong class="text-slate-200">${item.unit || 'pcs'}</strong>
                  </span>
                </div>
                <h4 class="text-sm font-bold text-white tracking-tight leading-tight truncate">${item.name}</h4>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button class="btn-edit-item p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors touch-scale touch-target-44" data-id="${item.id}" title="Edit Barang" aria-label="Edit Barang">
                  <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
                <button class="btn-delete-item p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors touch-scale touch-target-44" data-id="${item.id}" title="Hapus Item" aria-label="Hapus Item">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Price & Comparison Badge Row [F-04] -->
            <div class="flex items-center flex-wrap gap-1.5 mb-2.5">
              <span class="text-xs text-slate-400">Harga:</span>
              <span class="text-xs font-semibold ${hasDiscount ? 'line-through text-slate-400' : 'text-slate-200'}">
                ${Calculator.formatRupiah(item.currentPrice)}
              </span>

              ${hasDiscount ? `
                <span class="text-xs font-bold text-emerald-400">
                  ${Calculator.formatRupiah(item.discountInfo.finalPrice)}
                </span>
              ` : ''}

              <!-- [F-04] Visual Comparator Badge -->
              ${Comparator.renderBadgeHtml(comp)}
            </div>

            <!-- Discount Info Tag [F-03] -->
            ${hasDiscount ? `
              <div class="mb-3 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px]">
                <span class="text-emerald-300 font-medium flex items-center gap-1">
                  <i data-lucide="badge-percent" class="w-3.5 h-3.5"></i>
                  ${item.discountInfo.formulaDescription}
                </span>
                <span class="text-emerald-400 font-bold">
                  Hemat ${Calculator.formatRupiah(item.subtotalSavings)}
                </span>
              </div>
            ` : ''}

            <!-- Bottom Row: Stepper Ramah Jempol [F-02] & Subtotal -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <!-- Thumb-Friendly Stepper (+ / -) & Direct Number Typing [SRS F-02 & UX] -->
              <div class="flex items-center gap-1.5 bg-slate-900/90 rounded-xl p-1 border border-slate-800">
                <button class="btn-qty-minus stepper-btn touch-scale" data-id="${item.id}" aria-label="Kurangi kuantitas">-</button>
                <input type="number" inputmode="numeric" min="1" class="qty-input-inline w-12 h-11 text-center bg-slate-800 text-white font-extrabold text-sm rounded-xl border border-slate-700 py-1 focus:outline-none focus:border-emerald-500" value="${item.qty}" data-id="${item.id}" aria-label="Kuantitas">
                <button class="btn-qty-plus stepper-btn touch-scale" data-id="${item.id}" aria-label="Tambah kuantitas">+</button>
              </div>

              <!-- Real-time Subtotal per Row [F-02] -->
              <div class="text-right">
                <span class="text-[10px] text-slate-400 uppercase font-medium block">Subtotal</span>
                <span class="row-subtotal-val text-sm font-extrabold text-emerald-400 leading-none" data-id="${item.id}">
                  ${Calculator.formatRupiah(item.subtotalFinal)}
                </span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="px-4 py-3">
        <!-- [SRS F-01 & F-06A] Sesi Belanja: Lokasi Toko & Selector Tanggal -->
        <div class="glass-card rounded-2xl p-3 mb-3 border border-slate-800 bg-slate-900/70 shadow-md">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <i data-lucide="store" class="w-4 h-4 text-emerald-400"></i>
              <span>Sesi Belanja Aktif</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Supermarket</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <i data-lucide="map-pin" class="w-3 h-3 text-emerald-400"></i>
                  <span>Lokasi Toko Supermarket</span>
                </label>
                <button type="button" id="btn-add-custom-store" class="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1 transition touch-scale" title="Tambah lokasi toko manual">
                  <i data-lucide="plus" class="w-3 h-3"></i>
                  <span>Tambah Toko</span>
                </button>
              </div>
              <select id="session-store-select" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500">
                ${storeLocations.map(store => `
                  <option value="${store}" ${sessionInfo.storeName === store ? 'selected' : ''}>${store}</option>
                `).join('')}
                <option value="__add_new_store__" class="text-emerald-400 font-bold">➕ + Tambah Lokasi Manual...</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <i data-lucide="calendar" class="w-3 h-3 text-emerald-400"></i>
                <span>Tanggal Belanja (Date Picker)</span>
              </label>
              <input type="date" id="session-date-picker" value="${sessionInfo.date || '2026-10-26'}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500">
            </div>
          </div>
        </div>

        <!-- Action Row above list -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <i data-lucide="shopping-bag" class="w-4 h-4 text-emerald-400"></i>
            <span>Keranjang Aktif (<strong id="cart-header-count" class="text-white">${totalItemsCount}</strong> item)</span>
          </div>

          ${items.length > 0 ? `
            <button id="btn-clear-cart" class="text-[11px] font-bold text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 touch-scale flex items-center gap-1">
              <i data-lucide="trash-2" class="w-3 h-3"></i>
              <span>Kosongkan</span>
            </button>
          ` : ''}
        </div>

        <!-- Items Container -->
        <div id="cart-items-list" class="space-y-1">
          ${itemsHtml}
        </div>

        <!-- Sticky Floating Bottom Bar for Checkout & Quick Add [F-06] -->
        ${items.length > 0 ? `
          <div class="mt-6 pt-4 border-t border-slate-800/80 pb-20">
            <!-- Pemberitahuan Merah jika Overbudget saat mau menyelesaikan belanja -->
            ${summary.isOverbudget ? `
              <div class="mb-4 p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500/80 text-rose-200 shadow-2xl shadow-rose-950/80">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-xl bg-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/50">
                    <i data-lucide="alert-octagon" class="w-5 h-5 text-rose-300"></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between flex-wrap gap-1">
                      <span class="text-xs font-black tracking-wider uppercase text-rose-300 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                        Pemberitahuan Overbudget!
                      </span>
                      <span class="text-[11px] font-extrabold text-white bg-rose-600/90 px-2 py-0.5 rounded-lg border border-rose-400/40">
                        Defisit: -${Calculator.formatRupiah(Math.abs(summary.remainingBudget))}
                      </span>
                    </div>
                    <p class="text-xs font-bold text-rose-100 mt-1.5 leading-snug">
                      Total belanja melebihi batas saldo dompet!
                    </p>
                    <p class="text-[11px] text-rose-300/90 mt-1 leading-relaxed">
                      Kurangi kuantitas atau batalkan barang sekunder sebelum menyelesaikan belanja agar saldo tetap aman.
                    </p>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Checkout Summary Card Container -->
            <div id="checkout-summary-card-container">
              ${this.renderCheckoutSummaryHtml(summary)}
            </div>

            <!-- [F-06] Primary Action: Selesaikan & Simpan Belanja Bulan Ini -->
            <button id="btn-finish-shopping" class="w-full py-3.5 px-4 rounded-2xl ${summary.isOverbudget ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-700 hover:from-rose-500 hover:to-red-600 shadow-rose-950/60' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/40'} text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg touch-scale">
              <i data-lucide="${summary.isOverbudget ? 'alert-triangle' : 'check-circle-2'}" class="w-5 h-5"></i>
              <span>${summary.isOverbudget ? 'Selesaikan Belanja (Peringatan Overbudget)' : 'Selesaikan & Simpan Belanja Bulan Ini'}</span>
            </button>
            <p class="text-[10px] text-center text-slate-400 mt-2">
              Item akan diarsipkan ke Riwayat dan memperbarui patokan harga bulan depan.
            </p>
          </div>
        ` : '<div class="pb-24"></div>'}
      </div>

      <!-- Floating Quick Add Button (Bottom Right) -->
      <button id="btn-fab-add" class="fixed bottom-20 right-4 sm:right-[calc(50%-200px)] z-20 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl shadow-emerald-500/50 flex items-center justify-center touch-scale" title="Tambah Barang" aria-label="Tambah Barang">
        <i data-lucide="plus" class="w-7 h-7 stroke-[2.5]"></i>
      </button>
    `;

    lucide.createIcons();
    this.bindBelanjaEvents();
  },

  /**
   * Bind events for Belanja Tab
   */
  bindBelanjaEvents() {
    // Session Store & Date Change Listeners [SRS F-01 & F-06A]
    const storeSelect = document.getElementById('session-store-select');
    const datePicker = document.getElementById('session-date-picker');
    const btnAddStore = document.getElementById('btn-add-custom-store');

    if (btnAddStore) {
      btnAddStore.addEventListener('click', () => {
        this.openAddCustomStoreModal();
      });
    }

    if (storeSelect && datePicker) {
      const handleSessionChange = () => {
        if (storeSelect.value === '__add_new_store__') {
          const prevStore = Store.getSessionInfo().storeName || 'Lotte Mart Grocery - Puri Indah';
          storeSelect.value = prevStore;
          this.openAddCustomStoreModal();
          return;
        }
        Store.saveSessionInfo({
          storeName: storeSelect.value,
          date: datePicker.value
        });
      };
      storeSelect.addEventListener('change', handleSessionChange);
      datePicker.addEventListener('change', handleSessionChange);
    }

    // Stepper Plus [SRS F-02]
    document.querySelectorAll('.btn-qty-plus').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        Store.updateItemQty(id, 1);
      });
    });

    // Stepper Minus [SRS F-02]
    document.querySelectorAll('.btn-qty-minus').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        Store.updateItemQty(id, -1);
      });
    });

    // Inline Quantity Numeric Input [SRS F-02: Ubah qty melalui tombol + atau mengetik angka]
    document.querySelectorAll('.qty-input-inline').forEach((input) => {
      input.addEventListener('input', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const val = parseInt(e.currentTarget.value, 10);
        if (!isNaN(val) && val >= 1) {
          Store.updateCartItem(id, { qty: val });
        }
      });
    });

    // Delete Item [SRS F-06A]
    document.querySelectorAll('.btn-delete-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        Store.removeCartItem(id);
        this.showToast('Barang berhasil dihapus dari keranjang.');
      });
    });

    // Edit Item
    document.querySelectorAll('.btn-edit-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const cart = Store.getActiveCart();
        const item = cart.find(i => i.id === id);
        if (item) {
          this.openAddItemModal(item);
        }
      });
    });

    // Empty state Add Item
    const emptyAddBtn = document.getElementById('btn-empty-add-item');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => {
        this.openAddItemModal();
      });
    }

    // Empty state Load Benchmark Cart
    const loadBenchmarkBtn = document.getElementById('btn-load-benchmark-cart');
    if (loadBenchmarkBtn) {
      loadBenchmarkBtn.addEventListener('click', () => {
        if (Store.loadStarterDemoItems) {
          Store.loadStarterDemoItems();
          this.vibrate(35);
          this.showToast('5 Barang belanja contoh berhasil dimuat!');
          this.render();
        }
      });
    }

    // Floating Add Button
    const fabAdd = document.getElementById('btn-fab-add');
    if (fabAdd) {
      fabAdd.addEventListener('click', () => {
        this.openAddItemModal();
      });
    }

    // Clear cart button with Non-Blocking In-App Modal [SRS UX: Bebas window.confirm]
    const clearBtn = document.getElementById('btn-clear-cart');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.openConfirmModal({
          title: 'Kosongkan Keranjang Belanja?',
          message: 'Seluruh barang di troli saat ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
          confirmText: 'Ya, Kosongkan',
          confirmColor: 'bg-rose-600 hover:bg-rose-500',
          onConfirm: () => {
            Store.clearActiveCart();
            this.showToast('Keranjang belanja telah dikosongkan.');
          }
        });
      });
    }

    // [F-06] Selesaikan & Simpan Belanja Bulan Ini
    const finishBtn = document.getElementById('btn-finish-shopping');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        this.openFinishShoppingModal();
      });
    }
  },

  /**
   * Render Tab: Rencana Pembelian (Shopping Wishlist & Planning)
   */
  renderRencanaTab(summary) {
    const container = document.getElementById('tab-content-rencana');
    if (!container) return;

    const plannedItems = Store.getPlannedItems ? Store.getPlannedItems() : [];
    const budget = Store.getBudgetSettings();
    const currentSpent = summary ? summary.totalSpent : 0;
    const remainingBudget = Math.max(0, budget.monthlyLimit - currentSpent);

    const totalEstimated = plannedItems.reduce((acc, p) => acc + ((p.qty || 1) * (p.estimatedPrice || 0)), 0);
    const isBudgetSufficient = totalEstimated <= remainingBudget;

    let itemsHtml = '';
    if (plannedItems.length === 0) {
      itemsHtml = `
        <div class="glass-card rounded-2xl p-8 text-center border border-slate-800">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <i data-lucide="clipboard-list" class="w-7 h-7"></i>
          </div>
          <h4 class="text-sm font-bold text-white">Belum Ada Rencana Belanja</h4>
          <p class="text-xs text-slate-400 max-w-[270px] mx-auto mt-1 leading-relaxed">
            Catat barang kebutuhan yang ingin kamu beli agar belanja lebih terencana dan tidak melebihi saldo dompet.
          </p>
          <button id="btn-empty-add-plan" class="mt-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/40 touch-scale transition inline-flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Buat Rencana Pembelian</span>
          </button>
        </div>
      `;
    } else {
      itemsHtml = plannedItems.map(item => {
        const itemTotal = (item.qty || 1) * (item.estimatedPrice || 0);
        const priorityColors = {
          'Tinggi': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          'Sedang': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          'Rendah': 'bg-sky-500/20 text-sky-300 border-sky-500/30'
        };
        const pColor = priorityColors[item.priority] || priorityColors['Sedang'];

        return `
          <div class="glass-card rounded-2xl p-3.5 mb-2.5 border border-slate-800 hover:border-slate-700 transition">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${pColor}">
                  Prioritas ${item.priority || 'Sedang'}
                </span>
                <span class="text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  ${item.category || 'Bahan Pokok'}
                </span>
              </div>
              <button class="btn-delete-plan-item p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition" data-id="${item.id}" title="Hapus Rencana">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <div class="mb-2">
              <h4 class="text-xs font-bold text-white leading-snug">${item.name}</h4>
              ${item.notes ? `<p class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><i data-lucide="file-text" class="w-3 h-3 text-slate-500"></i> ${item.notes}</p>` : ''}
            </div>

            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-400 block">${item.qty} ${item.unit || 'pcs'} × ${Calculator.formatRupiah(item.estimatedPrice)}</span>
                <span class="text-xs font-extrabold text-emerald-400">${Calculator.formatRupiah(itemTotal)}</span>
              </div>

              <button class="btn-move-plan-to-cart py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 touch-scale transition" data-id="${item.id}">
                <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                <span>+ Beli (Ke Troli)</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="px-4 py-3">
        <!-- Header Banner -->
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-base font-extrabold text-white flex items-center gap-2">
              <i data-lucide="clipboard-list" class="w-5 h-5 text-emerald-400"></i>
              <span>Rencana Pembelian</span>
            </h2>
            <p class="text-[11px] text-slate-400">Kebutuhan belanja sebelum dimasukkan ke troli</p>
          </div>
          <button id="btn-open-add-plan" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 touch-scale transition">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Rencana</span>
          </button>
        </div>

        <!-- Planning Financial Card -->
        <div class="glass-card rounded-2xl p-3.5 mb-3.5 border border-slate-800 bg-slate-900/80">
          <div class="grid grid-cols-2 gap-2 mb-2">
            <div class="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
              <span class="text-[10px] text-slate-400 block uppercase font-medium">Total Estimasi Rencana</span>
              <span class="text-sm font-extrabold text-emerald-400 mt-0.5 block">${Calculator.formatRupiah(totalEstimated)}</span>
            </div>
            <div class="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
              <span class="text-[10px] text-slate-400 block uppercase font-medium">Sisa Saldo Dompet</span>
              <span class="text-sm font-extrabold ${remainingBudget < totalEstimated ? 'text-rose-400' : 'text-slate-200'} mt-0.5 block">${Calculator.formatRupiah(remainingBudget)}</span>
            </div>
          </div>

          <div class="p-2 rounded-xl ${isBudgetSufficient ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'} text-[11px] flex items-center gap-1.5">
            <i data-lucide="${isBudgetSufficient ? 'shield-check' : 'alert-triangle'}" class="w-4 h-4 shrink-0"></i>
            <span>
              ${isBudgetSufficient
        ? `Estimasi rencana aman. Masih tersisa saldo ${Calculator.formatRupiah(remainingBudget - totalEstimated)}.`
        : `Perhatian: Estimasi rencana melebihi sisa dompet sebesar ${Calculator.formatRupiah(totalEstimated - remainingBudget)}.`}
            </span>
          </div>
        </div>

        <!-- List Section -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Daftar Rencana (${plannedItems.length} item)</span>
            ${plannedItems.length > 0 ? `
              <span class="text-[10px] text-slate-500">Klik "+ Beli" saat barang sudah di tangan</span>
            ` : ''}
          </div>
          <div>
            ${itemsHtml}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    this.bindRencanaEvents();
  },

  /**
   * Bind Events for Rencana Pembelian Tab
   */
  bindRencanaEvents() {
    // Open add plan modal
    document.getElementById('btn-open-add-plan')?.addEventListener('click', () => {
      this.openAddPlannedModal();
    });
    document.getElementById('btn-empty-add-plan')?.addEventListener('click', () => {
      this.openAddPlannedModal();
    });

    // Move to cart
    document.querySelectorAll('.btn-move-plan-to-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.getAttribute('data-id');
        if (Store.movePlanToCart) {
          const added = Store.movePlanToCart(planId);
          if (added) {
            this.vibrate(30);
            this.showToast(`"${added.name}" berhasil dipindahkan ke troli belanja!`);
            this.render();
          }
        }
      });
    });

    // Delete plan item
    document.querySelectorAll('.btn-delete-plan-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.getAttribute('data-id');
        if (Store.removePlannedItem) {
          Store.removePlannedItem(planId);
          this.vibrate(25);
          this.showToast('Barang dihapus dari rencana belanja.');
          this.render();
        }
      });
    });
  },

  /**
   * Modal: Tambah Barang ke Rencana Pembelian
   */
  openAddPlannedModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.className = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
    modalContainer.innerHTML = `
      <div class="bg-slate-900 border-t sm:border border-slate-700/80 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto space-y-4">
        
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <i data-lucide="clipboard-list" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-white">Tambah Rencana Pembelian</h3>
              <p class="text-[10px] text-slate-400">Catat kebutuhan sebelum berbelanja</p>
            </div>
          </div>
          <button id="modal-plan-close" class="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-add-plan" class="space-y-3.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Nama Barang Kebutuhan *</label>
            <input type="text" id="plan-input-name" required placeholder="Contoh: Susu UHT 1L, Sabun Cuci..." 
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500">
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Kategori</label>
              <select id="plan-input-category" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                <option value="Bahan Pokok">Bahan Pokok</option>
                <option value="Dapur & Bumbu">Dapur & Bumbu</option>
                <option value="Toiletries">Toiletries</option>
                <option value="Minuman">Minuman</option>
                <option value="Makanan Ringan">Makanan Ringan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Satuan</label>
              <input type="text" id="plan-input-unit" value="pcs" placeholder="pcs, kg, pack..." 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Target Jumlah</label>
              <input type="number" id="plan-input-qty" value="1" min="1" step="1" inputmode="numeric" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Estimasi Harga (Rp)</label>
              <input type="number" id="plan-input-price" value="15000" min="0" step="1000" inputmode="numeric" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Tingkat Prioritas</label>
            <div class="grid grid-cols-3 gap-2">
              <label class="flex items-center gap-1.5 p-2 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer text-xs">
                <input type="radio" name="plan-priority" value="Tinggi" class="text-emerald-500">
                <span class="text-rose-400 font-bold text-[11px]">Tinggi</span>
              </label>
              <label class="flex items-center gap-1.5 p-2 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer text-xs">
                <input type="radio" name="plan-priority" value="Sedang" checked class="text-emerald-500">
                <span class="text-amber-400 font-bold text-[11px]">Sedang</span>
              </label>
              <label class="flex items-center gap-1.5 p-2 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer text-xs">
                <input type="radio" name="plan-priority" value="Rendah" class="text-emerald-500">
                <span class="text-sky-400 font-bold text-[11px]">Rendah</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Catatan Tambahan (Opsional)</label>
            <input type="text" id="plan-input-notes" placeholder="Contoh: Cari merk Tropical, jangan yang botol kecil" 
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500">
          </div>

          <button type="submit" class="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 touch-scale transition">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Simpan ke Rencana Pembelian</span>
          </button>
        </form>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    const closeModal = () => {
      modalContainer.className = 'hidden';
      modalContainer.innerHTML = '';
    };

    document.getElementById('modal-plan-close')?.addEventListener('click', closeModal);

    document.getElementById('form-add-plan')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('plan-input-name').value.trim();
      const category = document.getElementById('plan-input-category').value;
      const unit = document.getElementById('plan-input-unit').value.trim() || 'pcs';
      const qty = parseInt(document.getElementById('plan-input-qty').value, 10) || 1;
      const estimatedPrice = parseFloat(document.getElementById('plan-input-price').value) || 0;
      const priority = document.querySelector('input[name="plan-priority"]:checked')?.value || 'Sedang';
      const notes = document.getElementById('plan-input-notes').value.trim();

      if (!name) {
        this.showToast('Nama barang wajib diisi.', 'error');
        return;
      }

      Store.addPlannedItem({
        name,
        category,
        unit,
        qty,
        estimatedPrice,
        priority,
        notes
      });

      this.vibrate(30);
      this.showToast(`"${name}" ditambahkan ke rencana belanja!`);
      closeModal();
      this.render();
    });
  },

  /**
   * Render Tab 2: Riwayat (History & Price Trend Chart) [F-06]
   */
  renderRiwayatTab() {
    const container = document.getElementById('tab-content-riwayat');
    if (!container) return;

    const history = Store.getHistory();

    // Generate lightweight responsive SVG Bar Chart (Agregasi per 1 Bulan Kalender)
    let chartHtml = '';
    if (history.length > 0) {
      const monthNamesIndo = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];

      // Kelompokkan seluruh transaksi belanja per bulan kalender yang sama
      const monthGroups = {};
      history.forEach(session => {
        let key = '';
        let shortLabel = '';
        let sortOrder = 0;

        if (session.date && typeof session.date === 'string') {
          const parts = session.date.split('-');
          if (parts.length >= 2) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
              key = `${y}-${String(m).padStart(2, '0')}`;
              shortLabel = monthNamesIndo[m - 1];
              sortOrder = y * 100 + m;
            }
          }
        }

        if (!key && session.monthName) {
          const mParts = session.monthName.trim().split(' ');
          const mIdx = monthNamesIndo.indexOf(mParts[0]);
          const y = parseInt(mParts[1], 10) || 2026;
          const m = mIdx >= 0 ? mIdx + 1 : 1;
          key = `${y}-${String(m).padStart(2, '0')}`;
          shortLabel = mParts[0];
          sortOrder = y * 100 + m;
        }

        if (!key) {
          key = 'current';
          shortLabel = 'Bulan Ini';
          sortOrder = 999999;
        }

        if (!monthGroups[key]) {
          monthGroups[key] = {
            key,
            label: shortLabel,
            fullLabel: session.monthName || shortLabel,
            sortOrder,
            totalAmount: 0,
            purchaseCount: 0
          };
        }

        monthGroups[key].totalAmount += (Number(session.totalAmount) || 0);
        monthGroups[key].purchaseCount += 1;
      });

      // Urutkan kronologis dari bulan terlama ke bulan terkini
      const monthlyData = Object.values(monthGroups).sort((a, b) => a.sortOrder - b.sortOrder);
      const chartData = monthlyData.slice(-5);
      const maxAmount = Math.max(...chartData.map(h => h.totalAmount), 300000);
      const containerJustify = chartData.length <= 2 ? 'justify-center' : 'justify-around';

      const barsHtml = chartData.map((month) => {
        const heightPercent = Math.max(16, Math.min(100, Math.round((month.totalAmount / maxAmount) * 100)));
        return `
          <div class="flex-1 max-w-[90px] flex flex-col items-center gap-1.5">
            <span class="text-[10px] font-bold text-slate-200">${Calculator.formatRupiah(month.totalAmount).replace('Rp ', '')}</span>
            <div class="w-full bg-slate-800 rounded-t-xl overflow-hidden flex items-end justify-center" style="height: 110px;">
              <div class="w-8 sm:w-10 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all duration-500 shadow-md shadow-emerald-950/40" style="height: ${heightPercent}%;"></div>
            </div>
            <span class="text-[10px] font-semibold text-slate-300 text-center truncate max-w-[65px]">${month.label}</span>
            ${month.purchaseCount > 1 ? `<span class="text-[9px] text-emerald-400/90 -mt-1 font-semibold">(${month.purchaseCount}x beli)</span>` : ''}
          </div>
        `;
      }).join('');

      chartHtml = `
        <div class="glass-card rounded-2xl p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-1.5 text-xs font-bold text-white">
              <i data-lucide="bar-chart-2" class="w-4 h-4 text-emerald-400"></i>
              <span>Trend Pengeluaran Bulanan</span>
            </div>
            <span class="text-[10px] text-slate-400">Total ${history.length} Belanja (${chartData.length} Bulan)</span>
          </div>
          <div class="flex items-end ${containerJustify} gap-4 pt-2 px-1">
            ${barsHtml}
          </div>
        </div>
      `;
    }

    let listHtml = '';
    if (history.length === 0) {
      listHtml = `
        <div class="py-12 px-4 text-center">
          <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
            <i data-lucide="calendar" class="w-8 h-8"></i>
          </div>
          <p class="text-sm font-bold text-white mb-1">Belum Ada Riwayat Belanja</p>
          <p class="text-xs text-slate-400">Setelah belanja selesai dan disimpan, riwayat belanja bulanan akan muncul di sini.</p>
        </div>
      `;
    } else {
      listHtml = history.map((record) => {
        return `
          <div class="glass-card rounded-2xl p-4 mb-3 cursor-pointer hover:border-emerald-500/40 transition-colors btn-view-receipt" data-id="${record.id}">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <span class="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-0.5">${record.date}</span>
                <h4 class="text-sm font-bold text-white">${record.monthName}</h4>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                  ${Calculator.formatRupiah(record.totalAmount)}
                </span>
                <button class="btn-delete-history-record p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition touch-scale" data-id="${record.id}" title="Hapus Riwayat Belanja">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span class="inline-flex items-center gap-1">
                <i data-lucide="package" class="w-3.5 h-3.5"></i>
                ${record.itemCount || (record.items ? record.items.length : 0)} Macam Barang
              </span>
              <span class="text-emerald-400 font-medium">
                Hemat ${Calculator.formatRupiah(record.totalSavings || 0)}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="px-4 py-4 pb-24">
        ${chartHtml}
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <i data-lucide="clock" class="w-4 h-4 text-emerald-400"></i>
          <span>Daftar Belanja Sebelumnya</span>
        </h3>
        <div class="space-y-2">
          ${listHtml}
        </div>
      </div>
    `;

    lucide.createIcons();

    // Bind receipt modal opener
    document.querySelectorAll('.btn-view-receipt').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-history-record')) return;
        const id = e.currentTarget.getAttribute('data-id');
        this.openReceiptModal(id);
      });
    });

    // Bind delete history record button
    document.querySelectorAll('.btn-delete-history-record').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute('data-id');
        this.openConfirmModal({
          title: 'Hapus Riwayat Belanja?',
          message: 'Apakah kamu yakin ingin menghapus catatan belanja ini dari Riwayat? Pengeluaran bulan ini akan otomatis disesuaikan kembali.',
          confirmText: 'Ya, Hapus',
          confirmColor: 'bg-rose-600 hover:bg-rose-500',
          onConfirm: () => {
            Store.deleteHistoryRecord(id);
            this.showToast('Catatan riwayat belanja telah dihapus.');
            this.render();
          }
        });
      });
    });
  },

  /**
   * Render Tab 3: Anggaran & Dompet
   */
  renderAnggaranTab(summary) {
    const container = document.getElementById('tab-content-anggaran');
    if (!container) return;

    const budget = Store.getBudgetSettings();
    const activeCart = Store.getActiveCart();
    const categories = Store.getCategoryBreakdown(activeCart);

    let categoriesHtml = '';
    if (categories.length === 0) {
      categoriesHtml = `
        <p class="text-xs text-slate-400 py-3 text-center">Belum ada barang di keranjang aktif.</p>
      `;
    } else {
      categoriesHtml = categories.map(cat => {
        const percent = summary.grandTotal > 0 ? Math.round((cat.total / summary.grandTotal) * 100) : 0;
        return `
          <div class="mb-3">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-medium text-slate-300">${cat.category} (${cat.count} pcs)</span>
              <span class="font-bold text-white">${Calculator.formatRupiah(cat.total)} (${percent}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;

    container.innerHTML = `
      <div class="px-4 py-4 pb-24 space-y-4">
        <!-- User Profile & Account Card -->
        <div class="glass-card rounded-2xl p-4 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-1.5 text-xs font-bold text-white">
              <i data-lucide="user-check" class="w-4 h-4 text-emerald-400"></i>
              <span>Akun Aktif</span>
            </div>
            <button id="btn-manage-account-tab" class="text-xs px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold touch-scale flex items-center gap-1">
              <i data-lucide="repeat" class="w-3 h-3"></i>
              <span>Ganti Akun</span>
            </button>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl ${currentUser?.avatarBg || 'bg-emerald-600'} text-white font-extrabold flex items-center justify-center text-sm shadow-md border border-white/20">
              ${currentUser?.avatarLetter || 'P'}
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-white leading-tight">${currentUser?.fullName || 'Pengguna Utama'}</h4>
              <p class="text-xs text-slate-400">${currentUser?.email || 'user@grocerysafe.id'}</p>
            </div>
          </div>
        </div>

        <!-- Budget Settings Card -->
        <div class="glass-card rounded-2xl p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-1.5 text-xs font-bold text-white">
              <i data-lucide="wallet" class="w-4 h-4 text-emerald-400"></i>
              <span>Pengaturan Saldo Dompet</span>
            </div>
            <button id="btn-edit-budget-tab" class="text-xs px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold touch-scale">
              Edit Anggaran
            </button>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span class="text-slate-400">Batas Anggaran Bulanan:</span>
              <span class="font-bold text-white text-sm">${Calculator.formatRupiah(budget.monthlyLimit)}</span>
            </div>
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span class="text-slate-400">Cadangan Tunai Darurat:</span>
              <span class="font-bold text-emerald-400 text-sm">${Calculator.formatRupiah(budget.emergencyReserve)}</span>
            </div>
          </div>
        </div>

        <!-- Category Distribution -->
        <div class="glass-card rounded-2xl p-4">
          <div class="flex items-center gap-1.5 text-xs font-bold text-white mb-3">
            <i data-lucide="pie-chart" class="w-4 h-4 text-emerald-400"></i>
            <span>Distribusi Belanja Berdasarkan Kategori</span>
          </div>
          ${categoriesHtml}
        </div>

        <!-- Student Survival Tips (Anak Rantau) -->
        <div class="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/30">
          <div class="flex items-center gap-2 mb-2 text-emerald-400">
            <i data-lucide="lightbulb" class="w-4 h-4"></i>
            <h4 class="text-xs font-bold uppercase tracking-wider">Tips Belanja Anak Rantau</h4>
          </div>
          <ul class="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li class="flex items-start gap-1.5">
              <span class="text-emerald-400 font-bold">•</span>
              <span><strong>Prioritaskan Sembako:</strong> Pastikan beras, minyak, dan telur diamankan dulu sebelum beralih ke snack atau minuman manis.</span>
            </li>
            <li class="flex items-start gap-1.5">
              <span class="text-emerald-400 font-bold">•</span>
              <span><strong>Waspada Diskon Bertingkat:</strong> Diskon 50% + 20% adalah 60%, bukan 70%. Selalu lihat nominal penghematan bersih di aplikasi ini.</span>
            </li>
            <li class="flex items-start gap-1.5">
              <span class="text-emerald-400 font-bold">•</span>
              <span><strong>Beli Kemasan Refill:</strong> Sabun dan deterjen refill biasanya 15-25% lebih murah dibanding botol baru.</span>
            </li>
          </ul>
        </div>

        <!-- Database Demo Reset Option -->
        <div class="text-center pt-2">
          <button id="btn-reset-demo" class="text-[11px] text-slate-400 hover:text-rose-400 underline touch-scale">
            Reset Data Simulasi (Kembali ke Awal)
          </button>
        </div>
      </div>
    `;

    lucide.createIcons();

    const manageAccBtn = document.getElementById('btn-manage-account-tab');
    if (manageAccBtn) {
      manageAccBtn.addEventListener('click', () => this.openAuthModal());
    }

    const editBtn = document.getElementById('btn-edit-budget-tab');
    if (editBtn) {
      editBtn.addEventListener('click', () => this.openBudgetModal());
    }

    const resetBtn = document.getElementById('btn-reset-demo');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.openConfirmModal({
          title: 'Reset Ulang Data?',
          message: 'Reset ulang semua data simulasi ke pengaturan awal? Data profil Anda tetap aman.',
          confirmText: 'Ya, Reset',
          confirmColor: 'bg-amber-600 hover:bg-amber-500',
          onConfirm: () => {
            Store.resetDemo();
            this.showToast('Data simulasi telah direset ke awal.');
          }
        });
      });
    }
  },

  /**
   * Generic Non-Blocking Mobile Confirmation Modal [SRS UX: Bebas window.confirm]
   */
  openConfirmModal({ title = 'Konfirmasi', message = 'Apakah Anda yakin?', confirmText = 'Ya, Lanjutkan', confirmColor = 'bg-rose-600 hover:bg-rose-500', onConfirm }) {
    const modal = document.getElementById('modal-container');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div class="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-center shadow-2xl animate-slide-up">
          <div class="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <i data-lucide="alert-circle" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-white mb-1.5">${title}</h3>
          <p class="text-xs text-slate-300 mb-5 leading-relaxed">${message}</p>
          <div class="grid grid-cols-2 gap-2.5">
            <button id="modal-confirm-cancel" class="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs touch-scale touch-target-44 border border-slate-700">
              Batal
            </button>
            <button id="modal-confirm-yes" class="py-3 px-4 rounded-xl ${confirmColor} text-white font-bold text-xs touch-scale touch-target-44 shadow-lg shadow-rose-950/40">
              ${confirmText}
            </button>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();

    const closeModal = () => {
      modal.classList.add('hidden');
      modal.innerHTML = '';
    };

    document.getElementById('modal-confirm-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-confirm-yes').addEventListener('click', () => {
      closeModal();
      if (typeof onConfirm === 'function') onConfirm();
    });
  },

  /**
   * Modal: Tambah Lokasi Supermarket / Toko Manual
   */
  openAddCustomStoreModal() {
    const modal = document.getElementById('modal-container');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div class="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl animate-scale-up space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <i data-lucide="store" class="w-4 h-4"></i>
              </span>
              <div>
                <h3 class="text-sm font-bold text-white">Tambah Lokasi Toko</h3>
                <p class="text-[11px] text-slate-400">Tambahkan supermarket / toko langganan</p>
              </div>
            </div>
            <button id="modal-store-close" class="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 touch-scale" aria-label="Tutup">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form id="form-add-custom-store" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Toko / Supermarket *</label>
              <input type="text" id="input-custom-store-name" placeholder="Contoh: Ranch Market, Alfamidi, Farmers Market..." 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-500">
              <p id="err-custom-store" class="hidden text-[10px] text-rose-400 font-semibold mt-1">Nama toko wajib diisi!</p>
            </div>

            <!-- Rekomendasi Lokasi Cepat -->
            <div>
              <span class="text-[10px] font-semibold text-slate-400 block mb-1.5">Saran Toko Populer:</span>
              <div class="flex flex-wrap gap-1.5 text-[11px]">
                <button type="button" class="btn-suggest-store px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition" data-store="Ranch Market - Pesanggrahan">Ranch Market</button>
                <button type="button" class="btn-suggest-store px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition" data-store="Alfamidi Super">Alfamidi Super</button>
                <button type="button" class="btn-suggest-store px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition" data-store="Farmers Market">Farmers Market</button>
                <button type="button" class="btn-suggest-store px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition" data-store="Total Buah Segar">Total Buah</button>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <button type="button" id="btn-cancel-custom-store" class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs touch-scale border border-slate-700">
                Batal
              </button>
              <button type="submit" class="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/30 touch-scale">
                Simpan & Gunakan
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    lucide.createIcons();

    const closeModal = () => {
      modal.classList.add('hidden');
      modal.innerHTML = '';
    };

    document.getElementById('modal-store-close').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-custom-store').addEventListener('click', closeModal);

    const storeInput = document.getElementById('input-custom-store-name');
    storeInput.focus();

    // Fast suggestion clicks
    document.querySelectorAll('.btn-suggest-store').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const sName = ev.currentTarget.getAttribute('data-store');
        storeInput.value = sName;
        document.getElementById('err-custom-store')?.classList.add('hidden');
        storeInput.classList.remove('border-rose-500');
      });
    });

    document.getElementById('form-add-custom-store').addEventListener('submit', (e) => {
      e.preventDefault();
      const val = storeInput.value.trim();
      if (!val) {
        document.getElementById('err-custom-store')?.classList.remove('hidden');
        storeInput.classList.add('border-rose-500', 'ring-1', 'ring-rose-500');
        storeInput.focus();
        return;
      }

      Store.addStoreLocation(val);
      const curDate = Store.getSessionInfo().date || '2026-10-26';
      Store.saveSessionInfo({
        storeName: val,
        date: curDate
      });

      closeModal();
      this.render();
    });
  },

  /**
   * Open Modal: Tambah Barang Belanja [F-01], [F-03], [F-04]
   */
  openAddItemModal(itemToEdit = null) {
    const modal = document.getElementById('modal-container');
    if (!modal) return;
    const isEdit = !!itemToEdit;

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
        <div class="w-full max-w-[430px] bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up max-h-[92vh] overflow-y-auto">
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <i data-lucide="${isEdit ? 'edit-3' : 'plus-circle'}" class="w-5 h-5"></i>
              </span>
              <div>
                <h3 class="text-base font-bold text-white">${isEdit ? 'Edit Barang Belanja' : 'Catat Barang Belanja'}</h3>
                <p class="text-[11px] text-slate-400">${isEdit ? 'Perbarui rincian harga, kuantitas, atau promo' : 'Masukkan produk ke dalam troli supermarket'}</p>
              </div>
            </div>
            <button id="modal-close" class="p-2 rounded-full text-slate-400 hover:text-white bg-slate-800 touch-scale touch-target-44" aria-label="Tutup Modal">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Form [F-01] -->
          <form id="form-add-item" class="space-y-4" novalidate>
            <!-- [Resmi Lotte Mart Puri Indah] Quick Pick Catalog -->
            <div class="bg-slate-950/70 p-3 rounded-2xl border border-emerald-500/30 space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-white flex items-center gap-1.5">
                  <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Katalog Resmi Lotte Mart Puri Indah</span>
                </label>
                <span class="text-[10px] text-emerald-300 font-extrabold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Harga Terverifikasi
                </span>
              </div>
              
              <select id="quick-pick-lotte-mart" class="w-full bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500">
                <option value="">-- Pilih Cepat Barang Resmi Toko --</option>
                <option value="Beras Rojolele">🌾 Beras Rojolele (5kg) • Resmi Lalu: Rp 68.000</option>
                <option value="Minyak Goreng 2L">🍳 Minyak Goreng 2L • Resmi Lalu: Rp 43.000</option>
                <option value="Telur 1kg">🥚 Telur 1kg • Resmi Lalu: Rp 32.000</option>
                <option value="Garam 500g">🧂 Garam 500g • Resmi Lalu: Rp 5.000</option>
                <option value="Sabun Cuci">🧼 Sabun Cuci • Resmi Lalu: Rp 20.000</option>
                <option value="Wajan">🍳 Wajan • Resmi Lalu: Rp 100.000</option>
                <option value="Indomie Goreng (5 pcs)">🍜 Indomie Goreng (5 pcs) • Resmi Lalu: Rp 15.000</option>
                <option value="Daging Sapi Segar 1kg">🥩 Daging Sapi 1kg • Resmi Lalu: Rp 135.000</option>
                <option value="Ayam Broiler Utuh 1 ekor">🍗 Ayam Broiler Utuh • Resmi Lalu: Rp 38.000</option>
                <option value="Susu UHT Full Cream 1L">🥛 Susu UHT 1L • Resmi Lalu: Rp 19.000</option>
                <option value="Gula Pasir Premium 1kg">🍬 Gula Pasir 1kg • Resmi Lalu: Rp 17.500</option>
              </select>

              <!-- Quick Chips -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <button type="button" class="quick-lotte-chip whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition" data-name="Beras Rojolele">🌾 Beras</button>
                <button type="button" class="quick-lotte-chip whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition" data-name="Minyak Goreng 2L">🍳 Minyak</button>
                <button type="button" class="quick-lotte-chip whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition" data-name="Telur 1kg">🥚 Telur</button>
                <button type="button" class="quick-lotte-chip whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition" data-name="Garam 500g">🧂 Garam</button>
                <button type="button" class="quick-lotte-chip whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition" data-name="Sabun Cuci">🧼 Sabun</button>
                <button type="button" class="quick-lotte-chip whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition" data-name="Wajan">🍳 Wajan</button>
              </div>
            </div>

            <!-- Nama Produk with Live Autocomplete -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Produk *</label>
              <div class="relative">
                <input type="text" id="input-name" placeholder="Contoh: Beras Rojolele, Minyak Goreng, Telur..." 
                  class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-500">
                <div id="autocomplete-results" class="hidden absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-700/50"></div>
              </div>
              <p id="err-input-name" class="hidden text-[10px] text-rose-400 font-semibold mt-1">Nama barang wajib diisi!</p>
            </div>

            <!-- Kategori & Satuan [SRS F-01: Bahan Pokok & karung/5kg] -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                <select id="input-category" class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
                  <option value="Bahan Pokok" selected>Bahan Pokok</option>
                  <option value="Sembako">Sembako</option>
                  <option value="Makanan Instan">Makanan Instan</option>
                  <option value="Toiletries">Toiletries</option>
                  <option value="Dapur & Bumbu">Dapur & Bumbu</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Sayur & Buah">Sayur & Buah</option>
                  <option value="Snack">Snack</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Satuan Ukuran</label>
                <select id="input-unit" class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
                  <option value="karung/5kg">karung/5kg</option>
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
                  <option value="pcs">pcs</option>
                  <option value="pack">pack</option>
                  <option value="kaleng">kaleng</option>
                  <option value="botol">botol</option>
                  <option value="gr">gr</option>
                </select>
              </div>
            </div>

            <!-- Kuantitas & Harga Satuan Saat Ini [F-01] -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Jumlah (Qty)</label>
                <div class="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1">
                  <button type="button" id="modal-qty-minus" class="stepper-btn touch-target-44" aria-label="Kurang kuantitas">-</button>
                  <input type="number" inputmode="numeric" id="input-qty" value="1" min="1" class="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none" aria-label="Kuantitas">
                  <button type="button" id="modal-qty-plus" class="stepper-btn touch-target-44" aria-label="Tambah kuantitas">+</button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Harga Satuan Saat Ini (Rp) *</label>
                <input type="number" inputmode="numeric" id="input-price" placeholder="0" min="1" 
                  class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500">
                <p id="err-input-price" class="hidden text-[10px] text-rose-400 font-semibold mt-1">Harga tidak boleh 0 atau minus!</p>
              </div>
            </div>

            <!-- Harga Bulan Lalu & Real-time Comparator Preview [F-04] -->
            <div class="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <i data-lucide="history" class="w-3.5 h-3.5 text-emerald-400"></i>
                    <span>Harga Bulan Lalu (Rp):</span>
                  </label>
                  <span class="text-[10px] text-slate-400 block mt-0.5">Otomatis terisi atau ketik sendiri</span>
                </div>
                <input type="number" inputmode="numeric" id="input-last-price" placeholder="68000" min="0" 
                  class="w-32 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-right text-emerald-300 font-extrabold focus:outline-none focus:border-emerald-500">
              </div>

              <!-- Official Store Benchmark Reference & Reset Button -->
              <div class="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
                <span id="official-price-badge" class="text-slate-300 flex items-center gap-1.5 text-[11px]">
                  <span class="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Resmi Lotte Mart Puri Indah: <strong id="official-price-val" class="text-emerald-400">Rp 68.000</strong></span>
                </span>
                <button type="button" id="btn-use-official-price" class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 transition">
                  Pakai Resmi
                </button>
              </div>

              <!-- Real-time Comparison Preview Badge -->
              <div id="modal-comparison-preview" class="pt-1">
                <span class="text-[11px] text-slate-400">Ketik harga saat ini untuk melihat komparasi vs bulan lalu.</span>
              </div>
            </div>

            <!-- [F-03] Multi-Tier Discount Section -->
            <div class="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i data-lucide="percent" class="w-4 h-4 text-emerald-400"></i>
                  <span>Promo / Diskon Supermarket</span>
                </span>
                <select id="select-discount-type" class="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none">
                  <option value="none">Tanpa Diskon</option>
                  <option value="single">Diskon Tunggal (%)</option>
                  <option value="tiered">Diskon Bertingkat (% + %)</option>
                  <option value="nominal">Potongan Nominal (Rp)</option>
                </select>
              </div>

              <!-- Dynamic Discount Inputs -->
              <div id="discount-inputs-container" class="space-y-2 pt-1 hidden">
                <!-- Single Discount -->
                <div id="container-disc-single" class="hidden">
                  <label class="text-[11px] text-slate-300 block mb-1">Persen Diskon (%):</label>
                  <input type="number" inputmode="numeric" id="input-disc-a" placeholder="Contoh: 25" min="0" max="100" 
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                </div>

                <!-- Tiered Discount (% + %) [SRS F-03: Kompound Bertingkat] -->
                <div id="container-disc-tiered" class="hidden space-y-1.5">
                  <label class="text-[11px] text-slate-300 block">Diskon Bertingkat (Contoh: 50% + 20%):</label>
                  <div class="grid grid-cols-2 gap-2">
                    <input type="number" inputmode="numeric" id="input-tier-a" placeholder="Diskon 1 (%)" min="0" max="100" 
                      class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                    <input type="number" inputmode="numeric" id="input-tier-b" placeholder="Diskon 2 (%)" min="0" max="100" 
                      class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                  </div>
                  <p class="text-[10px] text-emerald-400 font-medium">
                    ✓ Dihitung kompound bertahap: P1 = Awal - A%, P2 = P1 - B% (Bukan 70% linier).
                  </p>
                </div>

                <!-- Nominal Discount -->
                <div id="container-disc-nominal" class="hidden">
                  <label class="text-[11px] text-slate-300 block mb-1">Potongan Langsung (Rp):</label>
                  <input type="number" inputmode="numeric" id="input-disc-nominal" placeholder="Contoh: 5000" min="0" 
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                </div>

                <!-- Live Savings Preview -->
                <div id="modal-savings-preview" class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold flex items-center justify-between">
                  <span>Hasil Diskon:</span>
                  <div id="label-calculated-savings" class="text-right">Hemat Rp 0</div>
                </div>
              </div>
            </div>

            <!-- Submit Button (Touch target >= 44px) -->
            <button type="submit" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 touch-scale touch-target-44">
              <i data-lucide="${isEdit ? 'check' : 'shopping-bag'}" class="w-5 h-5"></i>
              <span>${isEdit ? 'Simpan Perubahan' : 'Masukkan ke Troli'}</span>
            </button>
          </form>
        </div>
      </div>
    `;

    lucide.createIcons();
    this.bindAddItemModalEvents(itemToEdit);
  },

  /**
   * Bind events inside Add Item Modal with Active Validation [SRS F-01, F-03, F-04]
   */
  bindAddItemModalEvents(itemToEdit = null) {
    const modal = document.getElementById('modal-container');
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    const form = document.getElementById('form-add-item');
    const nameInput = document.getElementById('input-name');
    const categoryInput = document.getElementById('input-category');
    const unitInput = document.getElementById('input-unit');
    const qtyInput = document.getElementById('input-qty');
    const priceInput = document.getElementById('input-price');
    const lastPriceInput = document.getElementById('input-last-price');
    const discountTypeSelect = document.getElementById('select-discount-type');
    const discountContainer = document.getElementById('discount-inputs-container');
    const singleContainer = document.getElementById('container-disc-single');
    const tieredContainer = document.getElementById('container-disc-tiered');
    const nominalContainer = document.getElementById('container-disc-nominal');
    const compPreview = document.getElementById('modal-comparison-preview');
    const autocompleteDiv = document.getElementById('autocomplete-results');
    const quickSelect = document.getElementById('quick-pick-lotte-mart');
    const officialPriceVal = document.getElementById('official-price-val');
    const btnUseOfficial = document.getElementById('btn-use-official-price');

    let isUserManuallyEditedLastPrice = false;

    // Helper: Apply official Lotte Mart item data into modal form
    const applyLotteMartItem = (item, isExplicitSelect = true) => {
      if (!item) return;
      if (isExplicitSelect) {
        nameInput.value = item.name;
        if (item.category) categoryInput.value = item.category;
        if (item.unit) unitInput.value = item.unit;
        if (item.currentPrice && (!priceInput.value || parseFloat(priceInput.value) <= 0)) {
          priceInput.value = item.currentPrice;
        }
      }
      if (item.lastPrice !== undefined) {
        lastPriceInput.value = item.lastPrice;
        if (officialPriceVal) {
          officialPriceVal.textContent = Calculator.formatRupiah(item.lastPrice);
        }
      }
      isUserManuallyEditedLastPrice = false;
      document.getElementById('err-input-name')?.classList.add('hidden');
      nameInput.classList.remove('border-rose-500', 'ring-1', 'ring-rose-500');
      updatePreviews();
    };

    // Quick-select dropdown: Populate full official Lotte Mart catalog
    if (quickSelect && typeof OfficialCatalog !== 'undefined') {
      const allOfficial = OfficialCatalog.getAll();
      const currentSelected = quickSelect.value;
      quickSelect.innerHTML = `<option value="">-- Pilih Cepat Barang Resmi Toko --</option>` +
        allOfficial.map(item => `
          <option value="${item.name}">${item.name} • Resmi Lalu: ${Calculator.formatRupiah(item.lastPrice)}</option>
        `).join('');
      if (currentSelected) quickSelect.value = currentSelected;

      quickSelect.addEventListener('change', () => {
        const selectedName = quickSelect.value;
        if (!selectedName) return;
        const found = Store.findCatalogItemByName(selectedName) || OfficialCatalog.findItem(selectedName);
        if (found) {
          applyLotteMartItem(found, true);
        }
      });
    }

    // Quick Chips (Beras, Minyak, Telur, Garam, Sabun, Wajan)
    document.querySelectorAll('.quick-lotte-chip').forEach(chip => {
      chip.addEventListener('click', (ev) => {
        const chipName = ev.currentTarget.getAttribute('data-name');
        const found = Store.findCatalogItemByName(chipName) || (typeof OfficialCatalog !== 'undefined' ? OfficialCatalog.findItem(chipName) : null);
        if (found) {
          applyLotteMartItem(found, true);
        }
      });
    });

    // "Pakai Resmi" button to restore official store price anytime
    if (btnUseOfficial) {
      btnUseOfficial.addEventListener('click', () => {
        const queryName = nameInput.value.trim() || 'Beras Rojolele';
        const found = Store.findCatalogItemByName(queryName) || (typeof OfficialCatalog !== 'undefined' ? OfficialCatalog.findItem(queryName) : null);
        const officialPrice = (found && found.lastPrice) ? found.lastPrice : 68000;
        lastPriceInput.value = officialPrice;
        if (officialPriceVal) {
          officialPriceVal.textContent = Calculator.formatRupiah(officialPrice);
        }
        isUserManuallyEditedLastPrice = false;
        updatePreviews();
      });
    }

    // Stepper modal
    document.getElementById('modal-qty-plus').addEventListener('click', () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value || 1, 10) + 1);
      updatePreviews();
    });
    document.getElementById('modal-qty-minus').addEventListener('click', () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value || 1, 10) - 1);
      updatePreviews();
    });

    // Block negative signs on price inputs
    priceInput.addEventListener('keydown', (e) => {
      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        this.showToast('⚠️ Harga barang tidak boleh bernilai negatif (-Rp).', 'error');
      }
    });

    // Autocomplete & Instant Catalog Lookup for Nama Produk
    nameInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      document.getElementById('err-input-name')?.classList.add('hidden');
      nameInput.classList.remove('border-rose-500', 'ring-1', 'ring-rose-500');

      // Instant lookup official catalog to prefill lastPrice and categories
      if (q.length >= 2) {
        const quickMatch = Store.findCatalogItemByName(q) || (typeof OfficialCatalog !== 'undefined' ? OfficialCatalog.findItem(q) : null);
        if (quickMatch) {
          if (officialPriceVal && quickMatch.lastPrice) {
            officialPriceVal.textContent = Calculator.formatRupiah(quickMatch.lastPrice);
          }
          if (!isUserManuallyEditedLastPrice && quickMatch.lastPrice) {
            lastPriceInput.value = quickMatch.lastPrice;
          }
          if (quickMatch.category) categoryInput.value = quickMatch.category;
          if (quickMatch.unit) unitInput.value = quickMatch.unit;
        }
      }

      if (q.length < 2) {
        autocompleteDiv.classList.add('hidden');
        return;
      }
      const matches = Store.searchCatalog(q);
      if (matches.length > 0) {
        autocompleteDiv.innerHTML = matches.map(item => `
          <div class="px-3 py-2.5 text-xs hover:bg-slate-700 cursor-pointer flex items-center justify-between auto-suggest-item" 
               data-name="${item.name}" data-category="${item.category}" data-unit="${item.unit}" data-lastprice="${item.lastPrice}">
            <div>
              <span class="font-bold text-white">${item.name}</span>
              <span class="text-[10px] text-slate-400 block">${item.category} • ${item.unit}</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-emerald-400 font-semibold block">${Calculator.formatRupiah(item.lastPrice)}</span>
              <span class="text-[9px] text-slate-400">Resmi Lalu</span>
            </div>
          </div>
        `).join('');
        autocompleteDiv.classList.remove('hidden');

        document.querySelectorAll('.auto-suggest-item').forEach(item => {
          item.addEventListener('click', (ev) => {
            const target = ev.currentTarget;
            nameInput.value = target.getAttribute('data-name');
            categoryInput.value = target.getAttribute('data-category');
            unitInput.value = target.getAttribute('data-unit');
            const targetLastPrice = parseFloat(target.getAttribute('data-lastprice')) || 0;
            lastPriceInput.value = targetLastPrice;
            if (officialPriceVal) {
              officialPriceVal.textContent = Calculator.formatRupiah(targetLastPrice);
            }
            isUserManuallyEditedLastPrice = false;
            autocompleteDiv.classList.add('hidden');
            updatePreviews();
          });
        });
      } else {
        autocompleteDiv.classList.add('hidden');
      }
    });

    // Discount type dropdown change
    discountTypeSelect.addEventListener('change', () => {
      const type = discountTypeSelect.value;
      if (type === 'none') {
        discountContainer.classList.add('hidden');
      } else {
        discountContainer.classList.remove('hidden');
        singleContainer.classList.toggle('hidden', type !== 'single');
        tieredContainer.classList.toggle('hidden', type !== 'tiered');
        nominalContainer.classList.toggle('hidden', type !== 'nominal');
      }
      updatePreviews();
    });

    // Live update comparison & discount calculation
    const updatePreviews = () => {
      const currentPrice = parseFloat(priceInput.value) || 0;
      let lastPrice = parseFloat(lastPriceInput.value) || 0;
      const qty = parseInt(qtyInput.value) || 1;

      // If lastPrice is empty, try lookup from catalog
      if (!lastPrice && nameInput.value.trim()) {
        const catItem = Store.findCatalogItemByName(nameInput.value.trim());
        if (catItem && catItem.lastPrice) {
          lastPrice = catItem.lastPrice;
          lastPriceInput.value = lastPrice;
        }
      }

      // Update comparator preview [F-04]
      const comp = Comparator.compare(currentPrice, lastPrice);
      compPreview.innerHTML = `
        <div class="flex items-center gap-2">
          ${Comparator.renderBadgeHtml(comp)}
          <span class="text-[11px] text-slate-400">${comp.summary}</span>
        </div>
      `;

      // Update discount savings preview [F-03]
      const type = discountTypeSelect.value;
      let discA = 0;
      let discB = 0;
      let discNominal = 0;

      if (type === 'single') {
        discA = parseFloat(document.getElementById('input-disc-a')?.value) || 0;
      } else if (type === 'tiered') {
        discA = parseFloat(document.getElementById('input-tier-a')?.value) || 0;
        discB = parseFloat(document.getElementById('input-tier-b')?.value) || 0;
      } else if (type === 'nominal') {
        discNominal = parseFloat(document.getElementById('input-disc-nominal')?.value) || 0;
      }

      const discountResult = Calculator.calculateItemDiscount(currentPrice, type, discA, discB, discNominal);
      const label = document.getElementById('label-calculated-savings');
      if (label) {
        if (type === 'tiered' && (discA > 0 || discB > 0)) {
          const afterTier1 = currentPrice - (currentPrice * (discA / 100));
          const afterTier2 = afterTier1 - (afterTier1 * (discB / 100));
          label.innerHTML = `
            <div class="text-right">
              <span class="text-emerald-300 font-bold block">Bayar ${Calculator.formatRupiah(discountResult.finalPrice * qty)} (Hemat ${Calculator.formatRupiah(discountResult.savingsPerUnit * qty)})</span>
              <span class="text-[10px] text-emerald-400/80 block mt-0.5">Tahap 1 (-${discA}%): ${Calculator.formatRupiah(afterTier1)} → Tahap 2 (-${discB}%): ${Calculator.formatRupiah(afterTier2)}</span>
            </div>
          `;
        } else {
          label.innerText = `Bayar ${Calculator.formatRupiah(discountResult.finalPrice * qty)} (Hemat ${Calculator.formatRupiah(discountResult.savingsPerUnit * qty)})`;
        }
      }
    };

    priceInput.addEventListener('input', () => {
      document.getElementById('err-input-price')?.classList.add('hidden');
      priceInput.classList.remove('border-rose-500', 'ring-1', 'ring-rose-500');
      updatePreviews();
    });
    lastPriceInput.addEventListener('input', () => {
      isUserManuallyEditedLastPrice = true;
      updatePreviews();
    });
    qtyInput.addEventListener('input', updatePreviews);
    document.getElementById('input-disc-a')?.addEventListener('input', updatePreviews);
    document.getElementById('input-tier-a')?.addEventListener('input', updatePreviews);
    document.getElementById('input-tier-b')?.addEventListener('input', updatePreviews);
    document.getElementById('input-disc-nominal')?.addEventListener('input', updatePreviews);

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
      if (autocompleteDiv && !nameInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
        autocompleteDiv.classList.add('hidden');
      }
    });

    // Close modal on backdrop click
    const backdrop = modal.querySelector('.fixed.inset-0');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          modal.classList.add('hidden');
        }
      });
    }

    // Prefill data if editing an existing item vs adding new item
    if (itemToEdit) {
      nameInput.value = itemToEdit.name || '';
      categoryInput.value = itemToEdit.category || 'Bahan Pokok';
      unitInput.value = itemToEdit.unit || 'pcs';
      qtyInput.value = itemToEdit.qty || 1;
      priceInput.value = itemToEdit.currentPrice || '';
      lastPriceInput.value = itemToEdit.lastPrice !== undefined ? itemToEdit.lastPrice : '';
      if (officialPriceVal && itemToEdit.lastPrice) {
        officialPriceVal.textContent = Calculator.formatRupiah(itemToEdit.lastPrice);
      }
      discountTypeSelect.value = itemToEdit.discountType || 'none';

      // Show relevant discount inputs
      discountTypeSelect.dispatchEvent(new Event('change'));

      if (itemToEdit.discountType === 'single') {
        const dA = document.getElementById('input-disc-a');
        if (dA) dA.value = itemToEdit.discountA || '';
      } else if (itemToEdit.discountType === 'tiered') {
        const tA = document.getElementById('input-tier-a');
        const tB = document.getElementById('input-tier-b');
        if (tA) tA.value = itemToEdit.discountA || '';
        if (tB) tB.value = itemToEdit.discountB || '';
      } else if (itemToEdit.discountType === 'nominal') {
        const dNom = document.getElementById('input-disc-nominal');
        if (dNom) dNom.value = itemToEdit.discountNominal || '';
      }

      updatePreviews();
    } else {
      // New Item Mode: Pre-fill official Lotte Mart Puri Indah benchmark (Beras Rojolele Rp 68.000)
      const defaultBm = (typeof OfficialCatalog !== 'undefined') ? OfficialCatalog.findItem('Beras Rojolele') : null;
      const initialLastPrice = (defaultBm && defaultBm.lastPrice) ? defaultBm.lastPrice : 68000;
      lastPriceInput.value = initialLastPrice;
      if (officialPriceVal) {
        officialPriceVal.textContent = Calculator.formatRupiah(initialLastPrice);
      }
      updatePreviews();
    }

    // Form Submit with ACTIVE VALIDATION [SRS F-01: Mencegah input kosong/minus]
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // 1. Validasi Nama Produk
      const trimmedName = nameInput.value.trim();
      if (!trimmedName) {
        nameInput.classList.add('border-rose-500', 'ring-1', 'ring-rose-500');
        document.getElementById('err-input-name')?.classList.remove('hidden');
        nameInput.focus();
        this.vibrate(50);
        this.showToast('⚠️ Nama barang wajib diisi! Mohon lengkapi nama produk sebelum menambahkan.', 'error');
        return;
      }

      // 2. Validasi Harga (Tidak boleh kosong, 0, atau negatif)
      const parsedPrice = parseFloat(priceInput.value);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        priceInput.classList.add('border-rose-500', 'ring-1', 'ring-rose-500');
        document.getElementById('err-input-price')?.classList.remove('hidden');
        priceInput.focus();
        this.vibrate(50);
        this.showToast('⚠️ Harga barang tidak valid! Harga tidak boleh kosong, 0, atau bernilai negatif (-Rp).', 'error');
        return;
      }

      // 3. Validasi Qty
      const parsedQty = parseInt(qtyInput.value, 10);
      if (isNaN(parsedQty) || parsedQty < 1) {
        qtyInput.focus();
        this.vibrate(50);
        this.showToast('⚠️ Kuantitas belanja minimal adalah 1!', 'error');
        return;
      }

      const type = discountTypeSelect.value;
      let discA = 0;
      let discB = 0;
      let discNom = 0;

      if (type === 'single') {
        discA = parseFloat(document.getElementById('input-disc-a')?.value) || 0;
      } else if (type === 'tiered') {
        discA = parseFloat(document.getElementById('input-tier-a')?.value) || 0;
        discB = parseFloat(document.getElementById('input-tier-b')?.value) || 0;
      } else if (type === 'nominal') {
        discNom = parseFloat(document.getElementById('input-disc-nominal')?.value) || 0;
      }

      const itemPayload = {
        name: trimmedName,
        category: categoryInput.value,
        unit: unitInput.value,
        qty: parsedQty,
        currentPrice: parsedPrice,
        lastPrice: Math.max(0, parseFloat(lastPriceInput.value) || 0),
        discountType: type,
        discountA: discA,
        discountB: discB,
        discountNominal: discNom
      };

      if (itemToEdit) {
        Store.updateCartItem(itemToEdit.id, itemPayload);
        this.vibrate(30);
        this.showToast('Barang berhasil diperbarui!');
      } else {
        Store.addCartItem(itemPayload);
        this.vibrate([40, 60]);
        this.showToast('Barang dimasukkan ke troli!');
      }

      modal.classList.add('hidden');
    });
  },

  /**
   * Modal: Ubah Saldo Anggaran with Quick Presets [SRS F-05]
   */
  openBudgetModal() {
    const modal = document.getElementById('modal-container');
    if (!modal) return;

    const currentSettings = Store.getBudgetSettings();

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
        <div class="w-full max-w-[430px] bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <i data-lucide="wallet" class="w-5 h-5"></i>
              </span>
              <div>
                <h3 class="text-base font-bold text-white">Atur Batas Anggaran</h3>
                <p class="text-[11px] text-slate-400">Pengendali Batas Anggaran Belanja</p>
              </div>
            </div>
            <button id="modal-close" class="p-2 rounded-full text-slate-400 hover:text-white bg-slate-800 touch-scale touch-target-44" aria-label="Tutup Modal">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form id="form-edit-budget" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Batas Saldo Belanja (Rp) *</label>
              <input type="number" inputmode="numeric" id="input-budget-limit" required value="${currentSettings.monthlyLimit}" min="10000" step="5000" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500">
              
              <!-- Quick Budget Presets -->
              <div class="flex items-center gap-1.5 flex-wrap pt-2">
                <span class="text-[10px] text-slate-400 font-medium">Pilihan Cepat:</span>
                <button type="button" class="btn-budget-preset px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-[10px] font-bold text-emerald-300 hover:text-white border border-slate-700 touch-scale" data-val="100000">Rp 100.000</button>
                <button type="button" class="btn-budget-preset px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-[10px] font-bold text-emerald-300 hover:text-white border border-slate-700 touch-scale" data-val="150000">Rp 150.000</button>
                <button type="button" class="btn-budget-preset px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-[10px] font-bold text-emerald-300 hover:text-white border border-slate-700 touch-scale" data-val="350000">Rp 350.000</button>
                <button type="button" class="btn-budget-preset px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-[10px] font-bold text-emerald-300 hover:text-white border border-slate-700 touch-scale" data-val="500000">Rp 500.000</button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Cadangan Tunai Darurat (Rp)</label>
              <input type="number" inputmode="numeric" id="input-emergency" value="${currentSettings.emergencyReserve || 0}" min="0" step="5000" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500">
              <p class="text-[10px] text-slate-400 mt-1">Uang darurat yang tidak boleh disentuh di supermarket.</p>
            </div>

            <button type="submit" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 touch-scale touch-target-44">
              <i data-lucide="save" class="w-5 h-5"></i>
              <span>Simpan Pengaturan Saldo</span>
            </button>
          </form>
        </div>
      </div>
    `;

    lucide.createIcons();

    // Preset button clicks
    document.querySelectorAll('.btn-budget-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.getAttribute('data-val');
        const limitInput = document.getElementById('input-budget-limit');
        if (limitInput && val) {
          limitInput.value = val;
          this.vibrate(20);
        }
      });
    });

    document.getElementById('modal-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    const backdropBudget = modal.querySelector('.fixed.inset-0');
    if (backdropBudget) {
      backdropBudget.addEventListener('click', (e) => {
        if (e.target === backdropBudget) modal.classList.add('hidden');
      });
    }

    document.getElementById('form-edit-budget').addEventListener('submit', (e) => {
      e.preventDefault();
      const newLimit = parseFloat(document.getElementById('input-budget-limit').value) || 500000;
      const newReserve = parseFloat(document.getElementById('input-emergency').value) || 0;
      Store.saveBudgetSettings({
        ...currentSettings,
        monthlyLimit: newLimit,
        emergencyReserve: newReserve
      });
      this.vibrate(30);
      this.showToast('Pengaturan saldo dompet berhasil disimpan!');
      modal.classList.add('hidden');
    });
  },

  /**
   * Modal: Konfirmasi Selesai & Simpan Belanja [F-06]
   */
  openFinishShoppingModal() {
    const modal = document.getElementById('modal-container');
    if (!modal) return;

    const cart = Store.getActiveCart();
    const budget = Store.getBudgetSettings();
    const discount = Store.getCartDiscount();
    const monthlyHistorySpent = Store.getMonthlyHistoricalSpent ? Store.getMonthlyHistoricalSpent() : 0;
    const summary = Calculator.calculateCartSummary(cart, budget.monthlyLimit, discount, monthlyHistorySpent);

    if (summary.isOverbudget) {
      this.vibrate([100, 60, 100, 60, 150]);
      this.showToast('⚠️ Peringatan: Total belanja melebihi batas saldo dompet!', 'error');
    }

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
        <div class="w-full max-w-[430px] bg-slate-900 border ${summary.isOverbudget ? 'border-2 border-rose-500/90 shadow-2xl shadow-rose-950' : 'border border-slate-700/80'} rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up">
          ${summary.isOverbudget ? `
            <!-- Header Pemberitahuan Merah Tegas Overbudget -->
            <div class="text-center mb-4">
              <div class="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2 border-2 border-rose-500/50 animate-pulse">
                <i data-lucide="alert-octagon" class="w-8 h-8 text-rose-400"></i>
              </div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-black uppercase tracking-wider border border-rose-500/40 mb-2">
                <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-400"></i>
                Pemberitahuan Overbudget!
              </div>
              <h3 class="text-base font-extrabold text-white">Total Belanja Melebihi Batas Dompet!</h3>
              <p class="text-xs text-rose-200/90 max-w-xs mx-auto mt-1 leading-relaxed">
                Total belanjaan kamu menembus limit anggaran bulanan. Sebaiknya kurangi kuantitas atau batalkan barang sekunder sebelum menyimpan struk.
              </p>
            </div>

            <!-- Banner Kotak Merah Peringatan Detail -->
            <div class="bg-rose-950/80 rounded-2xl p-3.5 border-2 border-rose-500/60 text-xs space-y-2 mb-4 shadow-inner">
              <div class="flex justify-between text-slate-300">
                <span>Batas Saldo Dompet:</span>
                <span class="font-bold text-slate-200">${Calculator.formatRupiah(summary.budgetLimit)}</span>
              </div>
              <div class="flex justify-between text-slate-300">
                <span>Total Tagihan Belanja:</span>
                <strong class="text-rose-300 text-sm font-extrabold">${Calculator.formatRupiah(summary.grandTotal)}</strong>
              </div>
              <div class="flex justify-between text-emerald-400">
                <span>Total Dihemat:</span>
                <strong>${Calculator.formatRupiah(summary.allSavings)}</strong>
              </div>
              <div class="flex justify-between text-rose-400 pt-2 border-t border-rose-800/80 font-black">
                <span class="flex items-center gap-1">
                  <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
                  Defisit / Saldo Minus:
                </span>
                <span class="text-rose-400 text-sm font-extrabold">- ${Calculator.formatRupiah(Math.abs(summary.remainingBudget))}</span>
              </div>
              <div class="text-[11px] text-rose-200 font-bold bg-rose-900/60 p-2.5 rounded-xl mt-1.5 border border-rose-500/30 leading-snug">
                ⚠️ Total belanja melebihi batas saldo dompet! Kurangi kuantitas atau batalkan barang sekunder.
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button id="modal-cancel-finish" class="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs touch-scale flex items-center justify-center gap-1.5">
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                <span>Kembali & Kurangi</span>
              </button>
              <button id="modal-confirm-finish" class="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-950/60 touch-scale flex items-center justify-center gap-1.5">
                <i data-lucide="alert-circle" class="w-4 h-4"></i>
                <span>Tetap Simpan Belanja</span>
              </button>
            </div>
          ` : `
            <div class="text-center mb-4">
              <div class="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                <i data-lucide="check-check" class="w-7 h-7"></i>
              </div>
              <h3 class="text-base font-bold text-white">Selesaikan Belanja Bulan Ini?</h3>
              <p class="text-xs text-slate-400 max-w-xs mx-auto">
                Seluruh ${summary.totalItemsCount} barang belanjaan akan diarsipkan ke menu Riwayat dan harga saat ini akan dijadikan patokan bulan depan.
              </p>
            </div>

            <div class="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 text-xs space-y-2 mb-4">
              <div class="flex justify-between text-slate-300">
                <span>Total Pengeluaran:</span>
                <strong class="text-white">${Calculator.formatRupiah(summary.grandTotal)}</strong>
              </div>
              <div class="flex justify-between text-emerald-400">
                <span>Total Dihemat:</span>
                <strong>${Calculator.formatRupiah(summary.allSavings)}</strong>
              </div>
              <div class="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                <span>Sisa Uang Tunai:</span>
                <strong class="text-emerald-400">${Calculator.formatRupiah(summary.remainingBudget)}</strong>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button id="modal-cancel-finish" class="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs touch-scale">
                Batal
              </button>
              <button id="modal-confirm-finish" class="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/40 touch-scale">
                Ya, Simpan Belanja
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    lucide.createIcons();

    document.getElementById('modal-cancel-finish').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    const backdropFinish = modal.querySelector('.fixed.inset-0');
    if (backdropFinish) {
      backdropFinish.addEventListener('click', (e) => {
        if (e.target === backdropFinish) modal.classList.add('hidden');
      });
    }

    document.getElementById('modal-confirm-finish').addEventListener('click', () => {
      Store.archiveCurrentCart(summary);
      modal.classList.add('hidden');
      this.showToast('✅ Belanja berhasil diselesaikan & diarsipkan ke Riwayat.');
      // Switch to Riwayat tab to view the archived receipt
      this.switchTab('riwayat');
    });
  },

  /**
   * Modal: Rincian Struk Riwayat Belanja
   */
  openReceiptModal(sessionId) {
    const modal = document.getElementById('modal-container');
    if (!modal) return;

    const history = Store.getHistory();
    const session = history.find(h => h.id === sessionId);
    if (!session) return;

    const itemsHtml = (session.items || []).map(item => `
      <div class="flex items-center justify-between py-2 border-b border-slate-800/60 text-xs">
        <div>
          <span class="font-bold text-white block">${item.name}</span>
          <span class="text-[10px] text-slate-400">${item.qty} ${item.unit || 'pcs'} × ${Calculator.formatRupiah(item.price)}</span>
        </div>
        <span class="font-bold text-slate-200">${Calculator.formatRupiah(item.subtotal)}</span>
      </div>
    `).join('');

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
        <div class="w-full max-w-[430px] bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up max-h-[88vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div>
              <span class="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">${session.date}</span>
              <h3 class="text-base font-bold text-white">Struk ${session.monthName}</h3>
            </div>
            <button id="modal-close" class="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 touch-scale">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-1 mb-4">
            ${itemsHtml}
          </div>

          <div class="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 space-y-2 text-xs">
            <div class="flex justify-between text-slate-300">
              <span>Total Belanja:</span>
              <strong class="text-white text-sm">${Calculator.formatRupiah(session.totalAmount)}</strong>
            </div>
            <div class="flex justify-between text-emerald-400">
              <span>Penghematan Promo:</span>
              <strong>${Calculator.formatRupiah(session.totalSavings || 0)}</strong>
            </div>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();
    document.getElementById('modal-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    const backdropReceipt = modal.querySelector('.fixed.inset-0');
    if (backdropReceipt) {
      backdropReceipt.addEventListener('click', (e) => {
        if (e.target === backdropReceipt) modal.classList.add('hidden');
      });
    }
  },

  /**
   * Switch Active Bottom Navigation Tab
   */
  switchTab(tabId) {
    this.activeTab = tabId;
    this.vibrate(15);

    // Update bottom nav active classes
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      const target = btn.getAttribute('data-tab');
      const icon = btn.querySelector('.nav-icon-wrapper');
      const text = btn.querySelector('.nav-text');

      if (target === tabId) {
        btn.classList.add('text-emerald-400');
        btn.classList.remove('text-slate-400');
        icon.classList.add('bg-emerald-500/20', 'text-emerald-400');
        icon.classList.remove('text-slate-400');
        text.classList.add('font-bold');
      } else {
        btn.classList.remove('text-emerald-400');
        btn.classList.add('text-slate-400');
        icon.classList.remove('bg-emerald-500/20', 'text-emerald-400');
        icon.classList.add('text-slate-400');
        text.classList.remove('font-bold');
      }
    });

    // Toggle content views
    ['belanja', 'riwayat', 'anggaran'].forEach(id => {
      const el = document.getElementById(`tab-content-${id}`);
      if (el) {
        if (id === tabId) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Toggle Budget Safety Cap (hanya muncul di tab belanja)
    const budgetHeader = document.getElementById('sticky-budget-header');
    if (budgetHeader) {
      if (tabId === 'belanja') {
        budgetHeader.classList.remove('hidden');
      } else {
        budgetHeader.classList.add('hidden');
      }
    }

    // Re-render corresponding tab
    this.render();
  },

  /**
   * Render Top Bar Profile Badge
   */
  /**
   * Render User Avatar (Google profile photo / Google icon / colored letter fallback)
   */
  renderUserAvatarHtml(u, sizeClass = 'w-7 h-7', textClass = 'text-xs') {
    if (!u) return `<div class="${sizeClass} rounded-full bg-slate-700 shrink-0"></div>`;
    const bg = u.avatarBg || 'bg-emerald-600';
    const letter = u.avatarLetter || (u.name || 'U').charAt(0).toUpperCase();

    if (u.avatarUrl) {
      return `
        <div class="${sizeClass} rounded-full ${bg} text-white font-extrabold flex items-center justify-center ${textClass} shadow-md border border-white/20 shrink-0 overflow-hidden">
          <img src="${u.avatarUrl}" alt="${u.name}" class="w-full h-full object-cover" referrerpolicy="no-referrer" onerror="this.onerror=null; this.parentElement.innerHTML='${letter}';">
        </div>
      `;
    }

    if (u.role === 'Google User' || (u.email && u.email.endsWith('@gmail.com'))) {
      return `
        <div class="${sizeClass} rounded-full bg-white text-slate-800 font-extrabold flex items-center justify-center shadow-md border border-slate-300 shrink-0 p-1">
          <svg class="w-full h-full" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        </div>
      `;
    }

    return `
      <div class="${sizeClass} rounded-full ${bg} text-white font-extrabold flex items-center justify-center ${textClass} shadow-md border border-white/20 shrink-0">
        ${letter}
      </div>
    `;
  },

  renderAppHeader() {
    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    const profileContainer = document.getElementById('header-profile-btn');
    const realtimeBadge = document.getElementById('btn-realtime-status');
    const realtimeText = document.getElementById('realtime-badge-text');

    if (realtimeBadge) {
      if (window.supabaseClient || (window.SupabaseDB && window.SupabaseDB.isReady)) {
        realtimeBadge.className = 'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 touch-scale transition-all';
        if (realtimeText) realtimeText.textContent = 'LIVE CLOUD';
      } else if (window.Realtime) {
        const status = window.Realtime.getStatus();
        if (status.isFirestoreActive) {
          realtimeBadge.className = 'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 touch-scale transition-all';
          if (realtimeText) realtimeText.textContent = 'ONLINE';
        } else {
          realtimeBadge.className = 'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 touch-scale transition-all';
          if (realtimeText) realtimeText.textContent = 'LIVE';
        }
      }
      realtimeBadge.onclick = () => this.openRealtimeModal();
    }

    if (!profileContainer) return;

    if (!user) {
      profileContainer.innerHTML = `
        <button class="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1">
          <i data-lucide="user" class="w-3.5 h-3.5"></i>
          <span>Masuk</span>
        </button>
      `;
      profileContainer.onclick = () => {
        window.Auth.logout();
        this.render();
      };
      return;
    }

    profileContainer.innerHTML = `
      <div class="flex items-center gap-1.5 cursor-pointer touch-scale p-1 rounded-xl hover:bg-slate-800 transition" title="Klik untuk Keluar (Log Out)">
        <div class="text-right">
          <span class="text-xs font-bold text-white block leading-none truncate max-w-[70px] sm:max-w-[100px]">${user.name}</span>
          <span class="text-[9px] text-slate-400 font-medium">Keluar</span>
        </div>
        ${this.renderUserAvatarHtml(user, 'w-7 h-7', 'text-xs')}
      </div>
    `;
    profileContainer.onclick = () => {
      this.openConfirmModal({
        title: 'Konfirmasi Keluar',
        message: `Anda sedang masuk sebagai ${user.fullName || user.name || user.email}. Apakah Anda ingin keluar (log out) dari aplikasi?`,
        confirmText: 'Ya, Keluar',
        cancelText: 'Batal',
        onConfirm: () => {
          window.Auth.logout();
          this.vibrate(40);
          this.showToast('Berhasil keluar dari akun.');
          this.render();
        }
      });
    };
    if (window.lucide) lucide.createIcons();
  },

  /**
   * Floating Toast Message (discreetly positioned above bottom navigation)
   */
  showToast(message, type = 'success') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 transition-all duration-300 pointer-events-none transform translate-y-4 opacity-0 max-w-[360px] text-center';
      document.body.appendChild(toast);
    }

    const bgClass = type === 'success' ? 'bg-emerald-600 text-white border border-emerald-400/40 shadow-emerald-950/60' : 'bg-rose-600 text-white border border-rose-400/40 shadow-rose-950/60';
    toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 transition-all duration-300 pointer-events-none transform translate-y-0 opacity-100 max-w-[360px] ${bgClass}`;
    toast.innerText = message;

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.className = toast.className.replace('translate-y-0 opacity-100', 'translate-y-4 opacity-0');
    }, 2000);
  },

  /**
   * Account Management & Switcher Modal Drawer
   */
  openAuthModal() {
    const modal = document.getElementById('modal-container');
    if (!modal) return;

    const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
    const allUsers = window.Auth ? window.Auth.getAllUsers() : [];

    const otherUsers = allUsers.filter(u => !currentUser || u.id !== currentUser.id);

    const otherUsersHtml = otherUsers.length > 0 ? otherUsers.map(u => {
      const uBudget = JSON.parse(localStorage.getItem(`smartgrocery_${u.id}_budget`) || '{"monthlyLimit":500000}');
      return `
        <div class="card-switch-account cursor-pointer flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/40 hover:bg-slate-800 transition mb-2 touch-scale" data-id="${u.id}">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full ${u.avatarBg || 'bg-slate-700'} text-white font-bold flex items-center justify-center text-xs">
              ${u.avatarLetter || u.name.charAt(0)}
            </div>
            <div>
              <span class="text-xs font-bold text-white block leading-tight">${u.fullName || u.name}</span>
              <span class="text-[10px] text-slate-400">${u.email} • Saldo: ${Calculator.formatRupiah(uBudget.monthlyLimit)}</span>
            </div>
          </div>
          <button class="btn-switch-account px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white font-bold text-xs touch-scale transition" data-id="${u.id}">
            Beralih
          </button>
        </div>
      `;
    }).join('') : '<p class="text-xs text-slate-400 py-2 text-center">Belum ada akun lain yang tersimpan.</p>';

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
        <div class="w-full max-w-[430px] bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up max-h-[92vh] overflow-y-auto">
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <i data-lucide="users" class="w-5 h-5"></i>
              </span>
              <div>
                <h3 class="text-base font-bold text-white">Kelola & Ganti Akun</h3>
                <p class="text-[11px] text-slate-400">Setiap akun memiliki data keranjang, riwayat, dan saldo terpisah</p>
              </div>
            </div>
            <button id="modal-auth-close" class="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 touch-scale">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Active Account Card -->
          ${currentUser ? `
            <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/30 mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Akun Sedang Aktif</span>
                </span>
                <span class="text-[10px] text-slate-400">${currentUser.email}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl ${currentUser.avatarBg || 'bg-emerald-600'} text-white font-extrabold flex items-center justify-center text-base shadow-lg border border-white/20">
                  ${currentUser.avatarLetter || currentUser.name.charAt(0)}
                </div>
                <div>
                  <h4 class="text-sm font-extrabold text-white leading-tight">${currentUser.fullName || currentUser.name}</h4>
                  <p class="text-xs text-emerald-400 font-medium">${currentUser.role || 'Pengguna'}</p>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Quick Switch Section -->
          <div class="mb-5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <i data-lucide="repeat" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Beralih ke Akun Lain</span>
            </h4>
            <div class="space-y-1">
              ${otherUsersHtml}
            </div>
          </div>

          <!-- Tabs: Daftar Akun Baru & Masuk Akun Lain -->
          <div class="border-t border-slate-800 pt-4">
            <div class="flex rounded-xl bg-slate-950 p-1 mb-4 border border-slate-800">
              <button id="btn-tab-register" class="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white transition">
                + Daftar Akun Baru
              </button>
              <button id="btn-tab-login" class="flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition">
                Masuk Akun Lain
              </button>
            </div>

            <!-- Form: Register New User -->
            <form id="form-register-user" class="space-y-3">
              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
                <input type="text" id="reg-name" required placeholder="Contoh: Siti Rahma" 
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Peran / Status</label>
                  <input type="text" id="reg-role" placeholder="Contoh: Mahasiswi" 
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Batas Anggaran (Rp)</label>
                  <input type="number" id="reg-budget" value="600000" step="10000" 
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email *</label>
                <input type="email" id="reg-email" required placeholder="Contoh: siti@kost.id" 
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Password *</label>
                <input type="password" id="reg-password" required placeholder="Minimal 3 karakter" 
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
              </div>

              <button type="submit" class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/40 touch-scale">
                Daftar & Langsung Masuk
              </button>
            </form>

            <!-- Form: Login User -->
            <form id="form-login-user" class="space-y-3 hidden">
              <div class="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-2">
                <span class="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">Isi Cepat Akun Demo:</span>
                <div class="flex items-center gap-1.5">
                  <button type="button" class="btn-quick-fill-auth flex-1 py-1.5 px-2 rounded-lg bg-slate-800 text-[11px] text-emerald-400 font-bold border border-slate-700 hover:bg-slate-700 touch-scale" data-email="user@grocerysafe.id">Akun Utama (123)</button>
                  <button type="button" class="btn-quick-fill-auth flex-1 py-1.5 px-2 rounded-lg bg-slate-800 text-[11px] text-indigo-400 font-bold border border-slate-700 hover:bg-slate-700 touch-scale" data-email="aditya@kampus.id">Akun Sekunder (123)</button>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email atau Nama Pengguna *</label>
                <input type="text" id="login-identifier" required placeholder="user@grocerysafe.id atau nama akun" 
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Password *</label>
                <input type="password" id="login-password" required placeholder="Password Anda (Demo: 123)" 
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
              </div>

              <button type="submit" class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/40 touch-scale">
                Masuk ke Akun
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();

    // Bind Close
    document.getElementById('modal-auth-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    const backdropAuth = modal.querySelector('.fixed.inset-0');
    if (backdropAuth) {
      backdropAuth.addEventListener('click', (e) => {
        if (e.target === backdropAuth) modal.classList.add('hidden');
      });
    }

    // Bind 1-tap card and button switch
    modal.querySelectorAll('.card-switch-account, .btn-switch-account').forEach(el => {
      el.addEventListener('click', (e) => {
        const targetId = el.getAttribute('data-id') || el.closest('[data-id]')?.getAttribute('data-id');
        if (!targetId) return;
        const success = window.Auth.switchAccount(targetId);
        if (success) {
          const user = window.Auth.getCurrentUser();
          this.vibrate(40);
          this.showToast(`Beralih ke akun ${user.name}! Data belanja diperbarui.`);
          modal.classList.add('hidden');
          this.render();
        }
      });
    });

    // Bind quick fill demo buttons in auth modal
    modal.querySelectorAll('.btn-quick-fill-auth').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-email');
        const idInput = document.getElementById('login-identifier');
        const passInput = document.getElementById('login-password');
        if (idInput && passInput) {
          idInput.value = email;
          passInput.value = '123';
        }
      });
    });

    // Toggle Tab Register / Login
    const tabRegBtn = document.getElementById('btn-tab-register');
    const tabLogBtn = document.getElementById('btn-tab-login');
    const formReg = document.getElementById('form-register-user');
    const formLog = document.getElementById('form-login-user');

    tabRegBtn.addEventListener('click', () => {
      tabRegBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white transition';
      tabLogBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition';
      formReg.classList.remove('hidden');
      formLog.classList.add('hidden');
    });

    tabLogBtn.addEventListener('click', () => {
      tabLogBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white transition';
      tabRegBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition';
      formLog.classList.remove('hidden');
      formReg.classList.add('hidden');
    });

    // Handle Registration
    formReg.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const role = document.getElementById('reg-role').value || 'Anak Kost';
      const budgetLimit = document.getElementById('reg-budget').value || 500000;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;

      const res = window.Auth.register({ name, role, email, password, monthlyLimit: budgetLimit });
      if (res.success) {
        this.vibrate([50, 100]);
        this.showToast(`Akun ${res.user.name} berhasil dibuat & aktif!`);
        modal.classList.add('hidden');
        this.render();
      } else {
        this.showToast(res.message, 'error');
      }
    });

    // Handle Login
    formLog.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('login-identifier').value;
      const pass = document.getElementById('login-password').value;

      const res = window.Auth.login(id, pass);
      if (res.success) {
        this.vibrate(40);
        this.showToast(res.message || `Selamat datang kembali, ${res.user.name}!`);
        modal.classList.add('hidden');
        this.render();
      } else {
        this.showToast(res.message, 'error');
      }
    });
  },

  /**
   * Realtime & onSnapshot Configuration Modal
   */
  openRealtimeModal() {
    const modal = document.getElementById('modal-container');
    if (!modal) return;

    const status = window.Realtime ? window.Realtime.getStatus() : { isFirestoreActive: false, broadcastChannelAvailable: true };
    const savedConfig = window.Realtime ? window.Realtime.getFirebaseConfig() || {} : {};

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div class="bg-slate-900 border-t sm:border border-slate-700/80 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
          
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <i data-lucide="radio" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-white">Realtime & onSnapshot</h3>
                <p class="text-[10px] text-slate-400">Sinkronisasi Instan Multi-Perangkat</p>
              </div>
            </div>
            <button id="modal-realtime-close" class="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Section 1: Multi-Tab Local onSnapshot -->
          <div class="mt-4 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span class="text-xs font-bold text-white">Multi-Tab & Multi-Window</span>
              </div>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AKTIF (0ms)
              </span>
            </div>
            <p class="text-[11px] text-slate-300 mt-2 leading-relaxed">
              Teknologi <strong class="text-emerald-400">BroadcastChannel API</strong> & <strong class="text-emerald-400">onSnapshot</strong> aktif! Buka aplikasi ini di 2 tab browser atau jendela terpisah berdampingan. Setiap barang yang dimasukkan atau kuantitas yang ditekan di tab satu akan langsung terupdate di tab lain secara otomatis seketika.
            </p>
            <button id="btn-realtime-ping" class="mt-3 w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 touch-scale transition">
              <i data-lucide="zap" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Kirim Sinyal Uji Realtime (Broadcast Ping)</span>
            </button>
          </div>

          <!-- Section 2: Realtime Database Sync onSnapshot -->
          <div class="mt-4 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="database" class="w-4 h-4 ${status.isFirestoreActive ? 'text-sky-400' : 'text-slate-400'}"></i>
                <span class="text-xs font-bold text-white">Database Realtime Sync</span>
              </div>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${status.isFirestoreActive ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-700 text-slate-300'}">
                ${status.isFirestoreActive ? 'TERHUBUNG' : 'MODE LOKAL'}
              </span>
            </div>
            <p class="text-[11px] text-slate-300 mt-2 leading-relaxed">
              Hubungkan ke Firebase untuk sinkronisasi antar HP dan Laptop di mana saja secara nirkabel dengan listener <code class="text-sky-300 bg-slate-900 px-1 rounded">db.collection().onSnapshot()</code>.
            </p>

            <!-- Quick Paste Helper Box -->
            <div class="mt-3 p-3 rounded-xl bg-slate-900/90 border border-sky-500/30">
              <label class="text-[10px] font-bold text-sky-400 block mb-1 flex items-center justify-between">
                <span class="flex items-center gap-1.5"><i data-lucide="clipboard-paste" class="w-3.5 h-3.5 text-sky-400"></i> Tempel Cepat Script firebaseConfig</span>
                <span class="text-[9px] text-slate-400 font-normal">Auto-parse</span>
              </label>
              <textarea id="fb-raw-config" rows="2" placeholder='Salin blok "const firebaseConfig = { ... }" dari Google Chrome lalu tempel di sini...' class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-[10px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"></textarea>
              <button type="button" id="btn-parse-fb-config" class="mt-1.5 w-full py-1.5 rounded-lg bg-sky-600/25 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 text-[10px] font-bold transition flex items-center justify-center gap-1.5">
                <i data-lucide="sparkles" class="w-3 h-3 text-sky-400"></i>
                <span>Ekstrak Otomatis ke Form</span>
              </button>
            </div>

            <!-- Firebase Config Form -->
            <form id="form-firebase-config" class="mt-3 space-y-2">
              <div>
                <label class="text-[10px] font-semibold text-slate-400 block mb-0.5">Firebase API Key</label>
                <input id="fb-apiKey" type="text" placeholder="AIzaSy..." value="${savedConfig.apiKey || ''}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[10px] font-semibold text-slate-400 block mb-0.5">Project ID</label>
                  <input id="fb-projectId" type="text" placeholder="my-grocery-app" value="${savedConfig.projectId || ''}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500">
                </div>
                <div>
                  <label class="text-[10px] font-semibold text-slate-400 block mb-0.5">Auth Domain</label>
                  <input id="fb-authDomain" type="text" placeholder="app.firebaseapp.com" value="${savedConfig.authDomain || ''}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[10px] font-semibold text-slate-400 block mb-0.5">App ID</label>
                  <input id="fb-appId" type="text" placeholder="1:12345:web:abcdef" value="${savedConfig.appId || ''}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500">
                </div>
                <div>
                  <label class="text-[10px] font-semibold text-slate-400 block mb-0.5">Storage Bucket</label>
                  <input id="fb-storageBucket" type="text" placeholder="app.appspot.com" value="${savedConfig.storageBucket || ''}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500">
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <button type="submit" class="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-900/30 touch-scale transition">
                  ${status.isFirestoreActive ? 'Perbarui Konfigurasi' : 'Hubungkan Database Realtime'}
                </button>
                ${status.isFirestoreActive ? `
                  <button type="button" id="btn-disconnect-firestore" class="px-3 py-2 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 font-bold text-xs hover:bg-rose-600/30 touch-scale transition">
                    Putus
                  </button>
                ` : ''}
              </div>
            </form>
          </div>

          <!-- Bottom Dismiss Button -->
          <div class="mt-4">
            <button id="modal-realtime-done" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition">
              Tutup
            </button>
          </div>

        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
    this.bindRealtimeModalEvents(modal);
  },

  /**
   * Bind Realtime Modal events
   */
  bindRealtimeModalEvents(modal) {
    const closeModal = () => modal.classList.add('hidden');

    document.getElementById('modal-realtime-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-realtime-done')?.addEventListener('click', closeModal);

    const backdrop = modal.querySelector('.fixed.inset-0');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    // Ping test button
    document.getElementById('btn-realtime-ping')?.addEventListener('click', () => {
      this.vibrate([30, 40]);
      Store.notifyChange('cart');
      this.showToast('📡 Sinyal Realtime terkirim ke seluruh tab & perangkat!');
    });

    // Auto-parse raw config from Firebase console snippet
    const btnParse = document.getElementById('btn-parse-fb-config');
    const rawConfigArea = document.getElementById('fb-raw-config');
    const parseSnippet = () => {
      const text = rawConfigArea?.value || '';
      if (!text.trim()) return;

      const extract = (key) => {
        const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
        const match = text.match(regex);
        return match ? match[1] : '';
      };

      const apiKey = extract('apiKey');
      const projectId = extract('projectId');
      const authDomain = extract('authDomain');
      const appId = extract('appId');
      const storageBucket = extract('storageBucket');

      if (apiKey) document.getElementById('fb-apiKey').value = apiKey;
      if (projectId) document.getElementById('fb-projectId').value = projectId;
      if (authDomain) document.getElementById('fb-authDomain').value = authDomain;
      if (appId) document.getElementById('fb-appId').value = appId;
      if (storageBucket) document.getElementById('fb-storageBucket').value = storageBucket;

      this.vibrate(20);
      this.showToast('✨ Konfigurasi Firebase berhasil diekstrak!');
    };

    btnParse?.addEventListener('click', parseSnippet);
    rawConfigArea?.addEventListener('input', () => {
      if (rawConfigArea.value.includes('apiKey')) {
        parseSnippet();
      }
    });

    // Form Firebase Save
    const formFb = document.getElementById('form-firebase-config');
    if (formFb) {
      formFb.addEventListener('submit', (e) => {
        e.preventDefault();
        const apiKey = document.getElementById('fb-apiKey').value.trim();
        const projectId = document.getElementById('fb-projectId').value.trim();
        const authDomain = document.getElementById('fb-authDomain').value.trim();
        const appId = document.getElementById('fb-appId').value.trim();
        const storageBucket = document.getElementById('fb-storageBucket').value.trim();

        if (!apiKey || !projectId) {
          this.vibrate(50);
          this.showToast('⚠️ Mohon isi minimal API Key dan Project ID dari konsol Firebase.', 'error');
          return;
        }

        const config = { apiKey, projectId, authDomain, appId, storageBucket };
        if (window.Realtime) {
          const success = window.Realtime.saveFirebaseConfig(config);
          if (success) {
            this.vibrate([50, 100]);
            this.showToast('🔥 Berhasil terhubung ke Database Realtime onSnapshot!');
            closeModal();
            this.render();
          } else {
            this.vibrate(50);
            this.showToast('⚠️ Gagal menghubungkan ke Firebase. Mohon periksa API Key dan koneksi internet.', 'error');
          }
        }
      });
    }

    // Disconnect Firestore
    document.getElementById('btn-disconnect-firestore')?.addEventListener('click', () => {
      if (window.Realtime) {
        window.Realtime.saveFirebaseConfig(null);
        this.vibrate(30);
        this.showToast('Koneksi Firestore diputus. Kembali ke Mode Realtime Multi-Tab lokal.');
        closeModal();
        this.render();
      }
    });
  },

  /**
   * Render Akun (Account & Profiles) View
   */
  renderAkunTab(summary) {
    const container = document.getElementById('tab-content-akun');
    if (!container) return;

    const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
    const allUsers = window.Auth ? window.Auth.getAllUsers() : [];
    const budget = Store.getBudgetSettings();
    const cart = Store.getActiveCart();

    // Accounts list HTML
    const accountsHtml = allUsers.map(u => {
      const isCurrent = currentUser && u.id === currentUser.id;
      let userBudgetLimit = 500000;
      try {
        const uBudgetRaw = localStorage.getItem(`smartgrocery_${u.id}_budget`);
        if (uBudgetRaw) userBudgetLimit = JSON.parse(uBudgetRaw).monthlyLimit || 500000;
      } catch (e) { }

      return `
        <div class="cursor-pointer rounded-2xl p-3.5 mb-2.5 transition-all duration-200 border ${isCurrent
          ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/30'
          : 'bg-slate-800/70 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800'
        } card-switch-account flex items-center justify-between" data-id="${u.id}">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl ${u.avatarBg || 'bg-slate-700'} text-white font-extrabold flex items-center justify-center text-sm shadow-md border border-white/10 shrink-0">
              ${u.avatarLetter || u.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-white block leading-tight">${u.name}</span>
                ${isCurrent ? `
                  <span class="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Aktif
                  </span>
                ` : ''}
              </div>
              <span class="text-[10px] text-slate-400 block">${u.email} • Saldo: ${Calculator.formatRupiah(userBudgetLimit)}</span>
            </div>
          </div>

          <div>
            ${isCurrent ? `
              <span class="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
              </span>
            ` : `
              <button class="btn-select-account px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs touch-scale transition shadow-md shadow-emerald-900/30" data-id="${u.id}">
                Pilih
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="px-4 py-3 pb-32">
        <!-- Profile Header Card -->
        ${currentUser ? `
          <div class="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-4 mb-4 shadow-xl">
            <div class="flex items-center gap-3.5 mb-3">
              <div class="w-14 h-14 rounded-2xl ${currentUser.avatarBg || 'bg-emerald-600'} text-white font-extrabold flex items-center justify-center text-xl shadow-lg border-2 border-white/20 shrink-0">
                ${currentUser.avatarLetter || currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-1">
                  Akun Sedang Digunakan
                </span>
                <h3 class="text-base font-extrabold text-white truncate leading-tight">${currentUser.fullName || currentUser.name}</h3>
                <p class="text-xs text-slate-400 truncate">${currentUser.email}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
              <div class="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 text-center">
                <span class="text-[10px] text-slate-400 block uppercase font-medium">Batas Anggaran</span>
                <span class="text-xs font-extrabold text-white mt-0.5 block">${Calculator.formatRupiah(budget.monthlyLimit)}</span>
              </div>
              <div class="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 text-center">
                <span class="text-[10px] text-slate-400 block uppercase font-medium">Barang di Troli</span>
                <span class="text-xs font-extrabold text-emerald-400 mt-0.5 block">${cart.length} item</span>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button id="btn-account-supabase-config" class="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1.5 touch-scale transition border border-slate-700">
                <i data-lucide="database" class="w-3.5 h-3.5 text-emerald-400"></i>
                <span>Database Supabase</span>
              </button>
              <button id="btn-account-logout" class="flex-1 py-2 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-[11px] font-bold flex items-center justify-center gap-1.5 touch-scale transition border border-rose-500/30">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Section: Pilih & Beralih Akun (1-Tap Langsung) -->
        <div class="mb-5">
          <div class="flex items-center justify-between mb-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <i data-lucide="users" class="w-4 h-4 text-emerald-400"></i>
              <span>Daftar Akun di Aplikasi (1-Tap)</span>
            </h4>
            <span class="text-[10px] text-slate-400">${allUsers.length} akun tersimpan</span>
          </div>

          <div class="space-y-1">
            ${accountsHtml}
          </div>
          <p class="text-[10px] text-slate-400 mt-1 italic">
            *Ketuk pada kartu akun mana saja untuk langsung beralih dan memuat troli belanja milik akun tersebut seketika.
          </p>
        </div>

        <!-- Section: Masuk ke Akun Lain & Daftar Baru -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div class="flex rounded-xl bg-slate-950 p-1 mb-4 border border-slate-800">
            <button id="tab-sub-login" class="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white transition">
              Masuk ke Akun
            </button>
            <button id="tab-sub-register" class="flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition">
              + Buat Akun Baru
            </button>
          </div>

          <!-- Quick Fill Demo Buttons -->
          <div id="quick-demo-accounts" class="mb-3.5 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <span class="text-[10px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">Coba Akun Demo Cepat:</span>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="btn-demo-quick-login py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 touch-scale transition" data-user="rian">
                <span class="text-xs font-bold text-white block">👤 Akun Utama</span>
                <span class="text-[9px] text-emerald-400">Saldo Rp 500.000</span>
              </button>
              <button type="button" class="btn-demo-quick-login py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 touch-scale transition" data-user="aditya">
                <span class="text-xs font-bold text-white block">👤 Akun Sekunder</span>
                <span class="text-[9px] text-indigo-400">Saldo Rp 750.000</span>
              </button>
            </div>
          </div>

          <!-- Form: Login -->
          <form id="form-tab-login" class="space-y-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email atau Nama Akun *</label>
              <input type="text" id="tab-login-identifier" required placeholder="Contoh: user@grocerysafe.id atau nama akun" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Password *</label>
              <input type="password" id="tab-login-password" required placeholder="Password Anda (Demo: 123)" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
            </div>

            <button type="submit" class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/40 touch-scale">
              Masuk ke Akun
            </button>
          </form>

          <!-- Form: Register -->
          <form id="form-tab-register" class="space-y-3 hidden">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
              <input type="text" id="tab-reg-name" required placeholder="Contoh: Siti Rahma" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Status</label>
                <input type="text" id="tab-reg-role" placeholder="Mahasiswa" 
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Batas Saldo (Rp)</label>
                <input type="number" id="tab-reg-budget" value="500000" step="50000" 
                  class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email *</label>
              <input type="email" id="tab-reg-email" required placeholder="nama@email.com" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Password *</label>
              <input type="password" id="tab-reg-password" required placeholder="Minimal 3 karakter" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
            </div>

            <button type="submit" class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/40 touch-scale">
              Daftar & Langsung Masuk
            </button>
          </form>
        </div>
      </div>
    `;

    lucide.createIcons();
    this.bindAkunEvents();
  },

  /**
   * Bind events for Akun tab
   */
  bindAkunEvents() {
    // 1-tap card click to switch
    document.querySelectorAll('.card-switch-account').forEach(card => {
      card.addEventListener('click', (e) => {
        const targetId = card.getAttribute('data-id');
        const success = window.Auth.switchAccount(targetId);
        if (success) {
          const user = window.Auth.getCurrentUser();
          this.vibrate(40);
          this.showToast(`Beralih ke akun ${user.name}! Data belanja diperbarui.`);
          this.render();
        }
      });
    });

    // Quick demo buttons
    document.querySelectorAll('.btn-demo-quick-login').forEach(btn => {
      btn.addEventListener('click', () => {
        const userType = btn.getAttribute('data-user');
        if (userType === 'rian') {
          window.Auth.switchAccount('user_rian');
          this.vibrate(40);
          this.showToast('Masuk sebagai Akun Utama');
          this.render();
        } else if (userType === 'aditya') {
          window.Auth.switchAccount('user_aditya');
          this.vibrate(40);
          this.showToast('Masuk sebagai Akun Sekunder');
          this.render();
        }
      });
    });

    // Toggle sub-tabs
    const subLoginBtn = document.getElementById('tab-sub-login');
    const subRegBtn = document.getElementById('tab-sub-register');
    const formLogin = document.getElementById('form-tab-login');
    const formReg = document.getElementById('form-tab-register');
    const quickDemo = document.getElementById('quick-demo-accounts');

    subLoginBtn?.addEventListener('click', () => {
      subLoginBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white transition';
      subRegBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition';
      formLogin.classList.remove('hidden');
      formReg.classList.add('hidden');
      if (quickDemo) quickDemo.classList.remove('hidden');
    });

    subRegBtn?.addEventListener('click', () => {
      subRegBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white transition';
      subLoginBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition';
      formReg.classList.remove('hidden');
      formLogin.classList.add('hidden');
      if (quickDemo) quickDemo.classList.add('hidden');
    });

    // Handle Login Submit
    formLogin?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('tab-login-identifier').value;
      const pass = document.getElementById('tab-login-password').value;

      const res = window.Auth.login(id, pass);
      if (res.success) {
        this.vibrate(40);
        this.showToast(res.message || `Selamat datang kembali, ${res.user.name}!`);
        this.render();
      } else {
        this.showToast(res.message, 'error');
      }
    });

    // Handle Register Submit
    formReg?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('tab-reg-name').value;
      const role = document.getElementById('tab-reg-role').value || 'Anak Kost';
      const budgetLimit = document.getElementById('tab-reg-budget').value || 500000;
      const email = document.getElementById('tab-reg-email').value;
      const password = document.getElementById('tab-reg-password').value;

      const res = window.Auth.register({ name, role, email, password, monthlyLimit: budgetLimit });
      if (res.success) {
        this.vibrate([50, 100]);
        this.showToast(`Akun ${res.user.name} berhasil dibuat & aktif!`);
        this.render();
      } else {
        this.showToast(res.message, 'error');
      }
    });

    // Handle Supabase OAuth Config
    document.getElementById('btn-account-supabase-config')?.addEventListener('click', () => {
      this.openSupabaseConfigModal();
    });

    // Handle Logout
    document.getElementById('btn-account-logout')?.addEventListener('click', () => {
      this.openConfirmModal({
        title: 'Keluar dari Akun',
        message: 'Apakah Anda yakin ingin keluar dari akun ini dan kembali ke halaman login?',
        confirmText: 'Ya, Keluar',
        cancelText: 'Batal',
        onConfirm: () => {
          window.Auth.logout();
          this.vibrate(40);
          this.showToast('Berhasil keluar dari akun.');
          this.render();
        }
      });
    });
  },

  /**
   * Render Formal Auth Gatekeeper (Login & Sign Up Screen)
   */
  renderAuthGatekeeper() {
    const container = document.getElementById('auth-gatekeeper');
    if (!container) return;

    container.innerHTML = `
      <div class="w-full max-w-sm mx-auto flex flex-col justify-between min-h-screen py-4 sm:py-6">
        
        <!-- Top School & App Identity -->
        <div>
          <div class="text-center mb-5">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold mb-3 shadow-sm">
              <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
              <span>Smart Grocery & Budget Tracker</span>
            </div>
            
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-950/60 mb-2.5">
              <i data-lucide="shopping-cart" class="w-7 h-7"></i>
            </div>

            <h1 class="text-xl font-extrabold text-white tracking-tight">Smart Grocery Tracker</h1>
            <p class="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">Sistem Belanja Cerdas, Budget Safety Cap & Fluktuasi Harga Realtime</p>
          </div>

          <!-- Main Auth Card -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            
            <!-- Segmented Switcher: [Masuk] / [Daftar Akun Baru] -->
            <div class="flex rounded-2xl bg-slate-950 p-1 mb-4 border border-slate-800">
              <button id="gatekeeper-tab-login" class="flex-1 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white transition touch-scale flex items-center justify-center gap-1.5">
                <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
                <span>Masuk</span>
              </button>
              <button id="gatekeeper-tab-register" class="flex-1 py-2.5 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition touch-scale flex items-center justify-center gap-1.5">
                <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                <span>Daftar Akun Baru</span>
              </button>
            </div>

            <!-- Error Banner (Dynamic) -->
            <div id="gatekeeper-error-box" class="hidden mb-3.5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-shake">
              <i data-lucide="alert-circle" class="w-4 h-4 text-rose-400 shrink-0 mt-0.5"></i>
              <span id="gatekeeper-error-msg" class="flex-1 font-medium leading-tight"></span>
            </div>

            <!-- FORM 1: MASUK (LOGIN) -->
            <form id="gatekeeper-form-login" class="space-y-3.5">
              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Email atau Nama Akun *</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i data-lucide="mail" class="w-4 h-4"></i>
                  </div>
                  <input type="text" id="gatekeeper-login-id" required placeholder="Contoh: rian@kost.id atau user@grocerysafe.id" 
                    class="w-full bg-slate-800/90 border border-slate-700 rounded-2xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition">
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-[11px] font-semibold text-slate-300">Password *</label>
                  <span class="text-[10px] text-slate-400">Demo: <span class="text-emerald-400 font-mono font-bold">rian@kost.id</span> | Pass: <span class="text-emerald-400 font-mono font-bold">123</span></span>
                </div>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i data-lucide="lock" class="w-4 h-4"></i>
                  </div>
                  <input type="password" id="gatekeeper-login-pass" required placeholder="Masukkan password Anda" 
                    class="w-full bg-slate-800/90 border border-slate-700 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition">
                  <button type="button" id="btn-toggle-login-pass" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              <button type="submit" class="w-full min-h-[46px] py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 touch-scale transition">
                <i data-lucide="log-in" class="w-4 h-4"></i>
                <span>Masuk ke Aplikasi</span>
              </button>

              <div class="text-center pt-1">
                <button type="button" id="link-to-register" class="text-[11px] text-slate-400 hover:text-emerald-400 transition">
                  Belum punya akun? <span class="text-emerald-400 font-bold underline">Daftar sekarang</span>
                </button>
              </div>
            </form>

            <!-- FORM 2: DAFTAR AKUN BARU (SIGN UP) -->
            <form id="gatekeeper-form-reg" class="space-y-3 hidden">
              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
                <input type="text" id="gatekeeper-reg-name" required placeholder="Contoh: Siti Rahma" 
                  class="w-full bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition">
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email *</label>
                <input type="email" id="gatekeeper-reg-email" required placeholder="nama@email.com" 
                  class="w-full bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition">
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Status / Peran</label>
                  <select id="gatekeeper-reg-role" class="w-full bg-slate-800/90 border border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition">
                    <option value="Siswa Rantau">Siswa Rantau</option>
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Ibu Rumah Tangga">Ibu Rumah Tangga</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Batas Dompet (Rp)</label>
                  <input type="number" id="gatekeeper-reg-budget" value="500000" step="50000" inputmode="numeric" 
                    class="w-full bg-slate-800/90 border border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Password *</label>
                  <input type="password" id="gatekeeper-reg-pass" required minlength="3" placeholder="Min. 3 karakter" 
                    class="w-full bg-slate-800/90 border border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Konfirmasi *</label>
                  <input type="password" id="gatekeeper-reg-confirm" required minlength="3" placeholder="Ulangi password" 
                    class="w-full bg-slate-800/90 border border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition">
                </div>
              </div>

              <button type="submit" class="w-full min-h-[46px] mt-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 touch-scale transition">
                <i data-lucide="user-check" class="w-4 h-4"></i>
                <span>Daftar Akun Baru</span>
              </button>

              <div class="text-center pt-1">
                <button type="button" id="link-to-login" class="text-[11px] text-slate-400 hover:text-emerald-400 transition">
                  Sudah punya akun? <span class="text-emerald-400 font-bold underline">Masuk di sini</span>
                </button>
              </div>
            </form>

            <!-- SSO DIVIDER -->
            <div class="relative flex items-center justify-center my-4">
              <div class="border-t border-slate-800 w-full"></div>
              <span class="bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">atau lanjutkan dengan</span>
              <div class="border-t border-slate-800 w-full"></div>
            </div>

            <!-- GOOGLE OAUTH BUTTON (SUPABASE) -->
            <button type="button" id="btn-gatekeeper-google" class="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all touch-scale border border-slate-200">
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>
            <p class="text-[9px] text-center text-slate-400 mt-1.5 flex items-center justify-center gap-1">
              <i data-lucide="shield" class="w-3 h-3 text-emerald-400"></i>
              <span>Otentikasi aman via Supabase OAuth Provider</span>
            </p>

          </div>
        </div>

      </div>
    `;

    if (window.lucide) lucide.createIcons();
    this.bindGatekeeperEvents();
  },

  /**
   * Bind event listeners for the Gatekeeper login/register screen
   */
  bindGatekeeperEvents() {
    const tabLogin = document.getElementById('gatekeeper-tab-login');
    const tabReg = document.getElementById('gatekeeper-tab-register');
    const formLogin = document.getElementById('gatekeeper-form-login');
    const formReg = document.getElementById('gatekeeper-form-reg');
    const errorBox = document.getElementById('gatekeeper-error-box');
    const errorMsg = document.getElementById('gatekeeper-error-msg');
    const linkReg = document.getElementById('link-to-register');
    const linkLogin = document.getElementById('link-to-login');

    const showLoginTab = () => {
      tabLogin.className = 'flex-1 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white transition touch-scale flex items-center justify-center gap-1.5';
      tabReg.className = 'flex-1 py-2.5 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition touch-scale flex items-center justify-center gap-1.5';
      formLogin.classList.remove('hidden');
      formReg.classList.add('hidden');
      if (errorBox) errorBox.classList.add('hidden');
    };

    const showRegTab = () => {
      tabReg.className = 'flex-1 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white transition touch-scale flex items-center justify-center gap-1.5';
      tabLogin.className = 'flex-1 py-2.5 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition touch-scale flex items-center justify-center gap-1.5';
      formReg.classList.remove('hidden');
      formLogin.classList.add('hidden');
      if (errorBox) errorBox.classList.add('hidden');
    };

    tabLogin?.addEventListener('click', showLoginTab);
    tabReg?.addEventListener('click', showRegTab);
    linkReg?.addEventListener('click', showRegTab);
    linkLogin?.addEventListener('click', showLoginTab);

    // Toggle password visibility
    const togglePassBtn = document.getElementById('btn-toggle-login-pass');
    const passInput = document.getElementById('gatekeeper-login-pass');
    togglePassBtn?.addEventListener('click', () => {
      if (passInput) {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        togglePassBtn.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
        if (window.lucide) lucide.createIcons();
      }
    });

    // Handle Login Submit
    formLogin?.addEventListener('submit', (e) => {
      e.preventDefault();
      const identifier = document.getElementById('gatekeeper-login-id')?.value;
      const password = document.getElementById('gatekeeper-login-pass')?.value;

      const res = window.Auth.login(identifier, password);
      if (res.success) {
        if (errorBox) errorBox.classList.add('hidden');
        this.vibrate(40);
        this.showToast(res.message || `Selamat datang, ${res.user.name}!`);
        this.render();
      } else {
        this.vibrate([50, 50]);
        if (errorBox && errorMsg) {
          errorMsg.textContent = res.message;
          errorBox.classList.remove('hidden');
        } else {
          this.showToast(res.message, 'error');
        }
      }
    });

    // Handle Register Submit
    formReg?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('gatekeeper-reg-name')?.value;
      const email = document.getElementById('gatekeeper-reg-email')?.value;
      const role = document.getElementById('gatekeeper-reg-role')?.value || 'Siswa Rantau';
      const budget = document.getElementById('gatekeeper-reg-budget')?.value || 500000;
      const pass = document.getElementById('gatekeeper-reg-pass')?.value;
      const confirm = document.getElementById('gatekeeper-reg-confirm')?.value;

      if (pass !== confirm) {
        this.vibrate([50, 50]);
        if (errorBox && errorMsg) {
          errorMsg.textContent = 'Konfirmasi password tidak cocok! Silakan periksa kembali.';
          errorBox.classList.remove('hidden');
        } else {
          this.showToast('Konfirmasi password tidak cocok!', 'error');
        }
        return;
      }

      const res = window.Auth.register({
        name,
        email,
        password: pass,
        role,
        monthlyLimit: budget
      });

      if (res.success) {
        if (errorBox) errorBox.classList.add('hidden');
        this.vibrate([50, 100]);
        this.showToast(res.message || `Pendaftaran berhasil! Selamat datang, ${res.user.name}.`);
        this.render();
      } else {
        this.vibrate([50, 50]);
        if (errorBox && errorMsg) {
          errorMsg.textContent = res.message;
          errorBox.classList.remove('hidden');
        } else {
          this.showToast(res.message, 'error');
        }
      }
    });

    // Handle Google OAuth Button
    document.getElementById('btn-gatekeeper-google')?.addEventListener('click', () => {
      window.Auth.loginWithGoogle();
    });

    // Handle Quick Demo buttons
    document.querySelectorAll('.btn-gatekeeper-quick-demo').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-user');
        const success = window.Auth.switchAccount(userId);
        if (success) {
          const user = window.Auth.getCurrentUser();
          this.vibrate(40);
          this.showToast(`Masuk sebagai ${user.name}`);
          this.render();
        }
      });
    });
  },

  /**
   * Modal to configure Supabase API Key for Database & Google OAuth
   */
  openSupabaseConfigModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const currentKey = window.SUPABASE_CONFIG.getAnonKey();

    modalContainer.className = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
    modalContainer.innerHTML = `
      <div class="glass-panel w-full max-w-sm rounded-3xl p-5 border border-slate-700 shadow-2xl animate-slide-up space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <i data-lucide="database" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-white">Database & OAuth Supabase</h3>
              <p class="text-[10px] text-slate-400">Konfigurasi Cloud Supabase</p>
            </div>
          </div>
          <button id="btn-close-supabase-modal" class="p-1 rounded-lg text-slate-400 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-2.5 text-xs">
          <!-- Project Info Box -->
          <div class="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400">Project URL:</span>
              <span class="text-emerald-400 font-mono font-bold">neehtpmqsgdnxijxuswq</span>
            </div>
            <p class="text-[10px] text-slate-300 truncate font-mono">https://neehtpmqsgdnxijxuswq.supabase.co</p>
            
            <div class="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-800">
              <span class="text-slate-400">OAuth Callback URL:</span>
              <button id="btn-copy-callback-url" class="text-emerald-400 hover:underline flex items-center gap-1 font-bold">
                <i data-lucide="copy" class="w-3 h-3"></i> Salin
              </button>
            </div>
            <p class="text-[9px] text-slate-400 truncate font-mono">https://neehtpmqsgdnxijxuswq.supabase.co/auth/v1/callback</p>
          </div>

          <!-- Anon Key Input -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Supabase Anon Key (Public API Key):</label>
            <textarea id="input-supabase-anon-key" rows="2" placeholder="Tempelkan Supabase anon public key Anda di sini (eyJhbGciOi...)" 
              class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500">${currentKey}</textarea>
            <p class="text-[10px] text-slate-400 mt-1">
              *Dapatkan dari: Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project API keys &rarr; anon public.
            </p>
          </div>

          <!-- SQL Schema Copy Button -->
          <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-slate-300 block">Tabel Database Belanja</span>
              <span class="text-[9px] text-slate-400 block">grocery_cart, grocery_budget, grocery_history</span>
            </div>
            <button id="btn-copy-sql-schema" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
              <i data-lucide="code" class="w-3 h-3"></i>
              <span>Salin SQL</span>
            </button>
          </div>

          <!-- Test Connection Status Box -->
          <div id="supabase-test-status" class="hidden p-2.5 rounded-xl text-[11px] leading-relaxed"></div>
        </div>

        <div class="space-y-2 pt-2 border-t border-slate-800">
          <div class="grid grid-cols-2 gap-2">
            <button id="btn-test-supabase-db" class="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 touch-scale transition flex items-center justify-center gap-1">
              <i data-lucide="activity" class="w-3.5 h-3.5 text-sky-400"></i>
              <span>Uji Koneksi</span>
            </button>
            <button id="btn-save-supabase-config" class="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-md touch-scale transition flex items-center justify-center gap-1">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              <span>Simpan & Pakai</span>
            </button>
          </div>
          
          <button id="btn-demo-google-login" class="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-[10px] border border-slate-700 touch-scale transition flex items-center justify-center gap-1.5">
            <i data-lucide="sparkles" class="w-3 h-3 text-amber-400"></i>
            <span>Uji Coba Masuk Google (Mode Simulasi Demo)</span>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    document.getElementById('btn-close-supabase-modal')?.addEventListener('click', () => {
      modalContainer.className = 'hidden';
      modalContainer.innerHTML = '';
    });

    document.getElementById('btn-copy-callback-url')?.addEventListener('click', () => {
      navigator.clipboard.writeText('https://neehtpmqsgdnxijxuswq.supabase.co/auth/v1/callback');
      this.showToast('Callback URL disalin ke clipboard!');
    });

    document.getElementById('btn-copy-sql-schema')?.addEventListener('click', () => {
      const sqlCode = `-- SKEMA DATABASE SMART GROCERY TRACKER (SUPABASE POSTGRESQL)
CREATE TABLE IF NOT EXISTS public.grocery_cart (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user_rian',
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Bahan Pokok',
    unit TEXT DEFAULT 'pcs',
    qty NUMERIC NOT NULL DEFAULT 1,
    current_price NUMERIC NOT NULL DEFAULT 0,
    last_price NUMERIC DEFAULT 0,
    discount_type TEXT DEFAULT 'none',
    discount_a NUMERIC DEFAULT 0,
    discount_b NUMERIC DEFAULT 0,
    discount_nominal NUMERIC DEFAULT 0,
    is_checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grocery_budget (
    user_id TEXT PRIMARY KEY,
    monthly_limit NUMERIC NOT NULL DEFAULT 500000,
    emergency_reserve NUMERIC NOT NULL DEFAULT 50000,
    user_name TEXT DEFAULT 'Pengguna Utama',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grocery_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user_rian',
    store_name TEXT DEFAULT 'Supermarket',
    transaction_date TEXT,
    total_spent NUMERIC NOT NULL DEFAULT 0,
    total_saved NUMERIC DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.grocery_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses Publik grocery_cart" ON public.grocery_cart FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Publik grocery_budget" ON public.grocery_budget FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Publik grocery_history" ON public.grocery_history FOR ALL USING (true) WITH CHECK (true);`;

      navigator.clipboard.writeText(sqlCode);
      this.showToast('✅ Script SQL berhasil disalin! Tempel di SQL Editor Supabase.');
    });

    // Uji Koneksi Database Supabase
    document.getElementById('btn-test-supabase-db')?.addEventListener('click', async () => {
      const val = document.getElementById('input-supabase-anon-key')?.value;
      const statusBox = document.getElementById('supabase-test-status');
      if (val && val.trim()) {
        window.SUPABASE_CONFIG.setAnonKey(val.trim());
      }

      if (statusBox) {
        statusBox.className = 'p-2.5 rounded-xl bg-slate-800 text-slate-300 text-[11px] flex items-center gap-2 block';
        statusBox.innerHTML = '<span class="w-3 h-3 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0"></span><span>Menguji koneksi ke Supabase...</span>';
      }

      if (window.SupabaseDB) {
        const res = await window.SupabaseDB.testConnection();
        if (statusBox) {
          if (res.success) {
            statusBox.className = 'p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] block';
            statusBox.innerHTML = `<strong>✅ Terhubung!</strong> ${res.message}`;
          } else {
            statusBox.className = 'p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] block';
            statusBox.innerHTML = `<strong>⚠️ ${res.code || 'Gagal'}:</strong> ${res.message}`;
          }
        }
      }
    });

    document.getElementById('btn-save-supabase-config')?.addEventListener('click', () => {
      const val = document.getElementById('input-supabase-anon-key')?.value;
      if (val && val.trim()) {
        window.SUPABASE_CONFIG.setAnonKey(val.trim());
        if (window.SupabaseDB) window.SupabaseDB.init();
        modalContainer.className = 'hidden';
        modalContainer.innerHTML = '';
        this.showToast('✅ Supabase Anon Key berhasil disimpan dan aktif!');
      } else {
        this.showToast('Silakan tempelkan Anon Key terlebih dahulu.', 'error');
      }
    });

    document.getElementById('btn-demo-google-login')?.addEventListener('click', () => {
      modalContainer.className = 'hidden';
      modalContainer.innerHTML = '';
      window.Auth.loginWithGoogleDemo();
    });
  },

  /**
   * Full App Render Loop
   */
  render() {
    const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
    const gatekeeper = document.getElementById('auth-gatekeeper');
    const mainShell = document.getElementById('main-app-shell');
    const bottomNav = document.getElementById('bottom-navigation-bar');

    // If no user is logged in, show Gatekeeper and hide app shell
    if (!currentUser) {
      if (gatekeeper) gatekeeper.classList.remove('hidden');
      if (mainShell) mainShell.classList.add('hidden');
      if (bottomNav) bottomNav.classList.add('hidden');
      this.renderAuthGatekeeper();
      return;
    }

    // User is logged in: hide Gatekeeper and show main app shell
    if (gatekeeper) gatekeeper.classList.add('hidden');
    if (mainShell) mainShell.classList.remove('hidden');
    if (bottomNav) bottomNav.classList.remove('hidden');

    const mainEl = document.querySelector('main');
    const scrollPos = mainEl ? mainEl.scrollTop : 0;

    this.renderAppHeader();

    const budget = Store.getBudgetSettings();
    const cart = Store.getActiveCart();
    const discount = Store.getCartDiscount();
    const monthlyHistorySpent = Store.getMonthlyHistoricalSpent ? Store.getMonthlyHistoricalSpent() : 0;
    const summary = Calculator.calculateCartSummary(cart, budget.monthlyLimit, discount, monthlyHistorySpent);

    const currentTab = this.activeTab || 'belanja';
    const budgetHeader = document.getElementById('sticky-budget-header');

    // Budget Safety Cap hanya dimunculkan di menu Belanja saja
    if (currentTab === 'belanja') {
      if (budgetHeader) budgetHeader.classList.remove('hidden');
      this.renderBudgetHeader(summary);
    } else {
      if (budgetHeader) budgetHeader.classList.add('hidden');
    }

    // Ensure corresponding tab content is visible and others hidden
    ['belanja', 'riwayat', 'anggaran'].forEach(id => {
      const el = document.getElementById(`tab-content-${id}`);
      if (el) {
        if (id === currentTab) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Ensure bottom nav button active state is synced
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const target = btn.getAttribute('data-tab');
      const icon = btn.querySelector('.nav-icon-wrapper');
      const text = btn.querySelector('.nav-text');
      if (target === currentTab) {
        btn.classList.add('text-emerald-400');
        btn.classList.remove('text-slate-400');
        if (icon) {
          icon.classList.add('bg-emerald-500/20', 'text-emerald-400');
          icon.classList.remove('text-slate-400');
        }
        if (text) text.classList.add('font-bold');
      } else {
        btn.classList.remove('text-emerald-400');
        btn.classList.add('text-slate-400');
        if (icon) {
          icon.classList.remove('bg-emerald-500/20', 'text-emerald-400');
          icon.classList.add('text-slate-400');
        }
        if (text) text.classList.remove('font-bold');
      }
    });

    if (currentTab === 'belanja') {
      this.renderBelanjaTab(summary);
    } else if (currentTab === 'riwayat') {
      this.renderRiwayatTab();
    } else if (currentTab === 'anggaran') {
      this.renderAnggaranTab(summary);
    } else {
      this.activeTab = 'belanja';
      this.renderBelanjaTab(summary);
    }

    if (mainEl && scrollPos > 0) {
      mainEl.scrollTop = scrollPos;
    }
  }
};

window.UI = UI;
