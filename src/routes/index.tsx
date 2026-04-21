import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/utils";
import { useAjuanList, useAuditLog } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { ArrowUpRight, FileText, Wallet, Clock, CheckCircle2, XCircle, TrendingUp, Plus, Send } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — E-Budgeting Pesantren Raudhatussalam" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile } = useAuth();
  const { data: ajuan = [], isLoading } = useAjuanList();
  const { data: audit = [] } = useAuditLog();

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
          <div className="h-72 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" aspect={2.5}>
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
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-semibold">Anggaran per Bidang</h3>
          <p className="text-xs text-muted-foreground">Distribusi nilai disetujui</p>
          <div className="mt-4 h-72">
            {grafikInstansi.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" aspect={1.2}>
                <BarChart data={grafikInstansi} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="instansi" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(v) => formatRupiah(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="nilai" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
