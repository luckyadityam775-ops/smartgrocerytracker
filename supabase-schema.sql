-- ====================================================================
-- SKEMA DATABASE SMART GROCERY TRACKER (SUPABASE POSTGRESQL)
-- Proyek Supabase: https://pynraezkvnqtidmljdkk.supabase.co
-- Cara Pakai: Salin seluruh isi script ini -> Buka Supabase Dashboard
--              -> Klik menu "SQL Editor" -> Klik "+ New Query"
--              -> Tempel di editor -> Klik "Run" (atau Ctrl+Enter)
-- ====================================================================

-- 1. TABEL KERANJANG BELANJA (grocery_cart)
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

-- Index user_id untuk performa query cepat
CREATE INDEX IF NOT EXISTS idx_grocery_cart_user_id ON public.grocery_cart(user_id);

-- 2. TABEL PENGATURAN ANGGARAN & SALDO DOMPET (grocery_budget)
CREATE TABLE IF NOT EXISTS public.grocery_budget (
    user_id TEXT PRIMARY KEY,
    monthly_limit NUMERIC NOT NULL DEFAULT 500000,
    emergency_reserve NUMERIC NOT NULL DEFAULT 50000,
    user_name TEXT DEFAULT 'Pengguna Utama',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL RIWAYAT TRANSAKSI BELANJA (grocery_history)
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

CREATE INDEX IF NOT EXISTS idx_grocery_history_user_id ON public.grocery_history(user_id);

-- 4. AKTIFKAN ROW LEVEL SECURITY (RLS) & KEBIJAKAN AKSES
ALTER TABLE public.grocery_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_history ENABLE ROW LEVEL SECURITY;

-- Reset policy lama jika ada untuk mencegah konflik
DO $$
BEGIN
    DROP POLICY IF EXISTS "Akses Publik grocery_cart" ON public.grocery_cart;
    DROP POLICY IF EXISTS "Akses Publik grocery_budget" ON public.grocery_budget;
    DROP POLICY IF EXISTS "Akses Publik grocery_history" ON public.grocery_history;
END $$;

-- Policy agar aplikasi web dapat membaca & menulis data dengan Anon API Key
CREATE POLICY "Akses Publik grocery_cart" ON public.grocery_cart 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Akses Publik grocery_budget" ON public.grocery_budget 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Akses Publik grocery_history" ON public.grocery_history 
    FOR ALL USING (true) WITH CHECK (true);

-- 5. AKTIFKAN REALTIME REPLICATION (Agar sinkronisasi live antar HP & PC jalan)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'grocery_cart'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_cart;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'grocery_budget'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_budget;
    END IF;
END $$;
