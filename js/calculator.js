/**
 * Calculator module for Smart Grocery & Budget Safety Tracker
 * Handles real-time multi-tier sequential discounts, subtotal calculations,
 * savings breakdown, and budget safety cap analysis.
 */

const Calculator = {
  /**
   * Format numeric value to Indonesian Rupiah currency format
   * @param {number} value 
   * @returns {string} e.g. "Rp 72.000"
   */
  formatRupiah(value) {
    if (isNaN(value) || value === null || value === undefined) return "Rp 0";
    const rounded = Math.round(value);
    const formatted = new Intl.NumberFormat("id-ID").format(Math.abs(rounded));
    return (rounded < 0 ? "-Rp " : "Rp ") + formatted;
  },

  /**
   * Parse numeric string or number into valid float/int
   */
  parseNumber(val) {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val) return 0;
    // Strip non-digit except comma or dot
    const cleanStr = String(val).replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  },

  /**
   * [F-03] Multi-Tier Discount Calculator
   * Sequential tier discount formula:
   *   Step 1: P1 = Base - (Base * A%)
   *   Step 2: P2 = P1 - (P1 * B%)
   *   Hemat = Base - P2
   * @param {number} basePrice Unit price before discount
   * @param {string} discountType 'none' | 'single' | 'tiered' | 'nominal'
   * @param {number} discountA First tier percentage (0 - 100)
   * @param {number} discountB Second tier percentage (0 - 100)
   * @param {number} discountNominal Direct nominal discount (Rp)
   */
  calculateItemDiscount(basePrice, discountType = "none", discountA = 0, discountB = 0, discountNominal = 0) {
    const original = this.parseNumber(basePrice);
    if (original <= 0) {
      return {
        originalPrice: 0,
        finalPrice: 0,
        savingsPerUnit: 0,
        effectivePercent: 0,
        formulaDescription: "Rp 0"
      };
    }

    let finalPrice = original;
    let formulaDescription = "Harga Normal";

    if (discountType === "single" && discountA > 0) {
      const a = Math.min(Math.max(this.parseNumber(discountA), 0), 100);
      const disc1 = original * (a / 100);
      finalPrice = Math.max(0, original - disc1);
      formulaDescription = `Diskon ${a}%`;
    } else if (discountType === "tiered" && (discountA > 0 || discountB > 0)) {
      const a = Math.min(Math.max(this.parseNumber(discountA), 0), 100);
      const b = Math.min(Math.max(this.parseNumber(discountB), 0), 100);

      // WAJIB: Dihitung secara sekuensial, BUKAN dijumlahkan langsung!
      const afterTier1 = original - (original * (a / 100));
      const afterTier2 = afterTier1 - (afterTier1 * (b / 100));

      finalPrice = Math.max(0, afterTier2);
      formulaDescription = `Diskon Bertingkat ${a}% + ${b}%`;
    } else if (discountType === "nominal" && discountNominal > 0) {
      const nom = this.parseNumber(discountNominal);
      finalPrice = Math.max(0, original - nom);
      formulaDescription = `Potongan ${this.formatRupiah(nom)}`;
    }

    const savingsPerUnit = Math.max(0, original - finalPrice);
    const effectivePercent = original > 0 ? (savingsPerUnit / original) * 100 : 0;

    return {
      originalPrice: original,
      finalPrice: Math.round(finalPrice),
      savingsPerUnit: Math.round(savingsPerUnit),
      effectivePercent: Math.round(effectivePercent * 10) / 10,
      formulaDescription
    };
  },

  /**
   * [F-02] Perhitungan Kuantitas Otomatis & Subtotal Baris Item
   * Subharga dihitung secara real-time berdasarkan kuantitas & diskon
   */
  calculateItemRow(item) {
    const qty = Math.max(1, this.parseNumber(item.qty || 1));
    const currentPrice = this.parseNumber(item.currentPrice || 0);
    const lastPrice = this.parseNumber(item.lastPrice || 0);

    const discountInfo = this.calculateItemDiscount(
      currentPrice,
      item.discountType,
      item.discountA,
      item.discountB,
      item.discountNominal
    );

    const subtotalOriginal = discountInfo.originalPrice * qty;
    const subtotalFinal = discountInfo.finalPrice * qty;
    const subtotalSavings = discountInfo.savingsPerUnit * qty;

    return {
      ...item,
      qty,
      currentPrice,
      lastPrice,
      discountInfo,
      subtotalOriginal,
      subtotalFinal,
      subtotalSavings
    };
  },

  /**
   * [F-05] Kalkulator Keranjang Keseluruhan & Budget Safety Cap
   * @param {Array} items List of cart items
   * @param {number} budgetLimit Batas saldo dompet
   * @param {object} cartDiscount Voucher / diskon keranjang
   */
  calculateCartSummary(items = [], budgetLimit = 500000, cartDiscount = { type: 'none', value: 0 }) {
    const parsedBudget = Math.max(0, this.parseNumber(budgetLimit));
    let totalItemsCount = 0;
    let totalOriginal = 0;
    let totalItemsFinal = 0;
    let totalItemSavings = 0;

    const processedItems = items.map((item) => {
      const row = this.calculateItemRow(item);
      totalItemsCount += row.qty;
      totalOriginal += row.subtotalOriginal;
      totalItemsFinal += row.subtotalFinal;
      totalItemSavings += row.subtotalSavings;
      return row;
    });

    // Cart level voucher/discount
    let cartSavings = 0;
    if (cartDiscount.type === "percentage" && cartDiscount.value > 0) {
      cartSavings = totalItemsFinal * (this.parseNumber(cartDiscount.value) / 100);
    } else if (cartDiscount.type === "nominal" && cartDiscount.value > 0) {
      cartSavings = this.parseNumber(cartDiscount.value);
    }
    cartSavings = Math.min(totalItemsFinal, Math.max(0, cartSavings));

    const grandTotal = Math.max(0, totalItemsFinal - cartSavings);
    const allSavings = totalItemSavings + cartSavings;
    const remainingBudget = parsedBudget - grandTotal;
    const budgetUsagePercent = parsedBudget > 0 ? (grandTotal / parsedBudget) * 100 : (grandTotal > 0 ? 100 : 0);

    // Safety Cap Status
    // < 80%: Safe (Hijau/Biru)
    // 80% - 95%: Warning (Kuning)
    // > 95%: Danger / Overbudget (Merah)
    let safetyStatus = "safe";
    let statusLabel = "Aman: Belanjaan Terkendali";
    let statusColor = "emerald";

    if (budgetUsagePercent > 95 || remainingBudget < 0) {
      safetyStatus = "danger";
      statusLabel = remainingBudget < 0 ? "BAHAYA: Saldo Minus!" : "WASPADA TINGGI: Hampir Habis!";
      statusColor = "rose";
    } else if (budgetUsagePercent >= 80) {
      safetyStatus = "warning";
      statusLabel = "PERHATIAN: Mendekati Batas Saldo!";
      statusColor = "amber";
    }

    return {
      items: processedItems,
      totalItemsCount,
      totalOriginal,
      grandTotal,
      allSavings,
      budgetLimit: parsedBudget,
      remainingBudget,
      budgetUsagePercent: Math.min(100, Math.round(budgetUsagePercent)),
      actualPercent: budgetUsagePercent,
      safetyStatus,
      statusLabel,
      statusColor,
      isOverbudget: remainingBudget < 0
    };
  }
};

window.Calculator = Calculator;
