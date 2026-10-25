/**
 * Price Comparator Module for Smart Grocery Tracker [F-04]
 * Compares current unit price against historical/last month's price in real-time.
 */

const Comparator = {
  /**
   * Compare current unit price with last month's unit price
   * @param {number} currentPrice 
   * @param {number} lastPrice 
   * @returns {object} Comparison details with badge styling and text
   */
  compare(currentPrice, lastPrice) {
    const curr = Calculator.parseNumber(currentPrice);
    const prev = Calculator.parseNumber(lastPrice);

    if (curr <= 0) {
      return {
        type: 'empty',
        label: prev > 0 ? `Bulan Lalu: ${Calculator.formatRupiah(prev)}` : 'Ketik Harga',
        arrow: '•',
        icon: 'info',
        diffAmount: 0,
        diffPercent: 0,
        badgeClass: 'badge-diff-equal',
        textClass: 'text-slate-400',
        bgClass: 'bg-slate-500/10 border-slate-500/30',
        summary: prev > 0 ? `Patokan harga bulan lalu: ${Calculator.formatRupiah(prev)}` : 'Ketik harga untuk melihat perbandingan'
      };
    }

    if (prev <= 0) {
      return {
        type: 'new',
        label: 'Item Baru',
        arrow: '★',
        icon: 'sparkles',
        diffAmount: 0,
        diffPercent: 0,
        badgeClass: 'badge-diff-new',
        textClass: 'text-blue-400',
        bgClass: 'bg-blue-500/10 border-blue-500/30',
        summary: 'Belum ada riwayat harga bulan lalu'
      };
    }

    const diff = curr - prev;
    const diffPercent = Math.round((Math.abs(diff) / prev) * 100);

    if (diff > 0) {
      // Lebih Mahal (Merah)
      return {
        type: 'higher',
        label: `Naik ${Calculator.formatRupiah(diff)} (+${diffPercent}%)`,
        arrow: '↑',
        icon: 'trending-up',
        diffAmount: diff,
        diffPercent: diffPercent,
        badgeClass: 'badge-diff-higher',
        textClass: 'text-rose-400 font-semibold',
        bgClass: 'bg-rose-500/10 border-rose-500/30',
        summary: `Harga lebih mahal ${Calculator.formatRupiah(diff)} dibanding bulan lalu (${Calculator.formatRupiah(prev)})`
      };
    } else if (diff < 0) {
      // Lebih Murah (Hijau)
      const absDiff = Math.abs(diff);
      return {
        type: 'lower',
        label: `Turun ${Calculator.formatRupiah(absDiff)} (-${diffPercent}%)`,
        arrow: '↓',
        icon: 'trending-down',
        diffAmount: -absDiff,
        diffPercent: diffPercent,
        badgeClass: 'badge-diff-lower',
        textClass: 'text-emerald-400 font-semibold',
        bgClass: 'bg-emerald-500/10 border-emerald-500/30',
        summary: `Lebih hemat ${Calculator.formatRupiah(absDiff)} dibanding bulan lalu (${Calculator.formatRupiah(prev)})`
      };
    } else {
      // Sama persis / Stabil (Abu-abu)
      return {
        type: 'equal',
        label: 'Harga Stabil (=)',
        arrow: '=',
        icon: 'minus',
        diffAmount: 0,
        diffPercent: 0,
        badgeClass: 'badge-diff-equal',
        textClass: 'text-slate-400',
        bgClass: 'bg-slate-500/10 border-slate-500/30',
        summary: `Harga sama persis dengan bulan lalu (${Calculator.formatRupiah(prev)})`
      };
    }
  },

  /**
   * Helper to generate a compact HTML badge string
   */
  renderBadgeHtml(comparison) {
    if (!comparison) return '';
    return `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${comparison.badgeClass}">
        <span>${comparison.arrow}</span>
        <span>${comparison.label}</span>
      </span>
    `;
  }
};

window.Comparator = Comparator;
