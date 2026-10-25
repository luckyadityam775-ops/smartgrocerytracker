/**
 * UI Renderer Module for Smart Grocery & Budget Safety Tracker
 * High aesthetics, mobile ergonomics, thumb-friendly targets, and reactive rendering.
 */

const UI = {
  activeTab: 'belanja',
  hapticTriggered: false,

  /**
   * Trigger haptic vibration if supported on mobile device
   * @param {Array<number>|number} pattern 
   */
  vibrate(pattern = 50) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore devices where vibration is disabled or unsupported
      }
    }
  },

  /**
   * Render Top Sticky Budget Safety Cap Header [F-05]
   */
  renderBudgetHeader(summary) {
    const container = document.getElementById('sticky-budget-header');
    if (!container) return;

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

    // Trigger danger vibration effect once when crossing into danger zone
    if (safetyStatus === 'danger') {
      if (!this.hapticTriggered) {
        this.vibrate([200, 100, 200, 100, 300]);
        this.hapticTriggered = true;
      }
    } else {
      this.hapticTriggered = false;
    }

    // Colors and visual alerts
    let barColor = 'bg-emerald-500';
    let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    let balanceTextColor = 'text-emerald-400';
    let headerBorder = 'border-slate-800';
    let shakeClass = '';

    if (safetyStatus === 'warning') {
      barColor = 'bg-amber-500';
      badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      balanceTextColor = 'text-amber-400';
      headerBorder = 'border-amber-500/40';
    } else if (safetyStatus === 'danger') {
      barColor = 'bg-rose-500 animate-pulse';
      badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      balanceTextColor = 'text-rose-400';
      headerBorder = 'border-rose-500/60';
      shakeClass = 'animate-shake';
    }

    container.className = `sticky top-0 z-30 glass-panel border-b ${headerBorder} px-4 py-3 transition-all duration-300 ${shakeClass}`;

    container.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-1.5">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400">
            <i data-lucide="shield-check" class="w-4 h-4"></i>
          </span>
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-300">Budget Safety Cap</span>
        </div>
        <button id="btn-quick-edit-budget" class="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 hover:text-white flex items-center gap-1 touch-scale">
          <i data-lucide="edit-3" class="w-3 h-3"></i>
          <span>Ubah Batas</span>
        </button>
      </div>

      <!-- Main Balance Equation [Batas Saldo] - [Total Belanja] = [Sisa Saldo] -->
      <div class="grid grid-cols-3 gap-1.5 text-center bg-slate-900/90 rounded-2xl p-2.5 border border-slate-800/80 shadow-inner">
        <div class="flex flex-col items-center justify-center p-1">
          <span class="text-[10px] text-slate-400 uppercase font-medium">Batas Saldo</span>
          <span class="text-xs font-bold text-slate-200 mt-0.5 truncate max-w-full">${Calculator.formatRupiah(budgetLimit)}</span>
        </div>
        <div class="flex flex-col items-center justify-center p-1 border-x border-slate-800">
          <span class="text-[10px] text-slate-400 uppercase font-medium">Total Belanja</span>
          <span class="text-xs font-bold text-white mt-0.5 truncate max-w-full">${Calculator.formatRupiah(grandTotal)}</span>
        </div>
        <div class="flex flex-col items-center justify-center p-1">
          <span class="text-[10px] text-slate-400 uppercase font-medium">${isOverbudget ? 'Kurang (Minus)' : 'Sisa Saldo'}</span>
          <span class="text-xs font-extrabold ${balanceTextColor} mt-0.5 truncate max-w-full">${Calculator.formatRupiah(remainingBudget)}</span>
        </div>
      </div>

      <!-- Visual Safety Cap Bar -->
      <div class="mt-2.5">
        <div class="flex items-center justify-between text-[11px] mb-1">
          <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badgeBg}">
            <span class="w-1.5 h-1.5 rounded-full ${barColor}"></span>
            <span>${statusLabel}</span>
          </div>
          <span class="font-bold text-slate-300 text-[11px]">${budgetUsagePercent}% Terpakai</span>
        </div>
        
        <div class="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div class="h-full rounded-full budget-bar-fill ${barColor}" style="width: ${Math.min(budgetUsagePercent, 100)}%"></div>
        </div>

        ${allSavings > 0 ? `
          <div class="mt-1 flex items-center justify-between text-[10px] text-emerald-400 font-medium">
            <span class="inline-flex items-center gap-1"><i data-lucide="tag" class="w-3 h-3"></i> Total Hemat Promo:</span>
            <span class="font-bold">${Calculator.formatRupiah(allSavings)}</span>
          </div>
        ` : ''}

        ${safetyStatus === 'danger' ? `
          <div class="mt-1.5 p-1.5 bg-rose-500/20 border border-rose-500/40 rounded-lg flex items-center gap-2 text-rose-200 text-xs">
            <i data-lucide="alert-triangle" class="w-4 h-4 shrink-0 text-rose-400 animate-bounce"></i>
            <span class="text-[11px] leading-tight font-medium">Kurangi beberapa barang dari troli sebelum ke meja kasir!</span>
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
   * Render Tab 1: Belanja (Cart Items List & Controls)
   */
  renderBelanjaTab(summary) {
    const container = document.getElementById('tab-content-belanja');
    if (!container) return;

    const { items, grandTotal, allSavings, totalItemsCount } = summary;

    let itemsHtml = '';
    if (items.length === 0) {
      itemsHtml = `
        <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div class="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
            <i data-lucide="shopping-cart" class="w-10 h-10 text-emerald-500/60"></i>
          </div>
          <h3 class="text-base font-bold text-white mb-1">Troli Masih Kosong</h3>
          <p class="text-xs text-slate-400 max-w-xs mb-6">
            Mulai masukkan barang belanjaan saat berjalan di supermarket untuk memantau sisa saldo dompet secara real-time.
          </p>
          <button id="btn-empty-add-item" class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 touch-scale">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Tambah Barang Pertama</span>
          </button>
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
                  <span class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                    ${item.category || 'Sembako'}
                  </span>
                  <span class="text-[10px] text-slate-400">
                    Satuan: <strong class="text-slate-300">${item.unit || 'pcs'}</strong>
                  </span>
                </div>
                <h4 class="text-sm font-bold text-white tracking-tight leading-tight truncate">${item.name}</h4>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button class="btn-edit-item p-1.5 rounded-xl bg-slate-800/60 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors touch-scale" data-id="${item.id}" title="Edit Barang">
                  <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
                <button class="btn-delete-item p-1.5 rounded-xl bg-slate-800/60 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors touch-scale" data-id="${item.id}" title="Hapus Item">
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
              <!-- Thumb-Friendly Stepper (+ / -) -->
              <div class="flex items-center gap-2 bg-slate-900/90 rounded-xl p-1 border border-slate-800">
                <button class="btn-qty-minus stepper-btn touch-scale" data-id="${item.id}" aria-label="Kurangi kuantitas">
                  <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                </button>
                <span class="text-sm font-extrabold text-white min-w-[28px] text-center select-none">${item.qty}</span>
                <button class="btn-qty-plus stepper-btn touch-scale" data-id="${item.id}" aria-label="Tambah kuantitas">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                </button>
              </div>

              <!-- Real-time Subtotal per Row [F-02] -->
              <div class="text-right">
                <span class="text-[10px] text-slate-400 uppercase font-medium block">Subtotal</span>
                <span class="text-sm font-extrabold text-emerald-400 leading-none">
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
        <!-- Action Row above list -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <i data-lucide="shopping-bag" class="w-4 h-4 text-emerald-400"></i>
            <span>Keranjang Aktif (<strong class="text-white">${totalItemsCount}</strong> item)</span>
          </div>

          ${items.length > 0 ? `
            <button id="btn-clear-cart" class="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg bg-slate-800/60 touch-scale">
              Kosongkan
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
            <div class="bg-gradient-to-r from-emerald-950/60 to-slate-900/90 rounded-2xl p-4 border border-emerald-500/20 mb-4 shadow-xl">
              <div class="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Total Item Belanja:</span>
                <span class="font-bold text-white">${totalItemsCount} barang</span>
              </div>
              <div class="flex items-center justify-between text-xs text-emerald-400 mb-2">
                <span>Total Hemat Promo:</span>
                <span class="font-bold">${Calculator.formatRupiah(allSavings)}</span>
              </div>
              <div class="flex items-center justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                <span>Total Pembayaran:</span>
                <span class="text-base text-emerald-400">${Calculator.formatRupiah(grandTotal)}</span>
              </div>
            </div>

            <!-- [F-06] Primary Action: Selesaikan & Simpan Belanja Bulan Ini -->
            <button id="btn-finish-shopping" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 touch-scale">
              <i data-lucide="check-circle-2" class="w-5 h-5"></i>
              <span>Selesaikan & Simpan Belanja Bulan Ini</span>
            </button>
            <p class="text-[10px] text-center text-slate-400 mt-2">
              Item akan diarsipkan ke Riwayat dan memperbarui patokan harga bulan depan.
            </p>
          </div>
        ` : '<div class="pb-24"></div>'}
      </div>

      <!-- Floating Quick Add Button (Bottom Right) -->
      <button id="btn-fab-add" class="fixed bottom-20 right-4 sm:right-[calc(50%-200px)] z-20 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl shadow-emerald-500/50 flex items-center justify-center touch-scale" title="Tambah Barang">
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
    // Stepper Plus
    document.querySelectorAll('.btn-qty-plus').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.vibrate(20);
        Store.updateItemQty(id, 1);
      });
    });

    // Stepper Minus
    document.querySelectorAll('.btn-qty-minus').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.vibrate(20);
        Store.updateItemQty(id, -1);
      });
    });

    // Delete Item
    document.querySelectorAll('.btn-delete-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.vibrate(40);
        Store.removeCartItem(id);
      });
    });

    // Edit Item
    document.querySelectorAll('.btn-edit-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const cart = Store.getActiveCart();
        const item = cart.find(i => i.id === id);
        if (item) {
          this.vibrate(20);
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

    // Floating Add Button
    const fabAdd = document.getElementById('btn-fab-add');
    if (fabAdd) {
      fabAdd.addEventListener('click', () => {
        this.openAddItemModal();
      });
    }

    // Clear cart button
    const clearBtn = document.getElementById('btn-clear-cart');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm("Kosongkan semua barang dari keranjang aktif?")) {
          Store.clearActiveCart();
        }
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
   * Render Tab 2: Riwayat (History & Price Trend Chart) [F-06]
   */
  renderRiwayatTab() {
    const container = document.getElementById('tab-content-riwayat');
    if (!container) return;

    const history = Store.getHistory();

    // Generate lightweight responsive SVG Bar Chart
    let chartHtml = '';
    if (history.length > 0) {
      const chartData = [...history].reverse().slice(-4); // Last 4 sessions
      const maxAmount = Math.max(...chartData.map(h => h.totalAmount), 500000);
      
      const barsHtml = chartData.map((session, idx) => {
        const heightPercent = Math.max(15, Math.round((session.totalAmount / maxAmount) * 100));
        return `
          <div class="flex-1 flex flex-col items-center gap-2">
            <span class="text-[10px] font-bold text-slate-300">${Calculator.formatRupiah(session.totalAmount).replace('Rp ', '')}</span>
            <div class="w-full bg-slate-800 rounded-t-xl overflow-hidden flex items-end justify-center" style="height: 110px;">
              <div class="w-8 sm:w-10 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all duration-500" style="height: ${heightPercent}%;"></div>
            </div>
            <span class="text-[10px] font-semibold text-slate-400 text-center truncate max-w-[65px]">${session.monthName.split(' ')[0]}</span>
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
            <span class="text-[10px] text-slate-400">Total ${history.length} Catatan</span>
          </div>
          <div class="flex items-end justify-between gap-3 pt-2 px-1">
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
              <span class="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                ${Calculator.formatRupiah(record.totalAmount)}
              </span>
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
        const id = e.currentTarget.getAttribute('data-id');
        this.openReceiptModal(id);
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
              ${currentUser?.avatarLetter || 'R'}
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-white leading-tight">${currentUser?.fullName || 'Rian (Anak Rantau)'}</h4>
              <p class="text-xs text-slate-400">${currentUser?.email || 'rian@kost.id'}</p>
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
        if (confirm("Reset ulang semua data simulasi ke pengaturan awal?")) {
          Store.resetDemo();
        }
      });
    }
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
            <button id="modal-close" class="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 touch-scale">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Form [F-01] -->
          <form id="form-add-item" class="space-y-4">
            <!-- Nama Produk with Live Autocomplete -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Produk *</label>
              <div class="relative">
                <input type="text" id="input-name" required placeholder="Contoh: Beras Ramos 5kg, Telur, Indomie..." 
                  class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-500">
                <div id="autocomplete-results" class="hidden absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-700/50"></div>
              </div>
            </div>

            <!-- Kategori & Satuan -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                <select id="input-category" class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
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
                  <option value="pcs">pcs</option>
                  <option value="pack">pack</option>
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
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
                  <button type="button" id="modal-qty-minus" class="stepper-btn w-8 h-8 text-sm">-</button>
                  <input type="number" id="input-qty" value="1" min="1" class="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none">
                  <button type="button" id="modal-qty-plus" class="stepper-btn w-8 h-8 text-sm">+</button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Harga Satuan (Rp) *</label>
                <input type="number" id="input-price" required placeholder="0" min="0" 
                  class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500">
              </div>
            </div>

            <!-- Harga Bulan Lalu & Real-time Comparator Preview [F-04] -->
            <div class="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <i data-lucide="history" class="w-3.5 h-3.5"></i>
                  <span>Harga Bulan Lalu (Rp):</span>
                </label>
                <input type="number" id="input-last-price" placeholder="Otomatis / 0" min="0" 
                  class="w-32 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right text-slate-300 focus:outline-none focus:border-emerald-500">
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
                  <label class="text-[11px] text-slate-400 block mb-1">Persen Diskon (%):</label>
                  <input type="number" id="input-disc-a" placeholder="Contoh: 25" min="0" max="100" 
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                </div>

                <!-- Tiered Discount (% + %) -->
                <div id="container-disc-tiered" class="hidden space-y-1.5">
                  <label class="text-[11px] text-slate-400 block">Diskon Bertingkat (Contoh: 50% + 20%):</label>
                  <div class="grid grid-cols-2 gap-2">
                    <input type="number" id="input-tier-a" placeholder="Diskon 1 (%)" min="0" max="100" 
                      class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                    <input type="number" id="input-tier-b" placeholder="Diskon 2 (%)" min="0" max="100" 
                      class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                  </div>
                  <p class="text-[10px] text-slate-400 italic">
                    *Dihitung berturut-turut (sekuensial), bukan dijumlahkan 70%.
                  </p>
                </div>

                <!-- Nominal Discount -->
                <div id="container-disc-nominal" class="hidden">
                  <label class="text-[11px] text-slate-400 block mb-1">Potongan Langsung (Rp):</label>
                  <input type="number" id="input-disc-nominal" placeholder="Contoh: 5000" min="0" 
                    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                </div>

                <!-- Live Savings Preview -->
                <div id="modal-savings-preview" class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold flex items-center justify-between">
                  <span>Hasil Diskon:</span>
                  <span id="label-calculated-savings">Hemat Rp 0</span>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 touch-scale">
              <i data-lucide="${isEdit ? 'check' : 'shopping-bag'}" class="w-4 h-4"></i>
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
   * Bind events inside Add Item Modal
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

    // Stepper modal
    document.getElementById('modal-qty-plus').addEventListener('click', () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value || 1, 10) + 1);
      updatePreviews();
    });
    document.getElementById('modal-qty-minus').addEventListener('click', () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value || 1, 10) - 1);
      updatePreviews();
    });

    // Autocomplete for Nama Produk
    nameInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q.length < 2) {
        autocompleteDiv.classList.add('hidden');
        return;
      }
      const matches = Store.searchCatalog(q);
      if (matches.length > 0) {
        autocompleteDiv.innerHTML = matches.map(item => `
          <div class="px-3 py-2 text-xs hover:bg-slate-700 cursor-pointer flex items-center justify-between auto-suggest-item" 
               data-name="${item.name}" data-category="${item.category}" data-unit="${item.unit}" data-lastprice="${item.lastPrice}">
            <div>
              <span class="font-bold text-white">${item.name}</span>
              <span class="text-[10px] text-slate-400 block">${item.category} • ${item.unit}</span>
            </div>
            <span class="text-xs text-emerald-400 font-semibold">${Calculator.formatRupiah(item.lastPrice)}</span>
          </div>
        `).join('');
        autocompleteDiv.classList.remove('hidden');

        document.querySelectorAll('.auto-suggest-item').forEach(item => {
          item.addEventListener('click', (ev) => {
            const target = ev.currentTarget;
            nameInput.value = target.getAttribute('data-name');
            categoryInput.value = target.getAttribute('data-category');
            unitInput.value = target.getAttribute('data-unit');
            lastPriceInput.value = target.getAttribute('data-lastprice');
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
      const lastPrice = parseFloat(lastPriceInput.value) || 0;
      const qty = parseInt(qtyInput.value) || 1;

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
        label.innerText = `Bayar ${Calculator.formatRupiah(discountResult.finalPrice * qty)} (Hemat ${Calculator.formatRupiah(discountResult.savingsPerUnit * qty)})`;
      }
    };

    priceInput.addEventListener('input', updatePreviews);
    lastPriceInput.addEventListener('input', updatePreviews);
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

    // Prefill data if editing an existing item
    if (itemToEdit) {
      nameInput.value = itemToEdit.name || '';
      categoryInput.value = itemToEdit.category || 'Sembako';
      unitInput.value = itemToEdit.unit || 'pcs';
      qtyInput.value = itemToEdit.qty || 1;
      priceInput.value = itemToEdit.currentPrice || '';
      lastPriceInput.value = itemToEdit.lastPrice || '';
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
    }

    // Form Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
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
        name: nameInput.value.trim(),
        category: categoryInput.value,
        unit: unitInput.value,
        qty: Math.max(1, parseInt(qtyInput.value, 10) || 1),
        currentPrice: Math.max(0, parseFloat(priceInput.value) || 0),
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
   * Modal: Ubah Saldo Anggaran
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
                <p class="text-[11px] text-slate-400">Sesuaikan kapasitas uang bulanan anak rantau</p>
              </div>
            </div>
            <button id="modal-close" class="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 touch-scale">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form id="form-edit-budget" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Batas Saldo Belanja (Rp) *</label>
              <input type="number" id="input-budget-limit" required value="${currentSettings.monthlyLimit}" min="10000" step="5000" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500">
              <p class="text-[10px] text-slate-400 mt-1">Uang yang dialokasikan khusus untuk belanja bulanan.</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Cadangan Tunai Darurat (Rp)</label>
              <input type="number" id="input-emergency" value="${currentSettings.emergencyReserve || 0}" min="0" step="5000" 
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500">
              <p class="text-[10px] text-slate-400 mt-1">Uang darurat yang tidak boleh disentuh di supermarket.</p>
            </div>

            <button type="submit" class="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 touch-scale">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Simpan Pengaturan Saldo</span>
            </button>
          </form>
        </div>
      </div>
    `;

    lucide.createIcons();

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
    const summary = Calculator.calculateCartSummary(cart, budget.monthlyLimit, discount);

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
        <div class="w-full max-w-[430px] bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up">
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
              <strong class="${summary.isOverbudget ? 'text-rose-400' : 'text-emerald-400'}">${Calculator.formatRupiah(summary.remainingBudget)}</strong>
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
      this.vibrate([100, 50, 100]);
      modal.classList.add('hidden');
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
    ['belanja', 'riwayat', 'anggaran', 'akun'].forEach(id => {
      const el = document.getElementById(`tab-content-${id}`);
      if (el) {
        if (id === tabId) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Re-render corresponding tab
    this.render();
  },

  /**
   * Render Top Bar Profile Badge
   */
  renderAppHeader() {
    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    const profileContainer = document.getElementById('header-profile-btn');
    const realtimeBadge = document.getElementById('btn-realtime-status');
    const realtimeText = document.getElementById('realtime-badge-text');

    if (realtimeBadge && window.Realtime) {
      const status = window.Realtime.getStatus();
      if (status.isFirestoreActive) {
        realtimeBadge.className = 'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 touch-scale transition-all';
        if (realtimeText) realtimeText.textContent = 'CLOUD';
      } else {
        realtimeBadge.className = 'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 touch-scale transition-all';
        if (realtimeText) realtimeText.textContent = 'LIVE';
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
      profileContainer.onclick = () => this.switchTab('akun');
      return;
    }

    profileContainer.innerHTML = `
      <div class="flex items-center gap-1.5 cursor-pointer touch-scale p-1 rounded-xl hover:bg-slate-800 transition">
        <div class="text-right">
          <span class="text-xs font-bold text-white block leading-none truncate max-w-[70px] sm:max-w-[100px]">${user.name}</span>
          <span class="text-[9px] text-emerald-400 font-semibold hidden sm:block">${user.role || 'Pengguna'}</span>
        </div>
        <div class="w-7 h-7 rounded-full ${user.avatarBg || 'bg-emerald-600'} text-white font-extrabold flex items-center justify-center text-xs shadow-md border border-white/20 shrink-0">
          ${user.avatarLetter || user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    `;
    profileContainer.onclick = () => this.switchTab('akun');
    if (window.lucide) lucide.createIcons();
  },

  /**
   * Floating Toast Message
   */
  showToast(message, type = 'success') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 transition-all duration-300 pointer-events-none transform -translate-y-4 opacity-0 max-w-[380px] text-center';
      document.body.appendChild(toast);
    }

    const bgClass = type === 'success' ? 'bg-emerald-600 text-white border border-emerald-400/40 shadow-emerald-950/60' : 'bg-rose-600 text-white border border-rose-400/40 shadow-rose-950/60';
    toast.className = `fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 transition-all duration-300 pointer-events-none transform translate-y-0 opacity-100 max-w-[380px] ${bgClass}`;
    toast.innerText = message;

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.className = toast.className.replace('translate-y-0 opacity-100', '-translate-y-4 opacity-0');
    }, 2500);
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
                  <button type="button" class="btn-quick-fill-auth flex-1 py-1.5 px-2 rounded-lg bg-slate-800 text-[11px] text-emerald-400 font-bold border border-slate-700 hover:bg-slate-700 touch-scale" data-email="rian@kost.id">Rian (123)</button>
                  <button type="button" class="btn-quick-fill-auth flex-1 py-1.5 px-2 rounded-lg bg-slate-800 text-[11px] text-indigo-400 font-bold border border-slate-700 hover:bg-slate-700 touch-scale" data-email="aditya@kampus.id">Aditya (123)</button>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email atau Nama Pengguna *</label>
                <input type="text" id="login-identifier" required placeholder="rian@kost.id atau aditya@kampus.id" 
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
        alert(res.message);
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
        this.showToast(`Selamat datang kembali, ${res.user.name}!`);
        modal.classList.add('hidden');
        this.render();
      } else {
        alert(res.message);
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
                <p class="text-[10px] text-slate-400">Sinkronisasi Instan Antar-Layar & Cloud</p>
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

          <!-- Section 2: Cloud Firestore onSnapshot -->
          <div class="mt-4 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="cloud" class="w-4 h-4 ${status.isFirestoreActive ? 'text-sky-400' : 'text-slate-400'}"></i>
                <span class="text-xs font-bold text-white">Google Cloud Firestore</span>
              </div>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${status.isFirestoreActive ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-700 text-slate-300'}">
                ${status.isFirestoreActive ? 'TERHUBUNG' : 'MODE LOKAL'}
              </span>
            </div>
            <p class="text-[11px] text-slate-300 mt-2 leading-relaxed">
              Hubungkan ke Firebase untuk sinkronisasi antar HP dan Laptop di mana saja secara nirkabel dengan listener <code class="text-sky-300 bg-slate-900 px-1 rounded">db.collection().onSnapshot()</code>.
            </p>

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
                  ${status.isFirestoreActive ? 'Perbarui Konfigurasi' : 'Hubungkan Cloud Firestore'}
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
          alert('Mohon isi minimal API Key dan Project ID dari konsol Firebase.');
          return;
        }

        const config = { apiKey, projectId, authDomain, appId, storageBucket };
        if (window.Realtime) {
          const success = window.Realtime.saveFirebaseConfig(config);
          if (success) {
            this.vibrate([50, 100]);
            this.showToast('🔥 Berhasil terhubung ke Cloud Firestore Realtime onSnapshot!');
            closeModal();
            this.render();
          } else {
            alert('Gagal menghubungkan ke Firebase. Mohon periksa API Key dan koneksi internet.');
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
      } catch (e) {}

      return `
        <div class="cursor-pointer rounded-2xl p-3.5 mb-2.5 transition-all duration-200 border ${
          isCurrent 
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
                <span class="text-xs font-bold text-white block">👤 Rian</span>
                <span class="text-[9px] text-emerald-400">Siswa Rantau (500rb)</span>
              </button>
              <button type="button" class="btn-demo-quick-login py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 touch-scale transition" data-user="aditya">
                <span class="text-xs font-bold text-white block">👤 Aditya</span>
                <span class="text-[9px] text-indigo-400">Mahasiswa (750rb)</span>
              </button>
            </div>
          </div>

          <!-- Form: Login -->
          <form id="form-tab-login" class="space-y-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email atau Nama Akun *</label>
              <input type="text" id="tab-login-identifier" required placeholder="Contoh: rian@kost.id atau Rian" 
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
          this.showToast('Masuk sebagai Rian (Anak Rantau)');
          this.render();
        } else if (userType === 'aditya') {
          window.Auth.switchAccount('user_aditya');
          this.vibrate(40);
          this.showToast('Masuk sebagai Aditya (Mahasiswa)');
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
        this.showToast(`Selamat datang kembali, ${res.user.name}!`);
        this.render();
      } else {
        alert(res.message);
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
        alert(res.message);
      }
    });
  },

  /**
   * Full App Render Loop
   */
  render() {
    this.renderAppHeader();

    const budget = Store.getBudgetSettings();
    const cart = Store.getActiveCart();
    const discount = Store.getCartDiscount();
    const summary = Calculator.calculateCartSummary(cart, budget.monthlyLimit, discount);

    this.renderBudgetHeader(summary);

    if (this.activeTab === 'belanja') {
      this.renderBelanjaTab(summary);
    } else if (this.activeTab === 'riwayat') {
      this.renderRiwayatTab();
    } else if (this.activeTab === 'anggaran') {
      this.renderAnggaranTab(summary);
    } else if (this.activeTab === 'akun') {
      this.renderAkunTab(summary);
    }
  }
};

window.UI = UI;
