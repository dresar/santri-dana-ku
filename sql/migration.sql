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
CREATE TYPE app_role AS ENUM ('admin', 'pengaju', 'approver');
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ajuan Anggaran
CREATE TYPE ajuan_status AS ENUM ('draft', 'menunggu', 'disetujui', 'ditolak', 'dicairkan');
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
CREATE TYPE notif_type AS ENUM ('info', 'sukses', 'peringatan', 'error');
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
CREATE TYPE pencairan_status AS ENUM ('menunggu', 'diproses', 'selesai');
CREATE TABLE IF NOT EXISTS pencairan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ajuan_id UUID REFERENCES ajuan_anggaran(id) ON DELETE CASCADE,
  bank TEXT NOT NULL,
  no_rekening TEXT NOT NULL,
  nama_pemilik TEXT NOT NULL,
  jumlah NUMERIC NOT NULL,
  status pencairan_status DEFAULT 'selesai',
  diproses_oleh UUID REFERENCES profiles(id),
  bukti_url TEXT,
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
