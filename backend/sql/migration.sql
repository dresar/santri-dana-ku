-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nama_lengkap TEXT NOT NULL,
  jabatan TEXT,
  instansi TEXT,
  no_hp TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'pengaju', 'approver', 'administrasi');
    ELSE
        BEGIN
            ALTER TYPE app_role ADD VALUE 'administrasi';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ajuan Anggaran
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ajuan_status') THEN
        CREATE TYPE ajuan_status AS ENUM ('draft', 'menunggu', 'disetujui', 'ditolak', 'dicairkan');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS ajuan_anggaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode TEXT UNIQUE NOT NULL,
  judul TEXT NOT NULL,
  pengaju_id UUID REFERENCES profiles(id),
  instansi TEXT NOT NULL,
  rencana_penggunaan TEXT NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  status ajuan_status DEFAULT 'menunggu',
  bukti_url TEXT,
  catatan TEXT,
  deleted_at TIMESTAMPTZ,
  deletion_reason TEXT,
  dokumen_url TEXT,
  gambar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ajuan Items
CREATE TABLE IF NOT EXISTS ajuan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ajuan_id UUID REFERENCES ajuan_anggaran(id) ON DELETE CASCADE,
  nama_item TEXT NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 1,
  satuan TEXT,
  harga NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Approval History
CREATE TABLE IF NOT EXISTS approval_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ajuan_id UUID REFERENCES ajuan_anggaran(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES profiles(id),
  aksi TEXT NOT NULL,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notifikasi
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notif_type') THEN
        CREATE TYPE notif_type AS ENUM ('info', 'sukses', 'peringatan', 'error');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS notifikasi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  pesan TEXT NOT NULL,
  tipe notif_type DEFAULT 'info',
  link TEXT,
  dibaca BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Pencairan
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pencairan_status') THEN
        CREATE TYPE pencairan_status AS ENUM ('menunggu', 'diproses', 'selesai');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS pencairan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ajuan_id UUID REFERENCES ajuan_anggaran(id) ON DELETE CASCADE,
  metode TEXT DEFAULT 'tunai',
  bank TEXT,
  no_rekening TEXT,
  nama_pemilik TEXT,
  jumlah NUMERIC NOT NULL,
  status pencairan_status DEFAULT 'selesai',
  diproses_oleh UUID REFERENCES profiles(id),
  bukti_url TEXT,
  bukti_penyerahan_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  aksi TEXT NOT NULL,
  modul TEXT NOT NULL,
  detail JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Gemini API Keys
CREATE TABLE IF NOT EXISTS gemini_api_keys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alias       TEXT NOT NULL,
  key_value   TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'disabled', 'error')),
  usage_today INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 1500,
  total_calls BIGINT DEFAULT 0,
  last_used   TIMESTAMPTZ,
  last_error  TEXT,
  error_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gemini_keys_status_usage ON gemini_api_keys (status, usage_today ASC);

-- 10. Instansi
CREATE TABLE IF NOT EXISTS instansi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO instansi (nama) SELECT 'Sekretariat Pesantren' WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Sekretariat Pesantren');
INSERT INTO instansi (nama) SELECT 'Bidang Kurikulum' WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Bidang Kurikulum');
INSERT INTO instansi (nama) SELECT 'Bidang Kesantrian' WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Bidang Kesantrian');
INSERT INTO instansi (nama) SELECT 'Bidang Sarana Prasarana' WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Bidang Sarana Prasarana');
INSERT INTO instansi (nama) SELECT 'Bidang Keuangan' WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Bidang Keuangan');
INSERT INTO instansi (nama) SELECT 'Unit Dapur Umum' WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Unit Dapur Umum');
INSERT INTO instansi (nama) SELECT 'Unit Kesehatan Santri' WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Unit Kesehatan Santri');
INSERT INTO instansi (nama) SELECT 'Unit Perpustakaan' WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Unit Perpustakaan');

-- 11. Settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value)
VALUES ('instansi', '{
    "nama": "Pesantren Modern Raudhatussalam Mahato",
    "alamat": "Jl. Pesantren No. 01, Mahato, Riau",
    "email": "info@raudhatussalam.sch.id",
    "kontak": "0812-3456-7890",
    "logo_url": null,
    "ttd_url": null,
    "show_ttd": true
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 12. Laporan Penggunaan
CREATE TABLE IF NOT EXISTS laporan_penggunaan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ajuan_id UUID REFERENCES ajuan_anggaran(id) ON DELETE CASCADE,
    pengaju_id UUID REFERENCES profiles(id),
    total_anggaran NUMERIC NOT NULL,
    total_digunakan NUMERIC NOT NULL DEFAULT 0,
    sisa_dana NUMERIC NOT NULL DEFAULT 0,
    catatan TEXT,
    foto_nota_urls TEXT[],
    pdf_laporan_url TEXT,
    status TEXT DEFAULT 'menunggu',
    verifikator_id UUID REFERENCES profiles(id),
    catatan_verifikasi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_laporan_ajuan_id ON laporan_penggunaan(ajuan_id);
CREATE INDEX IF NOT EXISTS idx_laporan_pengaju_id ON laporan_penggunaan(pengaju_id);
CREATE INDEX IF NOT EXISTS idx_laporan_status ON laporan_penggunaan(status);

CREATE TABLE IF NOT EXISTS laporan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laporan_id UUID REFERENCES laporan_penggunaan(id) ON DELETE CASCADE,
    nama_item TEXT NOT NULL,
    qty NUMERIC NOT NULL DEFAULT 1,
    satuan TEXT,
    harga NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Demo Users & Role Fixes
INSERT INTO profiles (email, password, nama_lengkap, jabatan, instansi, no_hp)
VALUES (
  'admin.keuangan@santri.id', 
  '$2b$10$wxAFLZpxdwvWQUhUHrCvw.rvYGyx0AzWdRqMSDsvVB/F2CvEZu4W2',
  'H. Ahmad Dahlan', 
  'Bendahara Utama', 
  'Sekretariat Pesantren', 
  '08123456789'
) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

INSERT INTO user_roles (user_id, role)
SELECT id, 'administrasi' FROM profiles WHERE email = 'admin.keuangan@santri.id'
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

UPDATE profiles 
SET password = '$2b$10$wxAFLZpxdwvWQUhUHrCvw.rvYGyx0AzWdRqMSDsvVB/F2CvEZu4W2'
WHERE email IN ('admin@example.com', 'approver@example.com', 'pengaju@example.com');
