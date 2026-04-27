import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPatch, apiDelete } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Ajuan {
  id: string;
  kode: string;
  judul: string;
  instansi: string;
  rencana_penggunaan: string;
  total: number;
  status: "menunggu" | "disetujui" | "ditolak" | "dicairkan" | "selesai";
  dokumen_url?: string;
  gambar_url?: string;
  catatan?: string;
  has_laporan?: boolean;
  pengaju_id: string;
  pengaju_nama?: string;
  pengaju_jabatan?: string;
  pengaju_instansi?: string;
  created_at: string;
  updated_at: string;
}

export interface AjuanItem {
  id: string;
  ajuan_id: string;
  nama_item: string;
  qty: number;
  satuan?: string;
  harga: number;
  subtotal: number;
}

export interface AjuanDetail extends Ajuan {
  items: AjuanItem[];
  history: ApprovalHistory[];
}

export interface ApprovalHistory {
  id: string;
  ajuan_id: string;
  approver_id: string;
  approver_nama?: string;
  aksi: string;
  catatan?: string;
  created_at: string;
}

export interface Pencairan {
  id: string;
  ajuan_id: string;
  kode?: string;
  judul?: string;
  bank: string;
  no_rekening: string;
  nama_pemilik: string;
  jumlah: number;
  status: "menunggu" | "diproses" | "selesai";
  pengaju_nama?: string;
  diproses_nama?: string;
  metode: "tunai" | "transfer";
  bukti_url?: string;
  bukti_penyerahan_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Notifikasi {
  id: string;
  user_id: string;
  judul: string;
  pesan: string;
  tipe: "info" | "sukses" | "error" | "warning";
  dibaca: boolean;
  link?: string;
  created_at: string;
}

export interface Pengguna {
  id: string;
  email: string;
  nama_lengkap: string;
  jabatan?: string;
  instansi?: string;
  no_hp?: string;
  foto_url?: string;
  role?: string;
  ajuan_count?: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_nama?: string;
  user_email?: string;
  aksi: string;
  modul: string;
  detail?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface GeminiKey {
  id: string;
  alias: string;
  key_preview: string;
  status: "active" | "exhausted" | "disabled" | "error";
  usage_today: number;
  daily_limit: number;
  total_calls: number;
  last_used?: string;
  last_error?: string;
  error_count: number;
}

export interface Instansi {
  id: string;
  nama: string;
  created_at: string;
}

export interface Laporan {
  id: string;
  ajuan_id: string;
  ajuan_kode?: string;
  ajuan_judul?: string;
  pengaju_id: string;
  pengaju_nama?: string;
  total_anggaran: number;
  total_digunakan: number;
  sisa_dana: number;
  catatan?: string;
  foto_nota_urls: string[];
  pdf_laporan_url?: string;
  status: "menunggu" | "disetujui" | "ditolak";
  verifikator_id?: string;
  catatan_verifikasi?: string;
  created_at: string;
  items?: LaporanItem[];
}

export interface LaporanItem {
  id: string;
  laporan_id: string;
  nama_item: string;
  qty: number;
  satuan?: string;
  harga: number;
  subtotal: number;
}

export interface PagedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export type StatusAjuan = Ajuan["status"];
export type { Ajuan as AjuanRow };

// ─── Ajuan ───────────────────────────────────────────────────────────────────

export function useAjuanList(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();

  return useQuery<Ajuan[]>({
    queryKey: ["ajuan", params],
    queryFn: async () => {
      const res = await apiFetch<PagedResponse<Ajuan> | Ajuan[]>(`/ajuan${query ? "?" + query : ""}`);
      // backend returns { data: [], meta: {} } but apiFetch already unwraps → res is Ajuan[] or paged
      if (Array.isArray(res)) return res;
      return (res as PagedResponse<Ajuan>).data ?? (res as any) ?? [];
    },
  });
}

export function useAjuanDetail(id: string) {
  return useQuery<AjuanDetail>({
    queryKey: ["ajuan", id],
    queryFn: () => apiFetch<AjuanDetail>(`/ajuan/${id}`),
    enabled: !!id,
  });
}

export function useCreateAjuan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { judul: string; instansi: string; rencana_penggunaan: string; dokumen_url?: string; gambar_url?: string; items: Omit<AjuanItem, "id" | "ajuan_id" | "subtotal">[] }) =>
      apiPost("/ajuan", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ajuan"] }),
  });
}

export function useApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ajuanId, aksi, catatan }: { ajuanId: string; aksi: string; catatan?: string }) =>
      apiPatch(`/ajuan/${ajuanId}/status`, { status: aksi, catatan }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["ajuan"] });
      qc.invalidateQueries({ queryKey: ["ajuan", vars.ajuanId] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      qc.invalidateQueries({ queryKey: ["notifikasi"] });
    },
  });
}

export function useDeleteAjuan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      apiDelete(`/ajuan/${id}${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ajuan"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      qc.invalidateQueries({ queryKey: ["notifikasi"] });
    },
  });
}

export function useUpdateAjuan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AjuanDetail> }) =>
      apiPatch(`/ajuan/${id}`, input),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["ajuan"] });
      qc.invalidateQueries({ queryKey: ["ajuan", vars.id] });
    },
  });
}

// ─── Pencairan ────────────────────────────────────────────────────────────────

export function usePencairan() {
  return useQuery<Pencairan[]>({
    queryKey: ["pencairan"],
    queryFn: () => apiFetch<Pencairan[]>("/pencairan"),
  });
}

export function useCreatePencairan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ajuan_id: string; bank: string; no_rekening: string; nama_pemilik: string; jumlah: number }) =>
      apiPost("/pencairan", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pencairan"] });
      qc.invalidateQueries({ queryKey: ["ajuan"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useUpdatePencairanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "menunggu" | "diproses" | "selesai" }) =>
      apiPatch(`/pencairan/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pencairan"] }),
  });
}

export function useUpdatePencairan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pencairan> }) =>
      apiPatch(`/pencairan/${id}`, input),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["pencairan"] });
      qc.invalidateQueries({ queryKey: ["pencairan", vars.id] });
    },
  });
}

export function usePencairanDetail(id: string) {
  return useQuery<Pencairan>({
    queryKey: ["pencairan", id],
    queryFn: () => apiFetch<Pencairan>(`/pencairan/${id}`),
    enabled: !!id,
  });
}

export function useDeletePencairan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/pencairan/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pencairan"] });
      qc.invalidateQueries({ queryKey: ["ajuan"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

// ─── Notifikasi ───────────────────────────────────────────────────────────────

export function useNotifikasi() {
  return useQuery<Notifikasi[]>({
    queryKey: ["notifikasi"],
    queryFn: async () => {
      const res = await apiFetch<{ items: Notifikasi[]; unread_count: number }>("/notifikasi");
      return Array.isArray(res) ? res : (res as any)?.items ?? [];
    },
    refetchInterval: 30_000,
  });
}

export function useMarkNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch(`/notifikasi/${id}/baca`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifikasi"] }),
  });
}

export function useMarkAllNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("/notifikasi/baca-semua", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifikasi"] }),
  });
}

export function useDeleteNotif() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/notifikasi/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifikasi"] }),
  });
}

// ─── Pengguna ─────────────────────────────────────────────────────────────────

export function usePengguna(params?: { search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  const query = qs.toString();

  return useQuery<Pengguna[]>({
    queryKey: ["pengguna", params],
    queryFn: async () => {
      const res = await apiFetch<PagedResponse<Pengguna> | Pengguna[]>(`/pengguna${query ? "?" + query : ""}`);
      if (Array.isArray(res)) return res;
      return (res as PagedResponse<Pengguna>).data ?? [];
    },
  });
}

export function usePenggunaDetail(id: string) {
  return useQuery<Pengguna>({
    queryKey: ["pengguna", id],
    queryFn: () => apiFetch<Pengguna>(`/pengguna/${id}`),
    enabled: !!id,
  });
}

export function useCreatePengguna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => apiPost("/pengguna", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pengguna"] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => apiPatch("/pengguna/me", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pengguna"] }),
  });
}

export function useUpdatePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => apiPatch("/pengguna/me/foto", { foto_url: url }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pengguna"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiPatch(`/pengguna/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pengguna"] }),
  });
}

export function useDeletePengguna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/pengguna/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pengguna"] }),
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiPatch(`/pengguna/${id}/password`, { password }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pengguna"] }),
  });
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export function useAuditLog(params?: { modul?: string; user_id?: string; page?: number }, options?: { enabled?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.modul) qs.set("modul", params.modul);
  if (params?.user_id) qs.set("user_id", params.user_id);
  if (params?.page) qs.set("page", String(params.page));
  const query = qs.toString();

  return useQuery<AuditLog[]>({
    queryKey: ["audit", params],
    queryFn: async () => {
      const res = await apiFetch<PagedResponse<AuditLog> | AuditLog[]>(`/audit${query ? "?" + query : ""}`);
      if (Array.isArray(res)) return res;
      return (res as PagedResponse<AuditLog>).data ?? [];
    },
    ...options
  });
}

// ─── Laporan ──────────────────────────────────────────────────────────────────

export function useLaporanRingkasan() {
  return useQuery({
    queryKey: ["laporan", "ringkasan"],
    queryFn: () => apiFetch("/laporan/ringkasan"),
  });
}

export function useLaporanBulanan(year?: number) {
  return useQuery({
    queryKey: ["laporan", "bulanan", year],
    queryFn: () => apiFetch(`/laporan/bulanan${year ? "?year=" + year : ""}`),
  });
}

export function useLaporanList(params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();

  return useQuery<PagedResponse<Laporan> | Laporan[]>({
    queryKey: ["laporan", "list", params],
    queryFn: async () => {
      const res = await apiFetch<PagedResponse<Laporan> | Laporan[]>(`/laporan${query ? "?" + query : ""}`);
      if (Array.isArray(res)) return res;
      return (res as PagedResponse<Laporan>).data ?? [];
    },
  });
}

export function useCreateLaporan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => apiPost("/laporan", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["laporan"] });
      qc.invalidateQueries({ queryKey: ["ajuan"] });
    },
  });
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export function useGeminiKeys() {
  return useQuery<{ keys: GeminiKey[]; summary: any }>({
    queryKey: ["ai", "keys"],
    queryFn: () => apiFetch("/ai/keys/status"),
  });
}

export function useAddGeminiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { alias: string; key_value: string; daily_limit?: number }) =>
      apiPost("/ai/keys", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai", "keys"] }),
  });
}

export function useDeleteGeminiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/ai/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai", "keys"] }),
  });
}

export function useToggleGeminiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch(`/ai/keys/${id}/toggle`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai", "keys"] }),
  });
}

export function useAnalyzeAjuan() {
  return useMutation({
    mutationFn: (ajuan_id: string) => apiPost("/ai/analyze-ajuan", { ajuan_id }),
  });
}

export function useSummarize() {
  return useMutation({
    mutationFn: (text: string) => apiPost("/ai/summarize", { text }),
  });
}

export function useAIChat() {
  return useMutation({
    mutationFn: ({ message, history }: {
      message: string;
      history?: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
    }) => apiPost("/ai/chat", { message, history: history ?? [] }),
  });
}

// ─── Instansi ─────────────────────────────────────────────────────────────────

export function useInstansiList() {
  return useQuery<Instansi[]>({
    queryKey: ["instansi"],
    queryFn: () => apiFetch<Instansi[]>("/instansi"),
  });
}

export function useCreateInstansi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nama: string) => apiPost("/instansi", { nama }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instansi"] }),
  });
}

export function useDeleteInstansi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/instansi/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instansi"] }),
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface InstansiSettings {
  nama: string;
  alamat: string;
  email: string;
  kontak: string;
  logo_url: string | null;
  ttd_url: string | null;
  show_ttd: boolean;
  cloudinary_cloud_name?: string;
  cloudinary_upload_preset?: string;
  cloudinary_api_key?: string;
  cloudinary_api_secret?: string;
}

export function useSettings(key: string = "instansi") {
  return useQuery<InstansiSettings>({
    queryKey: ["settings", key],
    queryFn: () => apiFetch<InstansiSettings>(`/settings/${key}`),
  });
}

export function useUpdateSettings(key: string = "instansi") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: InstansiSettings) => apiPatch(`/settings/${key}`, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", key] }),
  });
}

export function useVerifyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, catatan }: { id: string; status: string; catatan?: string }) =>
      apiPatch(`/laporan/${id}/status`, { status, catatan }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["laporan"] });
      qc.invalidateQueries({ queryKey: ["laporan", vars.id] });
      qc.invalidateQueries({ queryKey: ["ajuan"] });
      qc.invalidateQueries({ queryKey: ["notifikasi"] });
    },
  });
}
