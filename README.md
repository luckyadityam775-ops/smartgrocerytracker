# Smart Grocery & Budget Safety Tracker (PWA)

Aplikasi web mobile (Progressive Web App) bergaya *native app* yang dirancang khusus untuk seorang anak rantau (Rian) saat berbelanja bulanan sambil mendorong troli supermarket.

---

## 📱 Arsitektur & Tampilan Mobile

1. **Format Layar Smartphone**: Lebar maksimal 430px (responsif & *centered* di desktop dengan latar belakang *dark slate* elegan).
2. **Navigasi Bawah (Bottom Navigation Bar)**: Fixed melayang di bagian bawah dengan ikon Lucide untuk 3 tab utama:
   - 🛒 **Belanja**: Input & daftar keranjang aktif dengan stepper kuantitas dan kalkulator diskon.
   - 📜 **Riwayat**: Catatan belanja bulan lalu, rincian struk, dan grafik tren pengeluaran bulanan.
   - 💼 **Anggaran**: Pengaturan saldo dompet, dana darurat, dan ringkasan persentase kategori belanja.
3. **Ergonomi Mobile**: Komponen ramah jempol (*thumb-friendly*), stepper (+ / -) satu tangan, tanpa scroll horizontal.
4. **Dukungan PWA**: Dilengkapi `manifest.json`, icon 192px/512px, apple-touch-icon, serta `sw.js` (Service Worker) untuk kemampuan *offline* dan instalasi *Add to Home Screen*.

---

## 📋 Checklist Fitur SRS (F-01 s/d F-06)

- [x] **[F-01] Pencatatan Item Belanja Lengkap**:
  - Input nama produk dengan saran otomatis (*live autocomplete* dari katalog barang).
  - Pilihan kategori: Sembako, Toiletries, Makanan Instan, Dapur & Bumbu, Minuman, Sayur & Buah, Snack, dll.
  - Satuan ukuran: kg, liter, pcs, pack, kaleng, botol, gr.
  - Kuantitas (Qty) & Harga satuan saat ini.
  - Deteksi otomatis harga bulan lalu dari katalog belanja sebelumnya.

- [x] **[F-02] Perhitungan Kuantitas Otomatis**:
  - Setiap perubahan angka kuantitas (+ / - atau manual) langsung mengalikan harga satuan secara real-time ke Total Subharga tanpa perlu tombol kalkulator terpisah.

- [x] **[F-03] Kalkulator Diskon Bertingkat (Multi-Tier Discount Calculator)**:
  - Opsi Diskon Tunggal (contoh: 25%) dan Diskon Bertumpuk/Bertingkat (contoh: 50% + 20%).
  - **Rumus Sekuensial**:
    * $\text{Harga Setelah Diskon 1} = \text{Harga Awal} - (\text{Harga Awal} \times A\%)$
    * $\text{Harga Akhir} = \text{Harga Setelah Diskon 1} - (\text{Harga Setelah Diskon 1} \times B\%)$
    * Menghindari jebakan promo supermarket (50% + 20% = 60%, bukan 70%).
  - Menampilkan nominal penghematan bersih (Rp) secara transparan.

- [x] **[F-04] Komparator Harga Realtime vs Bulan Lalu**:
  - Panah Merah Naik (↑) & Teks Merah: Jika harga saat ini lebih mahal dari bulan lalu (beserta nominal & persentase kenaikan).
  - Panah Hijau Turun (↓) & Teks Hijau: Jika harga saat ini lebih murah dari bulan lalu (beserta nominal penghematan).
  - Tanda Setara (=) & Teks Abu-abu: Jika harga stabil/sama persis.
  - Badge Biru: Jika item baru pertama kali dibeli.

- [x] **[F-05] Pengendali Anggaran (Budget Safety Cap)**:
  - Header Sticky di bagian atas: `[Batas Saldo] - [Total Belanja] = [Sisa Saldo]`.
  - Safety Cap Bar Alert:
    * 🟢 Hijau/Biru: Total belanja < 80% (Aman).
    * 🟡 Kuning: Total belanja 80% - 95% (Waspada mendekati batas).
    * 🔴 Merah: Total belanja > 95% atau melebihi saldo (Bahaya + Efek Getar/Vibration Haptic + Peringatan tegas untuk mengurangi barang).

- [x] **[F-06] Riwayat & Database Belanja**:
  - Skema data LocalStorage modular yang siap dihubungkan 1:1 ke Firebase Firestore (`budgetSettings`, `activeCart`, `catalog`, `history`).
  - Tombol **"Selesaikan & Simpan Belanja Bulan Ini"**: Mengarsipkan keranjang ke riwayat, memperbarui harga acuan bulan depan di katalog, dan mengosongkan troli aktif.
  - Grafik tren pengeluaran bulanan berbasis SVG ringan dan interaktif.

- [x] **[Fitur Baru] Sistem Multi-Akun & Isolasi Data Penuh**:
  - Setiap akun pengguna memiliki ruang data mandiri yang terpisah 100%:
    * Saldo dompet & cadangan darurat terpisah.
    * Keranjang belanja aktif & kuantitas barang terpisah.
    * Katalog patokan riwayat harga barang terpisah.
    * Riwayat sesi belanja bulanan terpisah.
  - Fitur *1-Tap Account Switcher* untuk beralih instan antar akun (misal: Rian vs Aditya).
  - Formulir registrasi akun baru langsung membuat ruang data bersih dan mandiri.


---

## 🚀 Cara Menjalankan

### Cara 1: Double-click file `run-app.bat`
Klik ganda file [run-app.bat](file:///c:/Users/Lucky%20Aditya%20Mukti/Downloads/smartgrocerytracker/smartgrocerytracker/run-app.bat). Server lokal akan berjalan di `http://localhost:8080`.

### Cara 2: Akses langsung
Buka file [index.html](file:///c:/Users/Lucky%20Aditya%20Mukti/Downloads/smartgrocerytracker/smartgrocerytracker/index.html) langsung di peramban web (Google Chrome, Microsoft Edge, Safari).