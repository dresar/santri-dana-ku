import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel, reportStatusBadgeClass, reportStatusLabel } from "@/lib/utils";
import { useAjuanList, useLaporanList, useSettings, type StatusAjuan, type Ajuan } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Download, FileText, FileSpreadsheet, FileType2, ChevronDown, Calendar, ImageIcon, Plus } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/laporan/")({
  head: () => ({ meta: [{ title: "Laporan Keuangan — E-Budgeting Pesantren" }] }),
  component: LaporanPage,
});

function LaporanPage() {
  const router = useRouter();
  const [exportOpen, setExportOpen] = useState(false);
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState("2025-12-31");
  const [status, setStatus] = useState<"all" | StatusAjuan>("all");
  const { role, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"summary" | "usage">("summary");
  const [isMounted, setIsMounted] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  
  useEffect(() => setIsMounted(true), []);
  
  const { data: ajuanRaw = [] } = useAjuanList();
  const ajuanData: Ajuan[] = Array.isArray(ajuanRaw) ? ajuanRaw : [];
  
  const { data: usageRaw } = useLaporanList();
  const usageData = Array.isArray(usageRaw) ? usageRaw : (usageRaw as any)?.data ?? [];

  const pendingReports = useMemo(() => {
    if (role !== 'pengaju') return [];
    return ajuanData.filter(a => (a.status === 'dicairkan' || a.status === 'disetujui') && !a.has_laporan);
  }, [ajuanData, role]);

  const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk di-export");
      return;
    }

    if (type === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("LAPORAN REKAPITULASI ANGGARAN", 105, 15, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Periode: ${from} s/d ${to}`, 105, 22, { align: "center" });
      
      const tableData = filtered.map(a => [
        a.kode,
        a.judul,
        a.status.toUpperCase(),
        formatRupiah(Number(a.total)),
        new Date(a.created_at).toLocaleDateString("id-ID")
      ]);
      
      autoTable(doc, {
        head: [["Kode", "Judul", "Status", "Total", "Tanggal"]],
        body: tableData,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'center' }
        }
      });
      
      doc.save(`Laporan_Budget_${new Date().getTime()}.pdf`);
    } else {
      // CSV and Excel (as CSV)
      const headers = ["Kode", "Judul", "Status", "Total", "Tanggal"];
      const rows = filtered.map(a => [
        `"${a.kode}"`,
        `"${a.judul}"`,
        `"${a.status}"`,
        a.total,
        `"${new Date(a.created_at).toLocaleDateString("id-ID")}"`
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Laporan_Budget_${new Date().getTime()}.${type === 'excel' ? 'xlsx' : 'csv'}`);
      link.click();
      URL.revokeObjectURL(url);
    }
    setExportOpen(false);
    toast.success(`Laporan berhasil di-export ke ${type.toUpperCase()}`);
  };

  const filtered = useMemo(() => ajuanData.filter(a => {
    if (status !== "all" && a.status !== status) return false;
    if (!a.created_at) return true;
    const dStr = a.created_at.includes('T') ? a.created_at.split('T')[0] : a.created_at.split(' ')[0];
    if (from && dStr < from) return false;
    if (to && dStr > to) return false;
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
      <PageHeader 
        title={role === 'pengaju' ? "Laporan Saya" : "Laporan Keuangan"} 
        description={role === 'pengaju' ? "Rekap penggunaan anggaran yang Anda ajukan" : "Rekap dan analisa pemakaian anggaran pesantren"}
        actions={
          <div className="flex gap-2">
            {role === 'pengaju' && (
              <div className="relative">
                <button 
                  onClick={() => {
                    if (pendingReports.length === 0) {
                      toast.info("Tidak ada anggaran yang perlu dilaporkan.");
                    } else if (pendingReports.length === 1) {
                      router.navigate({ to: "/laporan/baru", search: { ajuanId: pendingReports[0].id } });
                    } else {
                      setShowSelector(!showSelector);
                    }
                  }}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-soft transition-all ${pendingReports.length > 0 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}
                >
                  <Plus className="h-4 w-4" /> Buat Laporan Baru
                </button>
                {showSelector && pendingReports.length > 1 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSelector(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-64 animate-fade-in rounded-xl border border-border bg-popover p-1.5 shadow-elevated">
                      <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase">Pilih Anggaran</p>
                      {pendingReports.map(a => (
                        <button 
                          key={a.id} 
                          onClick={() => { setShowSelector(false); router.navigate({ to: "/laporan/baru", search: { ajuanId: a.id } }); }}
                          className="flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-secondary"
                        >
                          <span className="text-xs font-bold">{a.kode}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">{a.judul}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {(role === 'admin' || role === 'administrasi') && (
              <div className="relative">
                <button onClick={() => setExportOpen(v => !v)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary">
                  <Download className="h-4 w-4" /> Export <ChevronDown className="h-4 w-4" />
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-52 animate-fade-in rounded-xl border border-border bg-popover p-1.5 shadow-elevated">
                      <ExportItem icon={FileSpreadsheet} label="Export Excel (.xlsx)" onClick={() => handleExport('excel')} />
                      <ExportItem icon={FileType2} label="Export CSV (.csv)" onClick={() => handleExport('csv')} />
                      <ExportItem icon={FileText} label="Export PDF (.pdf)" onClick={() => handleExport('pdf')} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        }
      />

      {role === 'pengaju' && pendingReports.length > 0 && (
        <div className="mb-8 rounded-3xl border-2 border-primary/20 bg-primary/5 p-6 shadow-soft animate-fade-in">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Anggaran Menunggu Laporan</h3>
              <p className="text-sm text-muted-foreground">Selesaikan laporan penggunaan dana untuk mencairkan blokir pengajuan baru.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingReports.map(a => (
              <div key={a.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase">{a.kode}</p>
                  <p className="mt-1 font-bold text-sm line-clamp-1">{a.judul}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatRupiah(Number(a.total))}</p>
                </div>
                <Link 
                  to="/laporan/baru" 
                  search={{ ajuanId: a.id }}
                  className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  <FileText className="h-4 w-4" /> Buat Laporan Penggunaan
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1 shadow-soft max-w-md">
        <button 
          onClick={() => setActiveTab("summary")}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${activeTab === "summary" ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-secondary"}`}
        >
          Ringkasan Finansial
        </button>
        <button 
          onClick={() => setActiveTab("usage")}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${activeTab === "usage" ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-secondary"}`}
        >
          Laporan Penggunaan Dana
        </button>
      </div>

      {activeTab === "summary" ? (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <SummaryCard 
              label={role === 'pengaju' ? "Total Anggaran" : "Total Anggaran"} 
              value={formatRupiah(ajuanData.reduce((s, a) => s + Number(a.total), 0))} 
              subValue="Semua pengajuan aktif"
            />
            <SummaryCard 
              label="Jumlah Ajuan" 
              value={`${ajuanData.length} ajuan`} 
              subValue={pendingReports.length > 0 ? `${pendingReports.length} butuh laporan` : "Semua sudah dilaporkan"}
            />
            <SummaryCard 
              label="Range Laporan" 
              value={`${from} → ${to}`} 
              subValue="Periode data di bawah"
            />
          </div>

          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="mb-4 font-semibold">
              {role === 'pengaju' ? "Statistik Ajuan Saya" : "Realisasi Anggaran Bulanan"}
            </h3>
            <div className="h-72 w-full min-h-[300px]">
              {grafik.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data</div> : (
                isMounted && (
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
                )
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
                <select value={status} onChange={e => setStatus(e.target.value as "all" | StatusAjuan)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring">
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
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Ajuan</th>
                  <th className="px-4 py-3 font-semibold">Pengaju</th>
                  <th className="px-4 py-3 text-right font-semibold">Anggaran</th>
                  <th className="px-4 py-3 text-right font-semibold">Terpakai</th>
                  <th className="px-4 py-3 text-right font-semibold">Sisa</th>
                  <th className="px-4 py-3 font-semibold text-center">Nota</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {usageData.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">Belum ada laporan penggunaan dana.</td></tr>
                ) : usageData.map((u: any) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <p className="font-bold text-xs font-mono">{u.ajuan_kode}</p>
                      <p className="truncate max-w-[200px] text-xs font-medium">{u.ajuan_judul}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{u.pengaju_nama}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-xs">{formatRupiah(Number(u.total_anggaran))}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-xs text-primary">{formatRupiah(Number(u.total_digunakan))}</td>
                    <td className={`px-4 py-3 text-right font-bold tabular-nums text-xs ${Number(u.sisa_dana) < 0 ? 'text-destructive' : 'text-emerald-600'}`}>{formatRupiah(Number(u.sisa_dana))}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">
                        <ImageIcon className="h-3 w-3" /> {u.foto_nota_urls?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge className={reportStatusBadgeClass[u.status ?? "menunggu"]}>
                        {reportStatusLabel[u.status ?? "menunggu"]}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/laporan/$id" params={{ id: u.id }} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-[11px] font-bold text-primary hover:bg-primary/20">
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black text-primary">{value}</p>
      {subValue && <p className="mt-1 text-[10px] font-medium text-muted-foreground">{subValue}</p>}
    </div>
  );
}

function ExportItem({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-secondary">
      <Icon className="h-4 w-4 text-primary" /> {label}
    </button>
  );
}
