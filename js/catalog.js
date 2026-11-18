/**
 * Official Product Catalog & Benchmark Price Master
 * Lotte Mart Grocery - Puri Indah
 * Smart Grocery & Budget Safety Tracker
 */

const LOTTE_MART_PURI_INDAH_CATALOG = [
  // 1. Bahan Pokok / Sembako
  {
    id: "lotte_beras_rojolele",
    name: "Beras Rojolele",
    aliases: ["beras", "rojolele", "beras 5kg", "beras rojolele 5kg"],
    category: "Bahan Pokok",
    unit: "karung/5kg",
    lastPrice: 68000,
    currentPrice: 74000,
    note: "Harga resmi Lotte Mart Puri Indah (Naik +Rp 6.000)",
    isBenchmark: true
  },
  {
    id: "lotte_beras_5kg",
    name: "Beras 5kg",
    aliases: ["beras 5kg", "beras"],
    category: "Bahan Pokok",
    unit: "pack",
    lastPrice: 68000,
    currentPrice: 74000,
    note: "Harga resmi Lotte Mart Puri Indah (Naik +Rp 6.000)",
    isBenchmark: true
  },
  {
    id: "lotte_beras_ramos",
    name: "Beras Ramos 5kg",
    aliases: ["ramos", "beras ramos"],
    category: "Bahan Pokok",
    unit: "pack",
    lastPrice: 68000,
    currentPrice: 72000,
    note: "Harga resmi Lotte Mart Puri Indah",
    isBenchmark: true
  },
  {
    id: "lotte_minyak_2l",
    name: "Minyak Goreng 2L",
    aliases: ["minyak", "minyak goreng", "bimoli", "filma", "sania"],
    category: "Bahan Pokok",
    unit: "liter",
    lastPrice: 43000,
    currentPrice: 43000,
    note: "Harga resmi Lotte Mart Puri Indah",
    isBenchmark: true
  },
  {
    id: "lotte_telur_1kg",
    name: "Telur 1kg",
    aliases: ["telur", "telur ayam", "telur 1kg", "telor"],
    category: "Bahan Pokok",
    unit: "kg",
    lastPrice: 32000,
    currentPrice: 28000,
    note: "Harga resmi Lotte Mart Puri Indah (Turun -Rp 4.000)",
    isBenchmark: true
  },
  {
    id: "lotte_telur_ayam",
    name: "Telur Ayam 1kg",
    aliases: ["telur ayam", "telur ayam negeri"],
    category: "Bahan Pokok",
    unit: "kg",
    lastPrice: 32000,
    currentPrice: 28000,
    note: "Harga resmi Lotte Mart Puri Indah (Turun -Rp 4.000)",
    isBenchmark: true
  },
  {
    id: "lotte_garam_500g",
    name: "Garam 500g",
    aliases: ["garam", "garam dapur", "garam beryodium"],
    category: "Dapur & Bumbu",
    unit: "pack",
    lastPrice: 5000,
    currentPrice: 5000,
    note: "Harga resmi Lotte Mart Puri Indah (Stabil Rp 5.000)",
    isBenchmark: true
  },
  {
    id: "lotte_sabun_cuci",
    name: "Sabun Cuci",
    aliases: ["sabun cuci", "sabun piring", "sabun"],
    category: "Toiletries",
    unit: "pcs",
    lastPrice: 20000,
    currentPrice: 20000,
    note: "Harga resmi Lotte Mart Puri Indah (Promo 25% jd Rp 15.000)",
    isBenchmark: true
  },
  {
    id: "lotte_wajan",
    name: "Wajan",
    aliases: ["wajan", "wajan teflon", "wajan penggorengan", "kuali"],
    category: "Lainnya",
    unit: "pcs",
    lastPrice: 100000,
    currentPrice: 100000,
    note: "Harga resmi Lotte Mart Puri Indah (Promo 50%+20% jd Rp 40.000)",
    isBenchmark: true
  },
  {
    id: "lotte_indomie_goreng",
    name: "Indomie Goreng (5 pcs)",
    aliases: ["indomie", "indomie goreng", "mie instan"],
    category: "Makanan Instan",
    unit: "pack",
    lastPrice: 15000,
    currentPrice: 15000,
    note: "Harga resmi Lotte Mart Puri Indah",
    isBenchmark: true
  },
  {
    id: "lotte_indomie_kuah",
    name: "Indomie Kuah Ayam Bawang (5 pcs)",
    aliases: ["indomie kuah", "ayam bawang", "indomie rebus"],
    category: "Makanan Instan",
    unit: "pack",
    lastPrice: 14500,
    currentPrice: 14500,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_sarden",
    name: "Sarden Kaleng 155g",
    aliases: ["sarden", "ikan sarden", "abc sarden"],
    category: "Makanan Instan",
    unit: "kaleng",
    lastPrice: 11000,
    currentPrice: 11500,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_sabun_mandi",
    name: "Sabun Mandi Cair Refill 450ml",
    aliases: ["sabun mandi", "biore", "lifebuoy", "lux"],
    category: "Toiletries",
    unit: "pack",
    lastPrice: 24000,
    currentPrice: 24000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_pasta_gigi",
    name: "Pasta Gigi Herbal 190g",
    aliases: ["pasta gigi", "odol", "pepsodent", "sensodyne"],
    category: "Toiletries",
    unit: "pcs",
    lastPrice: 17000,
    currentPrice: 18000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_deterjen",
    name: "Deterjen Konsentrat 800g",
    aliases: ["deterjen", "rinso", "attack", "so klin"],
    category: "Toiletries",
    unit: "pack",
    lastPrice: 19500,
    currentPrice: 21000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_kecap",
    name: "Kecap Manis Refill 550ml",
    aliases: ["kecap", "kecap bango", "kecap manis"],
    category: "Dapur & Bumbu",
    unit: "pack",
    lastPrice: 18000,
    currentPrice: 19500,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_galon",
    name: "Air Galon Isi Ulang",
    aliases: ["galon", "air mineral", "aqua galon"],
    category: "Minuman",
    unit: "galon",
    lastPrice: 20000,
    currentPrice: 20000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_gula_1kg",
    name: "Gula Pasir Premium 1kg",
    aliases: ["gula", "gula pasir", "gulaku"],
    category: "Bahan Pokok",
    unit: "kg",
    lastPrice: 17500,
    currentPrice: 18000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_tepung_terigu",
    name: "Tepung Terigu Segitiga Biru 1kg",
    aliases: ["tepung", "terigu", "segitiga biru"],
    category: "Bahan Pokok",
    unit: "kg",
    lastPrice: 13000,
    currentPrice: 13500,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_daging_sapi",
    name: "Daging Sapi Segar 1kg",
    aliases: ["daging", "daging sapi", "rendang"],
    category: "Bahan Pokok",
    unit: "kg",
    lastPrice: 135000,
    currentPrice: 140000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_ayam_broiler",
    name: "Ayam Broiler Utuh 1 ekor",
    aliases: ["ayam", "ayam broiler", "ayam utuh"],
    category: "Bahan Pokok",
    unit: "pcs",
    lastPrice: 38000,
    currentPrice: 35000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_susu_uht",
    name: "Susu UHT Full Cream 1L",
    aliases: ["susu", "susu uht", "ultra milk"],
    category: "Minuman",
    unit: "pack",
    lastPrice: 19000,
    currentPrice: 19500,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_roti_tawar",
    name: "Roti Tawar Gandum",
    aliases: ["roti", "roti tawar", "sari roti"],
    category: "Makanan Instan",
    unit: "pack",
    lastPrice: 16500,
    currentPrice: 17000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_bawang_merah",
    name: "Bawang Merah 500g",
    aliases: ["bawang merah", "brambang"],
    category: "Dapur & Bumbu",
    unit: "gr",
    lastPrice: 22000,
    currentPrice: 25000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_bawang_putih",
    name: "Bawang Putih 500g",
    aliases: ["bawang putih"],
    category: "Dapur & Bumbu",
    unit: "gr",
    lastPrice: 20000,
    currentPrice: 21000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_cabai_merah",
    name: "Cabai Merah Keriting 250g",
    aliases: ["cabai", "cabe", "cabai merah"],
    category: "Dapur & Bumbu",
    unit: "gr",
    lastPrice: 18000,
    currentPrice: 16000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_shampoo",
    name: "Shampoo Botol 170ml",
    aliases: ["shampoo", "sampo", "pantene", "clear"],
    category: "Toiletries",
    unit: "botol",
    lastPrice: 26000,
    currentPrice: 25000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_tisu",
    name: "Tisu Wajah 250 sheets",
    aliases: ["tisu", "tissue", "paseo"],
    category: "Toiletries",
    unit: "pack",
    lastPrice: 13500,
    currentPrice: 13500,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_pembersih_lantai",
    name: "Pembersih Lantai 750ml",
    aliases: ["pembersih lantai", "so klin lantai", "wipol"],
    category: "Toiletries",
    unit: "pack",
    lastPrice: 11500,
    currentPrice: 12000,
    note: "Harga resmi Lotte Mart Puri Indah"
  },
  {
    id: "lotte_cuci_piring",
    name: "Pencuci Piring Jeruk Nipis 750ml",
    aliases: ["cuci piring", "sunlight", "mama lemon"],
    category: "Toiletries",
    unit: "pack",
    lastPrice: 13000,
    currentPrice: 13500,
    note: "Harga resmi Lotte Mart Puri Indah"
  }
];

const OfficialCatalog = {
  storeName: "Lotte Mart Grocery - Puri Indah",
  
  /**
   * Get all official items
   */
  getAll() {
    return LOTTE_MART_PURI_INDAH_CATALOG;
  },

  /**
   * Get benchmark items for fast select chips
   */
  getBenchmarks() {
    return LOTTE_MART_PURI_INDAH_CATALOG.filter(i => i.isBenchmark);
  },

  /**
   * Smart lookup by name, alias, or keyword
   */
  findItem(query) {
    if (!query) return null;
    const q = query.trim().toLowerCase();
    
    // 1. Exact match by name
    const exact = LOTTE_MART_PURI_INDAH_CATALOG.find(i => i.name.toLowerCase() === q);
    if (exact) return exact;

    // 2. Exact match by alias
    const aliasExact = LOTTE_MART_PURI_INDAH_CATALOG.find(i => 
      i.aliases && i.aliases.some(a => a.toLowerCase() === q)
    );
    if (aliasExact) return aliasExact;

    // 3. Name starts with query (e.g. "Beras" -> "Beras Rojolele")
    const starts = LOTTE_MART_PURI_INDAH_CATALOG.find(i => i.name.toLowerCase().startsWith(q));
    if (starts) return starts;

    // 4. Substring contains
    const contains = LOTTE_MART_PURI_INDAH_CATALOG.find(i => 
      i.name.toLowerCase().includes(q) || 
      (i.aliases && i.aliases.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase())))
    );
    if (contains) return contains;

    return null;
  },

  /**
   * Search matching items for autocomplete dropdown
   */
  search(query, limit = 6) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return LOTTE_MART_PURI_INDAH_CATALOG.filter(i => 
      i.name.toLowerCase().includes(q) || 
      (i.aliases && i.aliases.some(a => a.toLowerCase().includes(q))) ||
      i.category.toLowerCase().includes(q)
    ).slice(0, limit);
  }
};

// Expose globally
if (typeof window !== 'undefined') {
  window.LOTTE_MART_PURI_INDAH_CATALOG = LOTTE_MART_PURI_INDAH_CATALOG;
  window.OfficialCatalog = OfficialCatalog;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LOTTE_MART_PURI_INDAH_CATALOG, OfficialCatalog };
}
