import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/utils";
import { useAjuanList, type AjuanStatus, useDeleteAjuan } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { Search, Plus, Filter, Eye, ChevronLeft, ChevronRight, Download, Loader2, FileText, Printer, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ajuan/")({
  head: () => ({ meta: [{ title: "Ajuan Anggaran — E-Budgeting Pesantren" }] }),
  component: AjuanListPage,
});

const PER_PAGE = 8;
const filterOptions: { value: "all" | AjuanStatus; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "menunggu", label: "Menunggu" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
  { value: "dicairkan", label: "Dicairkan" },
];

function AjuanListPage() {
  const { role } = useAuth();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | AjuanStatus>("all");
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const { data: ajuanData = [], isLoading } = useAjuanList();
  const deleteAjuan = useDeleteAjuan();

  const handleDelete = async (a: any) => {
    const isAdmin = role === "admin";
    let reason = "";

    if (isAdmin) {
      const input = prompt(`Masukkan alasan penghapusan untuk ajuan ${a.kode}:`, "Kesalahan data / Pembatalan operasional");
      if (input === null) return;
      reason = input;
    } else {
      if (!confirm(`Apakah Anda yakin ingin menghapus ajuan ${a.kode}?`)) return;
    }

    try {
      await deleteAjuan.mutateAsync({ id: a.id, reason });
      toast.success("Ajuan berhasil dihapus");
    } catch (err: any) {
      toast.error("Gagal menghapus", { description: err.message });
    }
  };

  const filtered = useMemo(() => {
    return ajuanData.filter(a => {
      if (status !== "all" && a.status !== status) return false;
      if (q && !`${a.kode} ${a.judul} ${a.pengaju_nama ?? ""} ${a.instansi}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, status, ajuanData]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <PageHeader
        title="Daftar Ajuan Anggaran"
        description="Kelola dan monitor seluruh ajuan anggaran unit Pesantren Raudhatussalam."
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <button 
                onClick={() => setExportOpen(!exportOpen)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground shadow-soft transition-all hover:bg-secondary active:scale-95"
              >
                <Download className="h-4 w-4 text-primary" /> Export Data
              </button>
              
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-72 origin-top-right animate-in fade-in zoom-in-95 rounded-2xl border border-border bg-card p-3 shadow-elevated">
                    <div className="mb-2 px-2 pt-1 pb-2 border-b border-border">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pilih Format Laporan</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1.5 px-2 text-xs font-bold text-foreground">Laporan Rekapitulasi (.csv / .xls)</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button onClick={() => setExportOpen(false)} className="flex items-center justify-center rounded-lg bg-emerald-50 py-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">Excel (.xlsx)</button>
                          <button onClick={() => setExportOpen(false)} className="flex items-center justify-center rounded-lg bg-blue-50 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors">Data (.csv)</button>
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 px-2 text-xs font-bold text-foreground">Laporan Rekapitulasi (.csv / .xls)</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button onClick={() => setExportOpen(false)} className="flex items-center justify-center rounded-lg bg-emerald-50 py-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">Excel (.xlsx)</button>
                          <button onClick={() => setExportOpen(false)} className="flex items-center justify-center rounded-lg bg-blue-50 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors">Data (.csv)</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {role !== "approver" && (
              <Link to="/ajuan/baru" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:scale-105 active:scale-95">
                <Plus className="h-4 w-4" /> Buat Ajuan
              </Link>
            )}
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative md:max-w-sm md:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Cari kode, judul, pengaju..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
            {filterOptions.map(f => (
              <button
                key={f.value}
                onClick={() => { setStatus(f.value); setPage(1); }}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${status === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Kode</th>
                <th className="px-4 py-3 font-semibold">Judul Ajuan</th>
                <th className="px-4 py-3 font-semibold">Pengaju</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  Belum ada ajuan. Klik "Buat Ajuan" untuk membuat ajuan pertama.
                </td></tr>
              ) : paged.map(a => (
                <tr key={a.id} className="border-b border-border last:border-0 transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{a.kode}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{a.judul}</p>
                    <p className="text-xs text-muted-foreground">{a.instansi}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.pengaju_nama ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRupiah(Number(a.total))}</td>
                  <td className="px-4 py-3"><StatusBadge className={statusBadgeClass[a.status]}>{statusLabel[a.status]}</StatusBadge></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to="/ajuan/$id" params={{ id: a.id }} className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-semibold hover:bg-secondary" title="Detail">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">Detail</span>
                      </Link>
                      
                      {role === "pengaju" && (a.status === "menunggu" || a.status === "draft") && (
                        <Link to="/ajuan/$id" params={{ id: a.id }} className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-semibold hover:bg-secondary text-amber-600" title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                      )}

                      {(role === "admin" ? a.status !== "selesai" : (role === "pengaju" && ["menunggu", "draft", "ditolak"].includes(a.status))) && (
                        <button 
                          onClick={() => handleDelete(a)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-destructive/20 bg-destructive/5 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border p-4 text-xs text-muted-foreground">
          <p>Menampilkan {paged.length} dari {filtered.length} ajuan</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-secondary disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 font-semibold text-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-secondary disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
