/**
 * Seed data for "Smart Grocery & Budget Safety Tracker"
 * Tailored for a student ("Rian", anak rantau) monthly grocery shopping.
 */

const SEED_DATA = {
  // Budget settings
  budgetSettings: {
    monthlyLimit: 500000,       // Rp 500.000
    emergencyReserve: 50000,    // Rp 50.000 cadangan darurat
    userName: "Rian (Anak Rantau)"
  },

  // Historical Product Catalog (Harga Bulan Lalu)
  catalog: [
    {
      id: "prod_1",
      name: "Beras Ramos 5kg",
      category: "Sembako",
      unit: "pack",
      lastPrice: 68000,
      updatedAt: "2026-09-25"
    },
    {
      id: "prod_2",
      name: "Minyak Goreng 2L",
      category: "Sembako",
      unit: "liter",
      lastPrice: 34000,
      updatedAt: "2026-09-25"
    },
    {
      id: "prod_3",
      name: "Telur Ayam 1kg",
      category: "Sembako",
      unit: "kg",
      lastPrice: 28000,
      updatedAt: "2026-09-25"
    },
    {
      id: "prod_4",
      name: "Indomie Goreng (5 pcs)",
      category: "Makanan Instan",
      unit: "pack",
      lastPrice: 15000,
      updatedAt: "2026-09-25"
    },
    {
      id: "prod_5",
      name: "Sarden Kaleng 155g",
      category: "Makanan Instan",
      unit: "kaleng",
      lastPrice: 11000,
      updatedAt: "2026-09-25"
    },
    {
      id: "prod_6",
      name: "Sabun Mandi Cair Refill 450ml",
      category: "Toiletries",
      unit: "pack",
      lastPrice: 24000,
      updatedAt: "2026-09-25"
    },
    {
      id: "prod_7",
      name: "Pasta Gigi Herbal 190g",
      category: "Toiletries",
      unit: "pcs",
      lastPrice: 17000,
      updatedAt: "2026-09-25"
    },
    {
      id: "prod_8",
      name: "Deterjen Konsentrat 800g",
      category: "Toiletries",
      unit: "pack",
      lastPrice: 19500,
      updatedAt: "2026-09-25"
    },
    {
      id: "prod_9",
      name: "Kecap Manis Refill 550ml",
      category: "Dapur & Bumbu",
      unit: "pack",
      lastPrice: 18000,
      updatedAt: "2026-09-25"
    },
    {
      id: "prod_10",
      name: "Air Galon Isi Ulang",
      category: "Minuman",
      unit: "galon",
      lastPrice: 20000,
      updatedAt: "2026-09-25"
    }
  ],

  // Preloaded active cart items representing a live supermarket shopping trip
  activeCart: [
    {
      id: "item_cart_1",
      name: "Beras Ramos 5kg",
      category: "Sembako",
      unit: "pack",
      qty: 1,
      currentPrice: 72000,       // Naik Rp 4.000 vs last month (Rp 68.000)
      lastPrice: 68000,
      discountType: "none",      // none, single, tiered, nominal
      discountA: 0,
      discountB: 0,
      discountNominal: 0
    },
    {
      id: "item_cart_2",
      name: "Minyak Goreng 2L",
      category: "Sembako",
      unit: "liter",
      qty: 1,
      currentPrice: 32500,       // Turun Rp 1.500 vs last month (Rp 34.000)
      lastPrice: 34000,
      discountType: "none",
      discountA: 0,
      discountB: 0,
      discountNominal: 0
    },
    {
      id: "item_cart_3",
      name: "Indomie Goreng (5 pcs)",
      category: "Makanan Instan",
      unit: "pack",
      qty: 2,
      currentPrice: 15000,       // Sama dengan bulan lalu (Rp 15.000)
      lastPrice: 15000,
      discountType: "single",    // Promo single 10%
      discountA: 10,
      discountB: 0,
      discountNominal: 0
    },
    {
      id: "item_cart_4",
      name: "Sabun Mandi Cair Refill 450ml",
      category: "Toiletries",
      unit: "pack",
      qty: 1,
      currentPrice: 24000,       // Sama dengan bulan lalu
      lastPrice: 24000,
      discountType: "tiered",    // Promo Supermarket bertingkat: 50% + 20%
      discountA: 50,
      discountB: 20,
      discountNominal: 0
    }
  ],

  // Shopping history for trend graph & past audits
  history: [
    {
      id: "hist_1",
      date: "2026-08-27",
      monthName: "Agustus 2026",
      totalAmount: 435000,
      totalSavings: 42000,
      itemCount: 9,
      status: "Selesai (Di Bawah Anggaran)",
      items: [
        { name: "Beras Ramos 5kg", qty: 1, unit: "pack", price: 67000 },
        { name: "Minyak Goreng 2L", qty: 1, unit: "liter", price: 35000 },
        { name: "Telur Ayam 1kg", qty: 2, unit: "kg", price: 27500 },
        { name: "Deterjen Konsentrat 800g", qty: 1, unit: "pack", price: 19000 },
        { name: "Indomie Goreng (5 pcs)", qty: 3, unit: "pack", price: 14500 },
        { name: "Sabun Mandi Cair 450ml", qty: 1, unit: "pack", price: 22000 },
        { name: "Kecap Manis 550ml", qty: 1, unit: "pack", price: 17500 },
        { name: "Sarden Kaleng 155g", qty: 2, unit: "kaleng", price: 11000 }
      ]
    },
    {
      id: "hist_2",
      date: "2026-09-25",
      monthName: "September 2026",
      totalAmount: 468000,
      totalSavings: 38500,
      itemCount: 10,
      status: "Selesai (Di Bawah Anggaran)",
      items: [
        { name: "Beras Ramos 5kg", qty: 1, unit: "pack", price: 68000 },
        { name: "Minyak Goreng 2L", qty: 1, unit: "liter", price: 34000 },
        { name: "Telur Ayam 1kg", qty: 2, unit: "kg", price: 28000 },
        { name: "Indomie Goreng (5 pcs)", qty: 2, unit: "pack", price: 15000 },
        { name: "Sabun Mandi Cair Refill 450ml", qty: 1, unit: "pack", price: 24000 },
        { name: "Pasta Gigi Herbal 190g", qty: 1, unit: "pcs", price: 17000 },
        { name: "Deterjen Konsentrat 800g", qty: 1, unit: "pack", price: 19500 },
        { name: "Air Galon", qty: 2, unit: "galon", price: 20000 }
      ]
    }
  ]
};

// Make accessible to other scripts
window.SEED_DATA = SEED_DATA;
