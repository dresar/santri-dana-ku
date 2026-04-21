import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/dummy-data";
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
    const c = (s: string) => ajuan.filter(a => a.status === s).length;
    const totalNilai = ajuan.filter(a => a.status === "disetujui" || a.status === "dicairkan").reduce((s, a) => s + Number(a.total), 0);
    return {
      total: ajuan.length, menunggu: c("menunggu"), disetujui: c("disetujui"),
      dicairkan: c("dicairkan"), ditolak: c("ditolak"), totalNilai,
    };
  }, [ajuan]);

  // Group by month for chart
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
    const arr = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
    return arr.length > 0 ? arr : [{ bulan: "—", ajuan: 0, dicairkan: 0 }];
  }, [ajuan]);

  const grafikInstansi = useMemo(() => {
    const map = new Map<string, number>();
    ajuan.filter(a => a.status === "disetujui" || a.status === "dicairkan").forEach(a => {
      map.set(a.instansi, (map.get(a.instansi) ?? 0) + Number(a.total));
    });
    return Array.from(map.entries()).map(([instansi, nilai]) => ({ instansi, nilai })).slice(0, 6);
  }, [ajuan]);

  const cards = [
    { label: "Total Ajuan", value: stats.total, icon: FileText, color: "text-foreground", bg: "bg-secondary" },
    { label: "Menunggu", value: stats.menunggu, icon: Clock, color: "text-warning-foreground", bg: "bg-warning/15" },
    { label: "Disetujui", value: stats.disetujui, icon: CheckCircle2, color: "text-primary", bg: "bg-primary/12" },
    { label: "Dicairkan", value: stats.dicairkan, icon: Wallet, color: "text-info", bg: "bg-info/12" },
    { label: "Ditolak", value: stats.ditolak, icon: XCircle, color: "text-destructive", bg: "bg-destructive/12" },
  ];

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${profile?.nama_lengkap ?? "Pengguna"}`}
        description="Ringkasan aktivitas anggaran pesantren — periode 2025/2026"
        actions={
          <>
            <Link to="/pencairan" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold shadow-soft transition-all hover:bg-secondary">
              <Send className="h-4 w-4" /> Pencairan
            </Link>
            <Link to="/ajuan/baru" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Buat Ajuan
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
        {cards.map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                <TrendingUp className="h-3 w-3" /> live
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{isLoading ? "…" : s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-elevated">
        <p className="text-xs font-medium uppercase tracking-wider opacity-80">Total nilai anggaran disetujui</p>
        <p className="mt-1 text-3xl font-bold md:text-4xl">{formatRupiah(stats.totalNilai)}</p>
        <p className="mt-1 text-sm opacity-80">Periode anggaran 2025/2026</p>
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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={grafikBulanan}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.15 162)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.58 0.15 162)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.14 240)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.65 0.14 240)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 240)" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: "oklch(0.5 0.02 250)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "oklch(0.5 0.02 250)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 240)", fontSize: 12 }} />
                <Area type="monotone" dataKey="ajuan" stroke="oklch(0.58 0.15 162)" strokeWidth={2.5} fill="url(#g1)" />
                <Area type="monotone" dataKey="dicairkan" stroke="oklch(0.65 0.14 240)" strokeWidth={2.5} fill="url(#g2)" />
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grafikInstansi} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 240)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="instansi" tick={{ fontSize: 11, fill: "oklch(0.5 0.02 250)" }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(v) => formatRupiah(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 240)", fontSize: 12 }} />
                  <Bar dataKey="nilai" fill="oklch(0.58 0.15 162)" radius={[0, 6, 6, 0]} />
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
