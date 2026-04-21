
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'pengaju', 'approver');
CREATE TYPE public.ajuan_status AS ENUM ('draft', 'menunggu', 'disetujui', 'ditolak', 'dicairkan');
CREATE TYPE public.pencairan_status AS ENUM ('menunggu', 'diproses', 'selesai');
CREATE TYPE public.notif_type AS ENUM ('info', 'sukses', 'peringatan', 'error');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  jabatan TEXT,
  instansi TEXT,
  no_hp TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function untuk cek role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- ============ AJUAN ANGGARAN ============
CREATE TABLE public.ajuan_anggaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT NOT NULL UNIQUE,
  judul TEXT NOT NULL,
  pengaju_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instansi TEXT NOT NULL,
  rencana_penggunaan TEXT NOT NULL,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  status ajuan_status NOT NULL DEFAULT 'menunggu',
  bukti_url TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ajuan_anggaran ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ajuan_pengaju ON public.ajuan_anggaran(pengaju_id);
CREATE INDEX idx_ajuan_status ON public.ajuan_anggaran(status);

-- ============ AJUAN ITEMS ============
CREATE TABLE public.ajuan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ajuan_id UUID NOT NULL REFERENCES public.ajuan_anggaran(id) ON DELETE CASCADE,
  nama_item TEXT NOT NULL,
  qty NUMERIC(10,2) NOT NULL DEFAULT 1,
  satuan TEXT,
  harga NUMERIC(15,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(15,2) GENERATED ALWAYS AS (qty * harga) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ajuan_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_items_ajuan ON public.ajuan_items(ajuan_id);

-- ============ PENCAIRAN ============
CREATE TABLE public.pencairan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ajuan_id UUID NOT NULL REFERENCES public.ajuan_anggaran(id) ON DELETE CASCADE,
  bank TEXT NOT NULL,
  no_rekening TEXT NOT NULL,
  nama_pemilik TEXT NOT NULL,
  jumlah NUMERIC(15,2) NOT NULL,
  bukti_url TEXT,
  status pencairan_status NOT NULL DEFAULT 'menunggu',
  diproses_oleh UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pencairan ENABLE ROW LEVEL SECURITY;

-- ============ APPROVAL HISTORY ============
CREATE TABLE public.approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ajuan_id UUID NOT NULL REFERENCES public.ajuan_anggaran(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  aksi TEXT NOT NULL,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_approval_ajuan ON public.approval_history(ajuan_id);

-- ============ NOTIFIKASI ============
CREATE TABLE public.notifikasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  pesan TEXT NOT NULL,
  tipe notif_type NOT NULL DEFAULT 'info',
  dibaca BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifikasi ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notif_user ON public.notifikasi(user_id);

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  aksi TEXT NOT NULL,
  modul TEXT NOT NULL,
  detail JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

-- ============ TRIGGER: updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_ajuan_updated BEFORE UPDATE ON public.ajuan_anggaran
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_pencairan_updated BEFORE UPDATE ON public.pencairan
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ TRIGGER: auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama_lengkap, jabatan, instansi, no_hp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'jabatan',
    NEW.raw_user_meta_data->>'instansi',
    NEW.raw_user_meta_data->>'no_hp'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'pengaju');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'approver'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "admin manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ajuan_anggaran
CREATE POLICY "view ajuan" ON public.ajuan_anggaran FOR SELECT TO authenticated
  USING (pengaju_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'approver'));
CREATE POLICY "create ajuan" ON public.ajuan_anggaran FOR INSERT TO authenticated
  WITH CHECK (pengaju_id = auth.uid());
CREATE POLICY "update own ajuan" ON public.ajuan_anggaran FOR UPDATE TO authenticated
  USING (pengaju_id = auth.uid() AND status IN ('draft','menunggu'));
CREATE POLICY "approver/admin update ajuan" ON public.ajuan_anggaran FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'approver'));
CREATE POLICY "delete own draft" ON public.ajuan_anggaran FOR DELETE TO authenticated
  USING (pengaju_id = auth.uid() AND status = 'draft');

-- ajuan_items
CREATE POLICY "view items" ON public.ajuan_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ajuan_anggaran a WHERE a.id = ajuan_id AND
    (a.pengaju_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'approver'))));
CREATE POLICY "manage items" ON public.ajuan_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ajuan_anggaran a WHERE a.id = ajuan_id AND a.pengaju_id = auth.uid()));

-- pencairan
CREATE POLICY "view pencairan" ON public.pencairan FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ajuan_anggaran a WHERE a.id = ajuan_id AND
    (a.pengaju_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'approver'))));
CREATE POLICY "admin manage pencairan" ON public.pencairan FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- approval_history
CREATE POLICY "view approval" ON public.approval_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ajuan_anggaran a WHERE a.id = ajuan_id AND
    (a.pengaju_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'approver'))));
CREATE POLICY "approver create approval" ON public.approval_history FOR INSERT TO authenticated
  WITH CHECK (approver_id = auth.uid() AND
    (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'approver')));

-- notifikasi
CREATE POLICY "view own notif" ON public.notifikasi FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "update own notif" ON public.notifikasi FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "system insert notif" ON public.notifikasi FOR INSERT TO authenticated
  WITH CHECK (true);

-- audit_log
CREATE POLICY "admin view audit" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "system insert audit" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('bukti', 'bukti', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read bukti" ON storage.objects FOR SELECT
  USING (bucket_id = 'bukti');
CREATE POLICY "auth upload bukti" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bukti');
CREATE POLICY "auth update own bukti" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'bukti' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "auth delete own bukti" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bukti' AND auth.uid()::text = (storage.foldername(name))[1]);
