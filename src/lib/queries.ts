import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type AjuanStatus = "draft" | "menunggu" | "disetujui" | "ditolak" | "dicairkan";

export interface AjuanRow {
  id: string;
  kode: string;
  judul: string;
  pengaju_id: string;
  instansi: string;
  rencana_penggunaan: string;
  total: number;
  status: AjuanStatus;
  bukti_url: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
  pengaju_nama?: string;
}

export interface AjuanItem {
  id: string;
  ajuan_id: string;
  nama_item: string;
  qty: number;
  satuan: string | null;
  harga: number;
  subtotal: number;
}

export function useAjuanList() {
  return useQuery({
    queryKey: ["ajuan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ajuan_anggaran")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map(d => d.pengaju_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, nama_lengkap").in("id", ids)
        : { data: [] as { id: string; nama_lengkap: string }[] };
      const nameMap = new Map((profs ?? []).map(p => [p.id, p.nama_lengkap]));
      return (data ?? []).map(d => ({ ...d, pengaju_nama: nameMap.get(d.pengaju_id) })) as AjuanRow[];
    },
  });
}

export function useAjuanDetail(id: string) {
  return useQuery({
    queryKey: ["ajuan", id],
    queryFn: async () => {
      const [a, items, history] = await Promise.all([
        supabase.from("ajuan_anggaran").select("*").eq("id", id).maybeSingle(),
        supabase.from("ajuan_items").select("*").eq("ajuan_id", id).order("created_at"),
        supabase.from("approval_history").select("*").eq("ajuan_id", id).order("created_at"),
      ]);
      if (a.error) throw a.error;
      const ajuan = a.data as AjuanRow | null;
      let pengajuNama: string | undefined;
      if (ajuan) {
        const { data: p } = await supabase.from("profiles").select("nama_lengkap").eq("id", ajuan.pengaju_id).maybeSingle();
        pengajuNama = p?.nama_lengkap;
      }
      const approverIds = Array.from(new Set((history.data ?? []).map((h: { approver_id: string }) => h.approver_id)));
      const { data: approvers } = approverIds.length
        ? await supabase.from("profiles").select("id, nama_lengkap").in("id", approverIds)
        : { data: [] as { id: string; nama_lengkap: string }[] };
      const aMap = new Map((approvers ?? []).map(p => [p.id, p.nama_lengkap]));
      return {
        ajuan: ajuan ? { ...ajuan, pengaju_nama: pengajuNama } : null,
        items: (items.data ?? []) as AjuanItem[],
        history: (history.data ?? []).map((h: { approver_id: string } & Record<string, unknown>) => ({ ...h, approver_nama: aMap.get(h.approver_id) })),
      };
    },
    enabled: !!id,
  });
}

export function useCreateAjuan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      judul: string; instansi: string; rencana_penggunaan: string;
      items: { nama_item: string; qty: number; satuan: string; harga: number }[];
      bukti_url?: string | null;
    }) => {
      if (!user) throw new Error("Tidak terautentikasi");
      const total = input.items.reduce((s, i) => s + i.qty * i.harga, 0);
      const kode = `AJU-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const { data: ajuan, error } = await supabase.from("ajuan_anggaran").insert({
        kode, judul: input.judul, pengaju_id: user.id, instansi: input.instansi,
        rencana_penggunaan: input.rencana_penggunaan, total, status: "menunggu",
        bukti_url: input.bukti_url ?? null,
      }).select().single();
      if (error) throw error;
      if (input.items.length > 0) {
        const { error: e2 } = await supabase.from("ajuan_items").insert(
          input.items.map(i => ({ ajuan_id: ajuan.id, ...i }))
        );
        if (e2) throw e2;
      }
      await supabase.from("audit_log").insert({
        user_id: user.id, aksi: "create", modul: "ajuan_anggaran",
        detail: { kode, total },
      });
      return ajuan as AjuanRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ajuan"] }),
  });
}

export function useApproval() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ ajuanId, aksi, catatan }: { ajuanId: string; aksi: "disetujui" | "ditolak"; catatan?: string }) => {
      if (!user) throw new Error("Tidak terautentikasi");
      const { error: e1 } = await supabase.from("ajuan_anggaran").update({ status: aksi, catatan }).eq("id", ajuanId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("approval_history").insert({
        ajuan_id: ajuanId, approver_id: user.id, aksi, catatan,
      });
      if (e2) throw e2;
      // Notify pengaju
      const { data: ajuan } = await supabase.from("ajuan_anggaran").select("pengaju_id, kode").eq("id", ajuanId).maybeSingle();
      if (ajuan) {
        await supabase.from("notifikasi").insert({
          user_id: ajuan.pengaju_id,
          judul: `Ajuan ${ajuan.kode} ${aksi}`,
          pesan: catatan ?? `Ajuan Anda telah ${aksi}.`,
          tipe: aksi === "disetujui" ? "sukses" : "peringatan",
          link: `/ajuan/${ajuanId}`,
        });
        await supabase.from("audit_log").insert({
          user_id: user.id, aksi, modul: "approval", detail: { ajuan_id: ajuanId, kode: ajuan.kode },
        });
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["ajuan"] });
      qc.invalidateQueries({ queryKey: ["ajuan", vars.ajuanId] });
    },
  });
}

export function useNotifikasi() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifikasi", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("notifikasi").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useMarkNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifikasi").update({ dibaca: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifikasi"] }),
  });
}

export function usePencairan() {
  return useQuery({
    queryKey: ["pencairan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pencairan")
        .select("*, ajuan_anggaran(kode, judul, total)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePencairan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { ajuan_id: string; bank: string; no_rekening: string; nama_pemilik: string; jumlah: number; bukti_url?: string }) => {
      const { error } = await supabase.from("pencairan").insert({ ...input, status: "selesai", diproses_oleh: user?.id });
      if (error) throw error;
      await supabase.from("ajuan_anggaran").update({ status: "dicairkan" }).eq("id", input.ajuan_id);
      if (user) {
        await supabase.from("audit_log").insert({ user_id: user.id, aksi: "pencairan", modul: "pencairan", detail: input });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pencairan"] });
      qc.invalidateQueries({ queryKey: ["ajuan"] });
    },
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map(d => d.user_id).filter(Boolean) as string[]));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, nama_lengkap").in("id", ids)
        : { data: [] as { id: string; nama_lengkap: string }[] };
      const nm = new Map((profs ?? []).map(p => [p.id, p.nama_lengkap]));
      return (data ?? []).map(d => ({ ...d, user_nama: d.user_id ? nm.get(d.user_id) : undefined }));
    },
  });
}

export function usePengguna() {
  return useQuery({
    queryKey: ["pengguna"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) ?? []);
      return (profiles ?? []).map(p => ({ ...p, role: roleMap.get(p.id) ?? "pengaju" }));
    },
  });
}
