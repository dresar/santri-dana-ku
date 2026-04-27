import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/utils";
import { useAjuanList } from "@/lib/queries";
import { Eye, Loader2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/approval")({
  head: () => ({ meta: [{ title: "Approval — E-Budgeting Pesantren" }] }),
  component: ApprovalPage,
});

type ApprovalTab = "menunggu" | "disetujui" | "ditolak" | "dicairkan" | "selesai";
const tabs: { value: ApprovalTab; label: string }[] = [
  { value: "menunggu", label: "Menunggu" },
  { value: "disetujui", label: "Disetujui" },
  { value: "dicairkan", label: "Dicairkan" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak", label: "Ditolak" },
];

function ApprovalPage() {
  const [tab, setTab] = useState<ApprovalTab>("menunggu");
  const { data: ajuanData = [], isLoading } = useAjuanList();

  const list = useMemo(() => ajuanData.filter(a => a.status === tab), [tab, ajuanData]);
  const counts = {
    menunggu: ajuanData.filter(a => a.status === "menunggu").length,
    disetujui: ajuanData.filter(a => a.status === "disetujui").length,
    dicairkan: ajuanData.filter(a => a.status === "dicairkan").length,
    selesai: ajuanData.filter(a => a.status === "selesai").length,
    ditolak: ajuanData.filter(a => a.status === "ditolak").length,
  };


  return (
    <>
      <PageHeader title="Approval Ajuan" description="Tinjau dan setujui ajuan anggaran yang masuk" />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center gap-1 border-b border-border p-2">
          {tabs.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${tab === t.value ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-secondary"}`}>
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === t.value ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{counts[t.value]}</span>
            </button>
          ))}
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Tidak ada ajuan pada status ini.</div>
          ) : list.map(a => (
            <div key={a.id} className="p-5 transition-colors hover:bg-secondary/40">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{a.kode}</span>
                    <StatusBadge className={statusBadgeClass[a.status]}>{statusLabel[a.status]}</StatusBadge>
                  </div>
                  <h3 className="mt-1.5 font-bold">{a.judul}</h3>
                  <p className="text-sm text-muted-foreground">{a.pengaju_nama ?? "—"} • {a.instansi}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{formatRupiah(Number(a.total))}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {tab === "menunggu" ? (
                    <Link to="/ajuan/$id" params={{ id: a.id }} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105 shadow-sm">
                      Tinjau & Proses <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link to="/ajuan/$id" params={{ id: a.id }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-secondary">
                      <Eye className="h-4 w-4" /> Detail
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </>
  );
}
