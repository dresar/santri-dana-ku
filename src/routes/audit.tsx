import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuditLog, type AuditLog } from "@/lib/queries";
import { Search, Filter, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "Audit Log — E-Budgeting Pesantren" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [q, setQ] = useState("");
  const [aksi, setAksi] = useState("all");
  const [modul, setModul] = useState("all");
  const { data: logRaw = [], isLoading } = useAuditLog();
  const log: AuditLog[] = Array.isArray(logRaw) ? logRaw : [];

  const filtered = useMemo(() => log.filter(a =>
    (aksi === "all" || a.aksi === aksi) &&
    (modul === "all" || a.modul === modul) &&
    (!q || `${a.user_nama ?? ""} ${a.aksi} ${a.modul}`.toLowerCase().includes(q.toLowerCase()))
  ), [log, q, aksi, modul]);

  const allAksi = Array.from(new Set(log.map(a => a.aksi)));
  const allModul = Array.from(new Set(log.map(a => a.modul)));

  return (
    <>
      <PageHeader title="Audit Log" description="Riwayat seluruh aktivitas pengguna pada sistem"
        actions={<button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary"><Download className="h-4 w-4" /> Export Log</button>}
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <div className="relative md:max-w-xs md:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari aktivitas..." className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={aksi} onChange={e => setAksi(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring">
              <option value="all">Semua aksi</option>
              {allAksi.map(a => <option key={a}>{a}</option>)}
            </select>
            <select value={modul} onChange={e => setModul(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring">
              <option value="all">Semua modul</option>
              {allModul.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Aktor</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
                <th className="px-4 py-3 font-semibold">Modul</th>
                <th className="px-4 py-3 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Belum ada log aktivitas.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs">{new Date(a.created_at).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 font-semibold">{a.user_nama ?? "Sistem"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-bold uppercase">{a.aksi}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.modul}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{a.detail ? JSON.stringify(a.detail) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border p-3 text-xs text-muted-foreground">{filtered.length} entri</div>
      </div>
    </>
  );
}
