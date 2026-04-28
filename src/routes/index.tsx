import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/utils";
import { useAjuanList, useAuditLog, usePencairan, type Ajuan, type AuditLog } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { ArrowUpRight, FileText, Wallet, Clock, CheckCircle2, XCircle, TrendingUp, Plus, Send, AlertCircle, History, BarChart3 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — E-Budgeting Pesantren Raudhatussalam" }] }),
  component: DashboardPage,
});

function DashboardAdmin() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const { role, profile } = useAuth();
  const { data: ajuanRaw = [], isLoading } = useAjuanList();
  const { data: auditRaw = [] } = useAuditLog(undefined, { enabled: role === "admin" });
  const ajuan: Ajuan[] = Array.isArray(ajuanRaw) ? ajuanRaw : [];
  const audit: AuditLog[] = Array.isArray(auditRaw) ? auditRaw : [];

  const stats = useMemo(() => {
    const getStats = (status: string) => {
      const filtered = ajuan.filter(a => a.status === status);
      return {
        count: filtered.length,
        total: filtered.reduce((s, a) => s + Number(a.total || 0), 0)
      };
    };

    const totalNilaiDisetujui = ajuan
      .filter(a => a.status === "disetujui" || a.status === "dicairkan")
      .reduce((s, a) => s + Number(a.total || 0), 0);

    return {
      total: { count: ajuan.length, total: ajuan.reduce((s, a) => s + Number(a.total || 0), 0) },
      menunggu: getStats("menunggu"),
      disetujui: getStats("disetujui"),
      dicairkan: getStats("dicairkan"),
      ditolak: getStats("ditolak"),
      totalNilaiDisetujui,
    };
  }, [ajuan]);

  const grafikBulanan = useMemo(() => {
    const map = new Map<string, { bulan: string; ajuan: number; dicairkan: number }>();
    ajuan.forEach(a => {
      const d = new Date(a.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "short" });
      const cur = map.get(key) ?? { bulan: label, ajuan: 0, dicairkan: 0 };
      cur.ajuan += 1;
      if (a.status === "dicairkan") cur.dicairkan += 1;
      map.set(key, cur);
    });
    const result = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
    return result.length > 0 ? result.slice(-6) : [{ bulan: "—", ajuan: 0, dicairkan: 0 }];
  }, [ajuan]);

  const grafikInstansi = useMemo(() => {
    const map = new Map<string, number>();
    ajuan.filter(a => a.status === "disetujui" || a.status === "dicairkan").forEach(a => {
      map.set(a.instansi, (map.get(a.instansi) ?? 0) + Number(a.total || 0));
    });
    return Array.from(map.entries())
      .map(([instansi, nilai]) => ({ instansi, nilai }))
      .sort((a, b) => b.nilai - a.nilai)
      .slice(0, 5);
  }, [ajuan]);

  const cards = [
    { label: "Total Pengajuan", stats: stats.total, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Menunggu", stats: stats.menunggu, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Disetujui", stats: stats.disetujui, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Dicairkan", stats: stats.dicairkan, icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Ditolak", stats: stats.ditolak, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <>
      <PageHeader
        title={`Assalamu'alaikum, ${profile?.nama_lengkap ?? "Admin"}`}
        description="Ringkasan aktivitas keuangan dan anggaran pesantren hari ini."
        actions={
          <div className="flex gap-2">
            <Link to="/ajuan/baru" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:scale-105 active:scale-95">
              <Plus className="h-4 w-4" /> Buat Ajuan Baru
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(s => (
          <div key={s.label} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-elevated">
            <div className="flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.bg}`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <span className="flex h-6 items-center gap-1 rounded-full bg-emerald-500/10 px-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                <TrendingUp className="h-3 w-3" /> Live
              </span>
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-black tracking-tight">{isLoading ? "---" : s.stats.count}</p>
                <p className="text-xs font-bold text-muted-foreground">Berkas</p>
              </div>
              <p className="mt-1 text-xs font-bold text-primary truncate">
                {isLoading ? "Memuat..." : formatRupiah(s.stats.total)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground shadow-elevated">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80">Total Anggaran Terpakai (Dicairkan/Disetujui)</p>
            <p className="mt-2 text-4xl font-black tracking-tighter md:text-5xl">{formatRupiah(stats.totalNilaiDisetujui)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
            <p className="text-xs font-bold opacity-80">Periode Anggaran Aktif</p>
            <p className="text-lg font-black italic">2025 / 2026</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Tren Ajuan & Pencairan</h3>
              <p className="text-xs text-muted-foreground">Per bulan</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Ajuan</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-info" />Dicairkan</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={grafikBulanan}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="ajuan" stroke="#10b981" strokeWidth={2.5} fill="url(#g1)" />
                  <Area type="monotone" dataKey="dicairkan" stroke="#3b82f6" strokeWidth={2.5} fill="url(#g2)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-semibold">Anggaran per Bidang</h3>
          <p className="text-xs text-muted-foreground">Distribusi nilai disetujui</p>
          <div className="mt-4 h-[300px] w-full">
            {grafikInstansi.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Belum ada data</div>
            ) : (
              isMounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={grafikInstansi} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="instansi" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip formatter={(v) => formatRupiah(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Bar dataKey="nilai" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Aktivitas Terbaru</h3>
            <Link to="/audit" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Lihat semua <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
          {audit.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
          ) : (
            <ul className="space-y-3">
              {audit.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/60">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {(a.user_nama ?? "U").split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{a.user_nama ?? "Sistem"}</span>{" "}
                      <span className="text-muted-foreground">{a.aksi} pada {a.modul}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("id-ID")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Ajuan Terbaru</h3>
            <Link to="/ajuan" className="text-xs font-semibold text-primary hover:underline">Semua</Link>
          </div>
          {ajuan.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada ajuan.</p>
          ) : (
            <ul className="space-y-2.5">
              {ajuan.slice(0, 4).map(a => (
                <Link key={a.id} to="/ajuan/$id" params={{ id: a.id }} className="block rounded-lg border border-border p-3 transition-all hover:border-primary/40 hover:bg-secondary/40">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-mono font-semibold text-muted-foreground">{a.kode}</p>
                    <StatusBadge className={statusBadgeClass[a.status]}>{statusLabel[a.status]}</StatusBadge>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold">{a.judul}</p>
                  <p className="mt-0.5 text-xs text-primary">{formatRupiah(Number(a.total))}</p>
                </Link>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function DashboardApprover() {
  const { profile } = useAuth();
  const { data: ajuanRaw = [], isLoading } = useAjuanList();
  const ajuan: Ajuan[] = Array.isArray(ajuanRaw) ? ajuanRaw : [];

  const stats = useMemo(() => {
    const menunggu = ajuan.filter(a => a.status === "menunggu");
    const disetujui = ajuan.filter(a => a.status === "disetujui").length;
    const ditolak = ajuan.filter(a => a.status === "ditolak").length;
    const totalNilai = ajuan
      .filter(a => a.status === "disetujui" || a.status === "dicairkan")
      .reduce((s, a) => s + Number(a.total || 0), 0);

    return {
      menunggu: { count: menunggu.length, total: menunggu.reduce((s, a) => s + Number(a.total || 0), 0) },
      disetujui,
      ditolak,
      totalNilai
    };
  }, [ajuan]);

  const grafikInstansi = useMemo(() => {
    const map = new Map<string, number>();
    ajuan.filter(a => a.status === "disetujui" || a.status === "dicairkan").forEach(a => {
      map.set(a.instansi, (map.get(a.instansi) ?? 0) + Number(a.total || 0));
    });
    return Array.from(map.entries())
      .map(([instansi, nilai]) => ({ instansi, nilai }))
      .sort((a, b) => b.nilai - a.nilai)
      .slice(0, 5);
  }, [ajuan]);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`Assalamu'alaikum, ${profile?.nama_lengkap ?? "Pimpinan"}`}
        description="Pantau dan tinjau ajuan anggaran yang masuk untuk persetujuan."
        actions={
          <Link to="/approval" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:scale-105 active:scale-95">
            <CheckCircle2 className="h-5 w-5" /> Mulai Persetujuan
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card Menunggu - High Contrast */}
        <div className="group relative overflow-hidden rounded-[2rem] border-2 border-emerald-500/20 bg-white p-7 shadow-soft transition-all hover:border-emerald-500/40 hover:shadow-elevated">
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Clock className="h-7 w-7" />
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">Urgent</span>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-slate-500">Antrean Persetujuan</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-5xl font-black tracking-tight text-slate-900">{isLoading ? "..." : stats.menunggu.count}</p>
              <p className="text-sm font-bold text-slate-400">Berkas</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-emerald-50 p-3">
            <span className="text-xs font-bold text-emerald-700">Total Nilai</span>
            <span className="text-sm font-black text-emerald-800">{formatRupiah(stats.menunggu.total)}</span>
          </div>
        </div>

        {/* Card Disetujui */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-7 shadow-soft transition-all hover:shadow-elevated">
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              <CheckCircle2 className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-slate-500">Total Disetujui</p>
            <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">{isLoading ? "..." : stats.disetujui}</p>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-400">
            Nilai Terserap: <span className="font-bold text-blue-600">{formatRupiah(stats.totalNilai)}</span>
          </p>
        </div>

        {/* Card Ditolak */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-7 shadow-soft transition-all hover:shadow-elevated">
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <XCircle className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-slate-500">Total Ditolak</p>
            <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">{isLoading ? "..." : stats.ditolak}</p>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-400">Berdasarkan kebijakan anggaran</p>
        </div>

        {/* Card Efisiensi */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-border bg-slate-900 p-7 shadow-soft text-white transition-all hover:shadow-2xl hover:shadow-slate-900/20">
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-emerald-400 backdrop-blur-sm">
              <TrendingUp className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-slate-400">Tingkat Persetujuan</p>
            <p className="mt-2 text-4xl font-black tracking-tight">
              {stats.disetujui + stats.ditolak > 0 
                ? Math.round((stats.disetujui / (stats.disetujui + stats.ditolak)) * 100) 
                : 0}%
            </p>
          </div>
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000" 
              style={{ width: `${stats.disetujui + stats.ditolak > 0 ? (stats.disetujui / (stats.disetujui + stats.ditolak)) * 100 : 0}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Grafik Penyerapan - Column Span 3 */}
        <div className="lg:col-span-3 rounded-[2rem] border border-border bg-card p-8 shadow-soft">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Penyerapan per Bidang</h3>
              <p className="text-xs text-slate-500">5 Bidang dengan penyerapan dana tertinggi</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          
          <div className="h-[300px]">
            {grafikInstansi.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 italic">
                <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
                <p>Belum ada data penyerapan</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={grafikInstansi} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="instansi" tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(v) => formatRupiah(Number(v))} 
                    contentStyle={{ borderRadius: 16, border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: 12, fontWeight: 600 }} 
                  />
                  <Bar dataKey="nilai" fill="#10b981" radius={[0, 8, 8, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Daftar Antrean - Column Span 2 */}
        <div className="lg:col-span-2 rounded-[2rem] border border-border bg-card p-8 shadow-soft flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Antrean Terbaru</h3>
            <Link to="/approval" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
              Lihat Semua <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          
          <div className="flex-1">
            {stats.menunggu.count === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 py-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-200 mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="text-sm">Semua ajuan telah diproses.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ajuan.filter(a => a.status === "menunggu").slice(0, 4).map(a => (
                  <Link 
                    key={a.id} 
                    to="/ajuan/$id" 
                    params={{ id: a.id }} 
                    className="group block rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold text-slate-800 group-hover:text-emerald-900">{a.judul}</p>
                      <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[11px] font-bold text-slate-500">{a.instansi}</p>
                      </div>
                      <p className="text-xs font-black text-slate-900">{formatRupiah(Number(a.total))}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardAdministrasi() {
  const { profile } = useAuth();
  const { data: ajuanRaw = [], isLoading: loadingAjuan } = useAjuanList();
  const { data: historyRaw = [], isLoading: loadingHistory } = usePencairan();
  const ajuan: Ajuan[] = Array.isArray(ajuanRaw) ? ajuanRaw : [];
  const history = Array.isArray(historyRaw) ? historyRaw : [];

  const stats = useMemo(() => {
    const acc = ajuan.filter(a => a.status === "disetujui");
    const disbursed = ajuan.filter(a => a.status === "dicairkan");
    const totalDisbursed = history.reduce((sum, h) => sum + Number(h.jumlah), 0);
    const pendingDisburseAmount = acc.reduce((sum, a) => sum + Number(a.total), 0);

    return {
      accCount: acc.length,
      disbursedCount: disbursed.length,
      totalDisbursed,
      pendingDisburseAmount
    };
  }, [ajuan, history]);

  const disburseTrend = useMemo(() => {
    const map = new Map<string, number>();
    history.slice(-14).forEach(h => {
      const d = new Date(h.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
      map.set(d, (map.get(d) ?? 0) + Number(h.jumlah));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [history]);

  return (
    <>
      <div className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900 p-8 text-white shadow-elevated">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Keuangan & Administrasi
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Ahlan wa Sahlan, <span className="text-blue-400">{profile?.nama_lengkap ?? "Bagian Keuangan"}</span>
            </h2>
            <p className="mt-2 text-slate-400 max-w-xl text-sm leading-relaxed">
              Anda memiliki <b>{stats.accCount} ajuan</b> yang sudah disetujui dan siap dicairkan hari ini. 
              Total arus kas keluar tercatat sebesar <b>{formatRupiah(stats.totalDisbursed)}</b>.
            </p>
          </div>
          <div className="flex gap-4">
             <Link to="/pencairan" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-500 hover:scale-105 active:scale-95">
               <Wallet className="h-5 w-5" /> Proses Pencairan
             </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft hover:shadow-elevated transition-all">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Arus Kas Keluar</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{formatRupiah(stats.totalDisbursed)}</p>
          <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-blue-500" style={{ width: '100%' }} />
          </div>
        </div>
        
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft hover:shadow-elevated transition-all">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Antrean Dana (ACC)</p>
          <p className="mt-2 text-3xl font-black text-amber-600">{formatRupiah(stats.pendingDisburseAmount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Segera serahkan dana ke pengaju</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft hover:shadow-elevated transition-all">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Efisiensi Laporan</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{Math.round((ajuan.filter(a => a.has_laporan).length / (stats.disbursedCount || 1)) * 100)}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Persentase laporan yang sudah masuk</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500" /> Tren Pencairan Dana</h3>
          </div>
          <div className="h-64">
            {disburseTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground italic">Belum ada data transaksi</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={disburseTrend}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip formatter={(v) => formatRupiah(Number(v))} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h3 className="mb-4 font-bold flex items-center gap-2"><History className="h-5 w-5 text-slate-500" /> Transaksi Terakhir</h3>
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground italic">Belum ada transaksi.</div>
            ) : (
              history.slice(0, 5).map(h => (
                <div key={h.id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${h.metode === 'tunai' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{h.judul}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{h.metode} • {new Date(h.created_at).toLocaleDateString("id-ID")}</p>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatRupiah(Number(h.jumlah))}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardPengaju() {
  const { profile } = useAuth();
  const { data: ajuanRaw = [], isLoading } = useAjuanList();
  const { data: historyRaw = [] } = usePencairan();
  const ajuan: Ajuan[] = Array.isArray(ajuanRaw) ? ajuanRaw : [];
  const history = Array.isArray(historyRaw) ? historyRaw : [];

  const pendingReport = useMemo(() => {
    return ajuan.find(a => a.status === 'dicairkan' && !a.has_laporan);
  }, [ajuan]);

  const stats = useMemo(() => {
    return {
      total: ajuan.length,
      menunggu: ajuan.filter(a => a.status === "menunggu").length,
      disetujui: ajuan.filter(a => a.status === "disetujui" || a.status === "dicairkan").length,
      ditolak: ajuan.filter(a => a.status === "ditolak").length,
    };
  }, [ajuan]);

  return (
    <>
      <PageHeader
        title={`Assalamu'alaikum, ${profile?.nama_lengkap ?? "Pengaju"}`}
        description="Pantau status ajuan anggaran yang Anda kirimkan."
      />

      {pendingReport && (
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border-2 border-amber-500/20 bg-amber-500/5 p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-soft">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">Perhatian: Laporan Tertunda</h4>
              <p className="text-sm text-amber-800/80">Anda memiliki anggaran <b>{pendingReport.kode}</b> yang sudah dicairkan namun belum dilaporkan.</p>
            </div>
          </div>
          <Link 
            to="/laporan/baru" 
            search={{ ajuanId: pendingReport.id }}
            className="whitespace-nowrap rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-amber-600 transition-all"
          >
            Buat Laporan Sekarang
          </Link>
        </div>
      )}

      <div className="mb-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground shadow-elevated text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black">Butuh Anggaran Baru?</h2>
          <p className="mt-2 text-primary-100 opacity-90 max-w-md text-sm leading-relaxed">
            Ajukan kebutuhan anggaran bidang Anda dengan mengisi formulir secara detail. Ajuan akan langsung diteruskan ke Pimpinan.
          </p>
        </div>
        <Link to="/ajuan/baru" className="whitespace-nowrap inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-bold text-primary shadow-lg transition-all hover:scale-105 active:scale-95">
          <Plus className="h-5 w-5" /> Buat Ajuan Baru
        </Link>
      </div>

      <h3 className="mb-4 text-lg font-bold text-foreground">Ringkasan Ajuan Anda</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
          <p className="text-3xl font-black text-indigo-600">{isLoading ? "-" : stats.total}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Ajuan</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
          <p className="text-3xl font-black text-amber-500">{isLoading ? "-" : stats.menunggu}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menunggu</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
          <p className="text-3xl font-black text-emerald-500">{isLoading ? "-" : stats.disetujui}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disetujui</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
          <p className="text-3xl font-black text-rose-500">{isLoading ? "-" : stats.ditolak}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ditolak</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 max-w-5xl">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Riwayat Pengajuan</h3>
            <Link to="/ajuan" className="text-xs font-semibold text-primary hover:underline">Lihat Semua</Link>
          </div>
          {ajuan.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada ajuan.</p>
          ) : (
            <ul className="space-y-3">
              {ajuan.slice(0, 5).map(a => (
                <Link key={a.id} to="/ajuan/$id" params={{ id: a.id }} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/40 hover:bg-secondary/40">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.judul}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-primary">{formatRupiah(Number(a.total))}</p>
                    <StatusBadge className={`mt-1 ${statusBadgeClass[a.status]}`}>{statusLabel[a.status]}</StatusBadge>
                  </div>
                </Link>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Dana Cair Terbaru</h3>
            <Link to="/pencairan" className="text-xs font-semibold text-blue-600 hover:underline">Lihat Detail</Link>
          </div>
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada dana cair.</p>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map(h => (
                <div key={h.id} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{h.judul}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${h.metode === 'tunai' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {h.metode}
                      </span>
                      <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString("id-ID")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{formatRupiah(Number(h.jumlah))}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Sudah Cair</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DashboardPage() {
  const { role } = useAuth();
  if (role === "admin") return <DashboardAdmin />;
  if (role === "approver") return <DashboardApprover />;
  if (role === "administrasi") return <DashboardAdministrasi />;
  return <DashboardPengaju />;
}
