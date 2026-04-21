import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/utils";
import { useAjuanList, type AjuanStatus } from "@/lib/queries";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Download, FileText, FileSpreadsheet, FileType2, ChevronDown, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/laporan")({
  head: () => ({ meta: [{ title: "Laporan Keuangan — E-Budgeting Pesantren" }] }),
  component: LaporanPage,
});

function LaporanPage() {
  const [exportOpen, setExportOpen] = useState(false);
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState("2025-12-31");
  const [status, setStatus] = useState<"all" | AjuanStatus>("all");
  const { data: ajuanData = [] } = useAjuanList();

  const filtered = useMemo(() => ajuanData.filter(a => {
    if (status !== "all" && a.status !== status) return false;
    const d = new Date(a.created_at);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + "T23:59:59")) return false;
    return true;
  }), [ajuanData, status, from, to]);
  const total = filtered.reduce((s, a) => s + Number(a.total), 0);

  const grafik = useMemo(() => {
    const map = new Map<string, { bulan: string; ajuan: number; disetujui: number; dicairkan: number }>();
    ajuanData.forEach(a => {
      const d = new Date(a.created_at);
      const key = d.toLocaleDateString("id-ID", { month: "short" });
      const cur = map.get(key) ?? { bulan: key, ajuan: 0, disetujui: 0, dicairkan: 0 };
      cur.ajuan += 1;
      if (a.status === "disetujui") cur.disetujui += 1;
      if (a.status === "dicairkan") cur.dicairkan += 1;
      map.set(key, cur);
    });
    return Array.from(map.values());
  }, [ajuanData]);

  return (
    <>
      <PageHeader title="Laporan Keuangan" description="Rekap dan analisa pemakaian anggaran pesantren"
        actions={
          <div className="relative">
            <button onClick={() => setExportOpen(v => !v)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
              <Download className="h-4 w-4" /> Export <ChevronDown className="h-4 w-4" />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-52 animate-fade-in rounded-xl border border-border bg-popover p-1.5 shadow-elevated">
                  <ExportItem icon={FileSpreadsheet} label="Export Excel (.xlsx)" />
                  <ExportItem icon={FileType2} label="Export CSV (.csv)" />
                  <ExportItem icon={FileText} label="Export PDF (.pdf)" />
                </div>
              </>
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total Anggaran" value={formatRupiah(total)} />
        <SummaryCard label="Jumlah Ajuan" value={`${filtered.length} ajuan`} />
        <SummaryCard label="Periode" value={`${from} → ${to}`} />
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="mb-4 font-semibold">Realisasi Anggaran Bulanan</h3>
        <div className="h-72 w-full min-h-[300px]">
          {grafik.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data</div> : (
            <ResponsiveContainer width="100%" height="100%" aspect={3}>
              <BarChart data={grafik}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 240)" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 240)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ajuan" fill="oklch(0.85 0.03 240)" radius={[6, 6, 0, 0]} name="Ajuan" />
                <Bar dataKey="disetujui" fill="oklch(0.58 0.15 162)" radius={[6, 6, 0, 0]} name="Disetujui" />
                <Bar dataKey="dicairkan" fill="oklch(0.65 0.14 240)" radius={[6, 6, 0, 0]} name="Dicairkan" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-end">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dari</label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sampai</label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as "all" | AjuanStatus)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring">
              <option value="all">Semua status</option>
              <option value="menunggu">Menunggu</option>
              <option value="disetujui">Disetujui</option>
              <option value="ditolak">Ditolak</option>
              <option value="dicairkan">Dicairkan</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Kode</th>
                <th className="px-4 py-3 font-semibold">Judul</th>
                <th className="px-4 py-3 font-semibold">Instansi</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-right font-semibold">Nilai</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Tidak ada data sesuai filter.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{a.kode}</td>
                  <td className="px-4 py-3 font-medium">{a.judul}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.instansi}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatRupiah(Number(a.total))}</td>
                  <td className="px-4 py-3"><StatusBadge className={statusBadgeClass[a.status]}>{statusLabel[a.status]}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary-soft/40">
                <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold">Total</td>
                <td className="px-4 py-3 text-right text-base font-bold text-primary">{formatRupiah(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
function ExportItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-secondary">
      <Icon className="h-4 w-4 text-primary" /> {label}
    </button>
  );
}
