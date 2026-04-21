import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/dummy-data";
import { useAjuanList, useApproval } from "@/lib/queries";
import { Check, X, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/approval")({
  head: () => ({ meta: [{ title: "Approval — E-Budgeting Pesantren" }] }),
  component: ApprovalPage,
});

type ApprovalTab = "menunggu" | "disetujui" | "ditolak";
const tabs: { value: ApprovalTab; label: string }[] = [
  { value: "menunggu", label: "Menunggu" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
];

function ApprovalPage() {
  const [tab, setTab] = useState<ApprovalTab>("menunggu");
  const [confirm, setConfirm] = useState<{ id: string; aksi: "disetujui" | "ditolak" } | null>(null);
  const [catatan, setCatatan] = useState("");
  const { data: ajuanData = [], isLoading } = useAjuanList();
  const approval = useApproval();

  const list = useMemo(() => ajuanData.filter(a => a.status === tab), [tab, ajuanData]);
  const counts = {
    menunggu: ajuanData.filter(a => a.status === "menunggu").length,
    disetujui: ajuanData.filter(a => a.status === "disetujui").length,
    ditolak: ajuanData.filter(a => a.status === "ditolak").length,
  };

  const onConfirm = async () => {
    if (!confirm) return;
    try {
      await approval.mutateAsync({ ajuanId: confirm.id, aksi: confirm.aksi, catatan: catatan || undefined });
      toast.success(confirm.aksi === "disetujui" ? "Ajuan disetujui" : "Ajuan ditolak");
      setConfirm(null); setCatatan("");
    } catch (e) {
      toast.error("Gagal", { description: (e as Error).message });
    }
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
                  <Link to="/ajuan/$id" params={{ id: a.id }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-secondary"><Eye className="h-4 w-4" /> Detail</Link>
                  {tab === "menunggu" && (
                    <>
                      <button onClick={() => setConfirm({ id: a.id, aksi: "ditolak" })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-xs font-semibold text-destructive hover:bg-destructive/15"><X className="h-4 w-4" /> Tolak</button>
                      <button onClick={() => setConfirm({ id: a.id, aksi: "disetujui" })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"><Check className="h-4 w-4" /> Setujui</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-elevated animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${confirm.aksi === "disetujui" ? "bg-primary-soft text-primary" : "bg-destructive/15 text-destructive"}`}>
              {confirm.aksi === "disetujui" ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
            </div>
            <h3 className="text-lg font-bold">{confirm.aksi === "disetujui" ? "Setujui Ajuan?" : "Tolak Ajuan?"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {confirm.aksi === "disetujui" ? "Pengaju akan menerima notifikasi dan dapat memproses pencairan." : "Pengaju akan diminta untuk merevisi ajuannya."}
            </p>
            <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={3} placeholder={confirm.aksi === "ditolak" ? "Alasan penolakan..." : "Catatan (opsional)"} className="mt-3 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-ring" />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary">Batal</button>
              <button onClick={onConfirm} disabled={approval.isPending} className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-primary-foreground ${confirm.aksi === "disetujui" ? "bg-primary hover:bg-primary/90" : "bg-destructive hover:bg-destructive/90"}`}>
                {approval.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirm.aksi === "disetujui" ? "Ya, Setujui" : "Ya, Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
