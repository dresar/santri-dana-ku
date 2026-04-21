import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockStore, Ajuan, AjuanItem, AuditLog, Pencairan as PencairanType } from "./mock-store";
import { StatusAjuan } from "./utils";

export type { StatusAjuan as AjuanStatus };
export type { Ajuan as AjuanRow, AjuanItem, AuditLog, PencairanType as Pencairan };

export function useAjuanList() {
  return useQuery({
    queryKey: ["ajuan"],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return mockStore.getAjuan();
    },
  });
}

export function useAjuanDetail(id: string) {
  return useQuery({
    queryKey: ["ajuan", id],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      const ajuan = mockStore.getAjuanDetail(id);
      if (!ajuan) throw new Error("Ajuan tidak ditemukan");
      return { ajuan, items: ajuan.items, history: [] };
    },
    enabled: !!id,
  });
}

export function useCreateAjuan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      judul: string; instansi: string; rencana_penggunaan: string; pengaju_nama?: string;
      items: { nama_item: string; qty: number; satuan: string; harga: number }[];
    }) => {
      await new Promise(r => setTimeout(r, 800));
      const total = input.items.reduce((s, i) => s + i.qty * i.harga, 0);
      return mockStore.createAjuan({
        ...input,
        total,
        pengaju_nama: input.pengaju_nama || "Anonim",
        items: input.items.map(i => ({ ...i, id: Math.random().toString(36).substr(2, 5), subtotal: i.qty * i.harga }))
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ajuan"] }),
  });
}

export function useApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ajuanId, aksi, catatan }: { ajuanId: string; aksi: "disetujui" | "ditolak"; catatan?: string }) => {
      await new Promise(r => setTimeout(r, 600));
      return mockStore.approveAjuan(ajuanId, aksi, catatan);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["ajuan"] });
      qc.invalidateQueries({ queryKey: ["ajuan", vars.ajuanId] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useNotifikasi() {
  return useQuery({
    queryKey: ["notifikasi"],
    queryFn: () => [], // Dummy for now
  });
}

export function useMarkNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {},
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifikasi"] }),
  });
}

export function usePencairan() {
  return useQuery({
    queryKey: ["pencairan"],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return mockStore.getPencairan();
    },
  });
}

export function useCreatePencairan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      await new Promise(r => setTimeout(r, 800));
      return mockStore.createPencairan(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pencairan"] });
      qc.invalidateQueries({ queryKey: ["ajuan"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return mockStore.getAudit();
    },
  });
}

export function usePengguna() {
  return useQuery({
    queryKey: ["pengguna"],
    queryFn: async () => [
      { id: "u1", nama_lengkap: "Admin Utama", email: "admin@example.com", role: "admin", instansi: "Sekretariat Pesantren" },
      { id: "u2", nama_lengkap: "Ustadz Ahmad", email: "pengaju@example.com", role: "pengaju", instansi: "Unit Dapur Umum" },
    ],
  });
}
