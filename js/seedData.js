/**
 * Seed data for "Smart Grocery & Budget Safety Tracker"
 * Multi-account initial data demonstrating total data isolation between accounts.
 */

const SEED_DATA = {
  // Demo Users
  users: [
    {
      id: "user_rian",
      name: "Rian",
      fullName: "Rian (Anak Rantau)",
      email: "rian@kost.id",
      password: "123",
      role: "Siswa Rantau",
      avatarBg: "bg-emerald-600",
      avatarLetter: "R"
    },
    {
      id: "user_aditya",
      name: "Aditya",
      fullName: "Aditya (Mahasiswa Teknik)",
      email: "aditya@kampus.id",
      password: "123",
      role: "Mahasiswa Tingkat Akhir",
      avatarBg: "bg-indigo-600",
      avatarLetter: "A"
    }
  ],

  // Data for User 1: Rian (Budget Rp 500.000, sembako & toiletries)
  userData_user_rian: {
    budgetSettings: {
      monthlyLimit: 500000,
      emergencyReserve: 50000,
      userName: "Rian (Anak Rantau)"
    },
    cartDiscount: { type: 'none', value: 0 },
    catalog: [
      { id: "prod_r1", name: "Beras Ramos 5kg", category: "Sembako", unit: "pack", lastPrice: 68000, updatedAt: "2026-09-25" },
      { id: "prod_r2", name: "Minyak Goreng 2L", category: "Sembako", unit: "liter", lastPrice: 34000, updatedAt: "2026-09-25" },
      { id: "prod_r3", name: "Telur Ayam 1kg", category: "Sembako", unit: "kg", lastPrice: 28000, updatedAt: "2026-09-25" },
      { id: "prod_r4", name: "Indomie Goreng (5 pcs)", category: "Makanan Instan", unit: "pack", lastPrice: 15000, updatedAt: "2026-09-25" },
      { id: "prod_r5", name: "Sarden Kaleng 155g", category: "Makanan Instan", unit: "kaleng", lastPrice: 11000, updatedAt: "2026-09-25" },
      { id: "prod_r6", name: "Sabun Mandi Cair Refill 450ml", category: "Toiletries", unit: "pack", lastPrice: 24000, updatedAt: "2026-09-25" },
      { id: "prod_r7", name: "Pasta Gigi Herbal 190g", category: "Toiletries", unit: "pcs", lastPrice: 17000, updatedAt: "2026-09-25" },
      { id: "prod_r8", name: "Deterjen Konsentrat 800g", category: "Toiletries", unit: "pack", lastPrice: 19500, updatedAt: "2026-09-25" },
      { id: "prod_r9", name: "Kecap Manis Refill 550ml", category: "Dapur & Bumbu", unit: "pack", lastPrice: 18000, updatedAt: "2026-09-25" },
      { id: "prod_r10", name: "Air Galon Isi Ulang", category: "Minuman", unit: "galon", lastPrice: 20000, updatedAt: "2026-09-25" }
    ],
    activeCart: [
      {
        id: "item_r1",
        name: "Beras Ramos 5kg",
        category: "Sembako",
        unit: "pack",
        qty: 1,
        currentPrice: 72000,
        lastPrice: 68000,
        discountType: "none",
        discountA: 0,
        discountB: 0,
        discountNominal: 0
      },
      {
        id: "item_r2",
        name: "Minyak Goreng 2L",
        category: "Sembako",
        unit: "liter",
        qty: 1,
        currentPrice: 32500,
        lastPrice: 34000,
        discountType: "none",
        discountA: 0,
        discountB: 0,
        discountNominal: 0
      },
      {
        id: "item_r3",
        name: "Indomie Goreng (5 pcs)",
        category: "Makanan Instan",
        unit: "pack",
        qty: 2,
        currentPrice: 15000,
        lastPrice: 15000,
        discountType: "single",
        discountA: 10,
        discountB: 0,
        discountNominal: 0
      },
      {
        id: "item_r4",
        name: "Sabun Mandi Cair Refill 450ml",
        category: "Toiletries",
        unit: "pack",
        qty: 1,
        currentPrice: 24000,
        lastPrice: 24000,
        discountType: "tiered",
        discountA: 50,
        discountB: 20,
        discountNominal: 0
      }
    ],
    history: [
      {
        id: "hist_r1",
        date: "2026-08-27",
        monthName: "Agustus 2026",
        totalAmount: 435000,
        totalSavings: 42000,
        itemCount: 9,
        status: "Selesai (Di Bawah Anggaran)",
        items: [
          { name: "Beras Ramos 5kg", qty: 1, unit: "pack", price: 67000, subtotal: 67000 },
          { name: "Minyak Goreng 2L", qty: 1, unit: "liter", price: 35000, subtotal: 35000 },
          { name: "Telur Ayam 1kg", qty: 2, unit: "kg", price: 27500, subtotal: 55000 }
        ]
      },
      {
        id: "hist_r2",
        date: "2026-09-25",
        monthName: "September 2026",
        totalAmount: 468000,
        totalSavings: 38500,
        itemCount: 10,
        status: "Selesai (Di Bawah Anggaran)",
        items: [
          { name: "Beras Ramos 5kg", qty: 1, unit: "pack", price: 68000, subtotal: 68000 },
          { name: "Minyak Goreng 2L", qty: 1, unit: "liter", price: 34000, subtotal: 34000 }
        ]
      }
    ]
  },

  // Data for User 2: Aditya (Budget Rp 750.000, Mahasiswa Teknik, belanjaan berbeda)
  userData_user_aditya: {
    budgetSettings: {
      monthlyLimit: 750000,
      emergencyReserve: 100000,
      userName: "Aditya (Mahasiswa Teknik)"
    },
    cartDiscount: { type: 'none', value: 0 },
    catalog: [
      { id: "prod_a1", name: "Susu UHT Full Cream 1L", category: "Minuman", unit: "liter", lastPrice: 18000, updatedAt: "2026-09-20" },
      { id: "prod_a2", name: "Roti Tawar Gandum", category: "Snack", unit: "pack", lastPrice: 16000, updatedAt: "2026-09-20" },
      { id: "prod_a3", name: "Kopi Bubuk Robusta 200g", category: "Minuman", unit: "pack", lastPrice: 42000, updatedAt: "2026-09-20" },
      { id: "prod_a4", name: "Nugget Ayam Crispy 500g", category: "Makanan Instan", unit: "pack", lastPrice: 45000, updatedAt: "2026-09-20" },
      { id: "prod_a5", name: "Oatmeal Instan 800g", category: "Sembako", unit: "pack", lastPrice: 38000, updatedAt: "2026-09-20" },
      { id: "prod_a6", name: "Apel Fuji 1kg", category: "Sayur & Buah", unit: "kg", lastPrice: 40000, updatedAt: "2026-09-20" },
      { id: "prod_a7", name: "Shampoo Anti Ketombe 340ml", category: "Toiletries", unit: "botol", lastPrice: 35000, updatedAt: "2026-09-20" }
    ],
    activeCart: [
      {
        id: "item_a1",
        name: "Susu UHT Full Cream 1L",
        category: "Minuman",
        unit: "liter",
        qty: 2,
        currentPrice: 19500,      // Naik Rp 1.500 vs Rp 18.000
        lastPrice: 18000,
        discountType: "none",
        discountA: 0,
        discountB: 0,
        discountNominal: 0
      },
      {
        id: "item_a2",
        name: "Roti Tawar Gandum",
        category: "Snack",
        unit: "pack",
        qty: 1,
        currentPrice: 16000,      // Stabil
        lastPrice: 16000,
        discountType: "none",
        discountA: 0,
        discountB: 0,
        discountNominal: 0
      },
      {
        id: "item_a3",
        name: "Kopi Bubuk Robusta 200g",
        category: "Minuman",
        unit: "pack",
        qty: 1,
        currentPrice: 38000,      // Turun Rp 4.000 vs Rp 42.000
        lastPrice: 42000,
        discountType: "none",
        discountA: 0,
        discountB: 0,
        discountNominal: 0
      },
      {
        id: "item_a4",
        name: "Nugget Ayam Crispy 500g",
        category: "Makanan Instan",
        unit: "pack",
        qty: 1,
        currentPrice: 45000,
        lastPrice: 45000,
        discountType: "tiered",   // Diskon 30% + 10%
        discountA: 30,
        discountB: 10,
        discountNominal: 0
      }
    ],
    history: [
      {
        id: "hist_a1",
        date: "2026-09-20",
        monthName: "September 2026",
        totalAmount: 620000,
        totalSavings: 55000,
        itemCount: 8,
        status: "Selesai (Di Bawah Anggaran)",
        items: [
          { name: "Susu UHT Full Cream 1L", qty: 4, unit: "liter", price: 18000, subtotal: 72000 },
          { name: "Oatmeal Instan 800g", qty: 2, unit: "pack", price: 38000, subtotal: 76000 },
          { name: "Kopi Bubuk Robusta 200g", qty: 2, unit: "pack", price: 42000, subtotal: 84000 }
        ]
      }
    ]
  }
};

window.SEED_DATA = SEED_DATA;
