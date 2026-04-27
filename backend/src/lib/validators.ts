import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nama_lengkap: z.string().min(2),
  jabatan: z.string().optional(),
  instansi: z.string().optional(),
  no_hp: z.string().optional(),
});

export const CreateUserAdminSchema = SignupSchema.extend({
  role: z.enum(['admin', 'pengaju', 'approver', 'administrasi']).optional().default('pengaju'),
});

export const UpdateProfileSchema = z.object({
  nama_lengkap: z.string().min(2).optional(),
  jabatan: z.string().optional(),
  instansi: z.string().optional(),
  no_hp: z.string().optional(),
  foto_url: z.string().optional(),
});

export const ChangePasswordSchema = z.object({
  current_password: z.string().min(6),
  new_password: z.string().min(6),
});

// ─── Ajuan ───────────────────────────────────────────────────────────────────
export const AjuanItemSchema = z.object({
  nama_item: z.string().min(1),
  qty: z.number().positive(),
  satuan: z.string().optional(),
  harga: z.number().nonnegative(),
});

export const CreateAjuanSchema = z.object({
  judul: z.string().min(3),
  instansi: z.string().min(2),
  rencana_penggunaan: z.string().min(10),
  gambar_url: z.string().optional(),
  items: z.array(AjuanItemSchema).min(1),
});

export const UpdateAjuanStatusSchema = z.object({
  status: z.enum(['disetujui', 'ditolak', 'dicairkan', 'menunggu', 'selesai']),
  catatan: z.string().optional(),
});

// ─── Pencairan ───────────────────────────────────────────────────────────────
export const CreatePencairanSchema = z.object({
  ajuan_id: z.string().uuid(),
  metode: z.enum(['tunai', 'transfer']).default('tunai'),
  bank: z.string().optional(),
  no_rekening: z.string().optional(),
  nama_pemilik: z.string().optional(),
  jumlah: z.number().positive(),
  bukti_url: z.string().optional(),
  bukti_penyerahan_url: z.string().optional(),
});

export const UpdatePencairanStatusSchema = z.object({
  status: z.enum(['menunggu', 'diproses', 'selesai']),
});

export const UpdatePencairanSchema = CreatePencairanSchema.omit({ ajuan_id: true }).partial().extend({
  status: z.enum(['menunggu', 'diproses', 'selesai']).optional(),
});

// ─── Pengguna ────────────────────────────────────────────────────────────────
export const UpdateRoleSchema = z.object({
  role: z.enum(['admin', 'pengaju', 'approver', 'administrasi']),
});

// ─── AI Keys ─────────────────────────────────────────────────────────────────
export const AddKeySchema = z.object({
  alias: z.string().min(1),
  key_value: z.string().startsWith('AIza'),
  daily_limit: z.number().int().positive().optional().default(1500),
});

// ─── AI Requests ─────────────────────────────────────────────────────────────
export const AnalyzeAjuanSchema = z.object({
  ajuan_id: z.string().uuid(),
});

export const SummarizeSchema = z.object({
  text: z.string().min(10),
});

export const ChatSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.object({ text: z.string() })),
      }),
    )
    .optional()
    .default([]),
});
// ─── Laporan ────────────────────────────────────────────────────────────────
export const LaporanItemSchema = z.object({
  nama_item: z.string().min(1),
  qty: z.number().positive(),
  satuan: z.string().optional(),
  harga: z.number().nonnegative(),
});

export const CreateLaporanSchema = z.object({
  ajuan_id: z.string().uuid(),
  total_anggaran: z.number().nonnegative(),
  total_digunakan: z.number().nonnegative(),
  sisa_dana: z.number(),
  catatan: z.string().optional(),
  foto_nota_urls: z.array(z.string()),
  items: z.array(LaporanItemSchema).min(1),
});
