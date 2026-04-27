import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useNotifikasi, useMarkNotifRead, useMarkAllNotifRead, useDeleteNotif, type Notifikasi } from "@/lib/queries";
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle, CheckCheck, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/notifikasi")({
  head: () => ({ meta: [{ title: "Notifikasi — E-Budgeting Pesantren" }] }),
  component: NotifikasiPage,
});

const iconByJenis: Record<string, { icon: LucideIcon; cls: string }> = {
  info: { icon: Info, cls: "text-info bg-info/10" },
  sukses: { icon: CheckCircle2, cls: "text-success bg-success/10" },
  peringatan: { icon: AlertTriangle, cls: "text-warning-foreground bg-warning/15" },
  error: { icon: XCircle, cls: "text-destructive bg-destructive/10" },
};

function NotifikasiPage() {
  const { data: itemsRaw = [] } = useNotifikasi();
  const items: Notifikasi[] = Array.isArray(itemsRaw) ? itemsRaw : [];
  const markRead = useMarkNotifRead();
  const markAllRead = useMarkAllNotifRead();
  const deleteNotif = useDeleteNotif();
  const unread = items.filter(n => !n.dibaca).length;

  const markAll = () => markAllRead.mutate();

  return (
    <>
      <PageHeader title="Notifikasi" description="Kelola notifikasi Anda"
        actions={unread > 0 ? (
          <button onClick={markAll} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary">
            <CheckCheck className="h-4 w-4" /> Tandai semua dibaca
          </button>
        ) : undefined}
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada notifikasi.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map(n => {
              const meta = iconByJenis[n.tipe] ?? iconByJenis.info;
              const Icon = meta.icon;
              return (
                <li key={n.id} className={`group flex items-start gap-4 p-4 transition-colors hover:bg-secondary/40 ${!n.dibaca ? "bg-primary-soft/20" : ""}`}
                  onClick={() => !n.dibaca && markRead.mutate(n.id)}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.cls}`}><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="font-semibold">{n.judul}</p>
                      {!n.dibaca && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.pesan}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("id-ID")}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
