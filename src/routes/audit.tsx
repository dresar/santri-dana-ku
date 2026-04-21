import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { auditLogData } from "@/lib/dummy-data";
import { Search, Filter, Download } from "lucide-react";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "Audit Log — E-Budgeting Pesantren" }] }),
  component: AuditPage,
});

const aksiColor: Record<string, string> = {
  CREATE: "bg-info/10 text-info border-info/30",
  UPDATE: "bg-warning/15 text-warning-foreground border-warning/30",
  APPROVE: "bg-primary/12 text-primary border-primary/25",
  REJECT: "bg-destructive/12 text-destructive border-destructive/25",
  DISBURSE: "bg-success/10 text-success border-success/30",
  LOGIN: "bg-secondary text-muted-foreground border-border",
  EXPORT: "bg-accent text-accent-foreground border-border",
};

function AuditPage() {
  const [q, setQ] = useState("");
  const [aksi, setAksi] = useState("all");
  const [modul, setModul] = useState("all");

  const filtered = auditLogData.filter(a =>
    (aksi === "all" || a.aksi === aksi) &&
    (modul === "all" || a.modul === modul) &&
    (!q || `${a.aktor} ${a.detail} ${a.ip}`.toLowerCase().includes(q.toLowerCase()))
  );

  const allAksi = Array.from(new Set(auditLogData.map(a => a.aksi)));
  const allModul = Array.from(new Set(auditLogData.map(a => a.modul)));

  return (
    <AppLayout>
      <PageHeader title="Audit Log" description="Riwayat seluruh aktivitas pengguna pada sistem"
        actions={<button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary"><Download className="h-4 w-4" /> Export Log</button>}
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <div className="relative md:max-w-xs md:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari aktivitas, aktor, atau IP..." className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring" />
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
                <th className="px-4 py-3 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Tidak ada log yang sesuai.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs">{a.waktu}</td>
                  <td className="px-4 py-3 font-semibold">{a.aktor}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${aksiColor[a.aksi] ?? "border-border bg-secondary"}`}>{a.aksi}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.modul}</td>
                  <td className="px-4 py-3">{a.detail}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border p-3 text-xs text-muted-foreground">
          {filtered.length} entri ditampilkan
        </div>
      </div>
    </AppLayout>
  );
}
