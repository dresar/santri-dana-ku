import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Toggle } from "./pengguna";
import { notifikasiData, type Notifikasi } from "@/lib/dummy-data";
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/notifikasi")({
  head: () => ({ meta: [{ title: "Notifikasi — E-Budgeting Pesantren" }] }),
  component: NotifikasiPage,
});

const iconByJenis: Record<Notifikasi["jenis"], { icon: any; cls: string }> = {
  info: { icon: Info, cls: "text-info bg-info/10" },
  success: { icon: CheckCircle2, cls: "text-success bg-success/10" },
  warning: { icon: AlertTriangle, cls: "text-warning-foreground bg-warning/15" },
  error: { icon: XCircle, cls: "text-destructive bg-destructive/10" },
};

const settings = [
  { key: "email_ajuan", label: "Email — Ajuan baru masuk", desc: "Kirim email saat ada ajuan baru yang membutuhkan persetujuan" },
  { key: "email_status", label: "Email — Perubahan status ajuan", desc: "Notifikasi email saat ajuan disetujui, ditolak, atau dicairkan" },
  { key: "push_realtime", label: "Push — Notifikasi real-time", desc: "Tampilkan notifikasi push di browser" },
  { key: "wa_pencairan", label: "WhatsApp — Konfirmasi pencairan", desc: "Kirim notifikasi WA saat dana telah dicairkan" },
  { key: "digest", label: "Digest harian", desc: "Ringkasan aktivitas harian dikirim setiap pagi" },
];

function NotifikasiPage() {
  const [tab, setTab] = useState<"list" | "settings">("list");
  const [items, setItems] = useState(notifikasiData);
  const [toggles, setToggles] = useState<Record<string, boolean>>({ email_ajuan: true, email_status: true, push_realtime: true, wa_pencairan: false, digest: true });
  const unread = items.filter(n => !n.dibaca).length;

  const markAll = () => setItems(prev => prev.map(n => ({ ...n, dibaca: true })));

  return (
    <AppLayout>
      <PageHeader title="Notifikasi" description="Kelola dan atur preferensi notifikasi Anda"
        actions={tab === "list" && unread > 0 && (
          <button onClick={markAll} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary">
            <CheckCheck className="h-4 w-4" /> Tandai semua dibaca
          </button>
        )}
      />

      <div className="mb-4 flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
        <button onClick={() => setTab("list")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${tab === "list" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
          Notifikasi {unread > 0 && <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">{unread}</span>}
        </button>
        <button onClick={() => setTab("settings")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${tab === "settings" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>Pengaturan</button>
      </div>

      {tab === "list" ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">Belum ada notifikasi.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map(n => {
                const { icon: Icon, cls } = iconByJenis[n.jenis];
                return (
                  <li key={n.id} className={`flex gap-4 p-4 transition-colors hover:bg-secondary/40 ${!n.dibaca ? "bg-primary-soft/20" : ""}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cls}`}><Icon className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className="font-semibold">{n.judul}</p>
                        {!n.dibaca && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.pesan}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{n.waktu}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="mb-1 font-semibold">Preferensi Notifikasi</h3>
          <p className="mb-5 text-xs text-muted-foreground">Atur jenis notifikasi yang ingin Anda terima.</p>
          <ul className="divide-y divide-border">
            {settings.map(s => (
              <li key={s.key} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <Toggle checked={!!toggles[s.key]} onChange={v => setToggles(prev => ({ ...prev, [s.key]: v }))} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppLayout>
  );
}
