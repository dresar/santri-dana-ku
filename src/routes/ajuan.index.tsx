import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/dummy-data";
import { useAjuanList, type AjuanStatus } from "@/lib/queries";
import { Search, Plus, Filter, Eye, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";

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
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | AjuanStatus>("all");
  const [page, setPage] = useState(1);
  const { data: ajuanData = [], isLoading } = useAjuanList();

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
        title="Ajuan Anggaran"
        description="Kelola seluruh ajuan anggaran dari setiap unit pesantren"
        actions={
          <>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold shadow-soft hover:bg-secondary">
              <Download className="h-4 w-4" /> Export
            </button>
            <Link to="/ajuan/baru" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Buat Ajuan
            </Link>
          </>
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
                    <Link to="/ajuan/$id" params={{ id: a.id }} className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-semibold hover:bg-secondary">
                      <Eye className="h-3.5 w-3.5" /> Detail
                    </Link>
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
