import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, Toast } from "@/components/PageHeader";
import { Toggle } from "./pengguna";
import { Building2, Shield, Plug, Palette, Save, Sun, Moon, Upload } from "lucide-react";

export const Route = createFileRoute("/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan — E-Budgeting Pesantren" }] }),
  component: PengaturanPage,
});

const tabs = [
  { value: "umum", label: "Umum", icon: Building2 },
  { value: "keamanan", label: "Keamanan", icon: Shield },
  { value: "integrasi", label: "Integrasi", icon: Plug },
  { value: "tampilan", label: "Tampilan", icon: Palette },
] as const;

function PengaturanPage() {
  const [tab, setTab] = useState<typeof tabs[number]["value"]>("umum");
  const [theme, setTheme] = useState<"light" | "dark">(typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <AppLayout>
      <PageHeader title="Pengaturan" description="Konfigurasi aplikasi dan preferensi pengguna" />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="rounded-2xl border border-border bg-card p-2 shadow-soft h-fit">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.value;
            return (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${active ? "bg-primary-soft text-primary" : "hover:bg-secondary"}`}>
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          {tab === "umum" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">Pengaturan Umum</h3>
                <p className="text-xs text-muted-foreground">Identitas aplikasi dan institusi.</p>
              </div>
              <Field label="Nama Aplikasi" defaultValue="E-Budgeting Pesantren" />
              <Field label="Nama Institusi" defaultValue="Pesantren Modern Raudhatussalam Mahato" />
              <Field label="Alamat" defaultValue="Mahato, Rokan Hulu, Riau" />
              <Field label="Email Resmi" defaultValue="kontak@raudhatussalam.id" />
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Logo Institusi</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Building2 className="h-8 w-8" /></div>
                  <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-secondary"><Upload className="h-4 w-4" /> Unggah Logo</button>
                </div>
              </div>
              <SaveBar onSave={() => setToast("Pengaturan umum disimpan")} />
            </div>
          )}

          {tab === "keamanan" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">Keamanan</h3>
                <p className="text-xs text-muted-foreground">Kelola password dan PIN admin.</p>
              </div>
              <Field label="Password Lama" type="password" />
              <Field label="Password Baru" type="password" />
              <Field label="Konfirmasi Password Baru" type="password" />
              <div className="my-2 border-t border-border" />
              <Field label="PIN Admin (6 digit)" type="password" defaultValue="••••••" />
              <ToggleRow label="Verifikasi 2 Langkah" desc="Wajibkan kode OTP saat login" defaultChecked />
              <ToggleRow label="Logout otomatis 30 menit" desc="Sesi akan berakhir setelah tidak aktif" defaultChecked />
              <SaveBar onSave={() => setToast("Pengaturan keamanan disimpan")} />
            </div>
          )}

          {tab === "integrasi" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Integrasi</h3>
                <p className="text-xs text-muted-foreground">Hubungkan aplikasi dengan layanan lain.</p>
              </div>
              {[
                { name: "WhatsApp Business", desc: "Kirim notifikasi via WhatsApp", connected: false },
                { name: "Email SMTP", desc: "Konfigurasi server email keluar", connected: true },
                { name: "Google Sheets", desc: "Sinkronisasi laporan ke spreadsheet", connected: false },
                { name: "Bank API", desc: "Verifikasi rekening otomatis", connected: false },
              ].map(i => (
                <div key={i.name} className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div>
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.desc}</p>
                  </div>
                  <button className={`h-9 rounded-lg px-3 text-xs font-semibold ${i.connected ? "bg-primary-soft text-primary" : "border border-border bg-card hover:bg-secondary"}`}>
                    {i.connected ? "Terhubung" : "Hubungkan"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "tampilan" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">Tampilan</h3>
                <p className="text-xs text-muted-foreground">Pilih tema dan tampilan aplikasi.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setTheme("light")} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${theme === "light" ? "border-primary bg-primary-soft" : "border-border hover:bg-secondary"}`}>
                  <Sun className="h-6 w-6 text-warning-foreground" />
                  <p className="font-semibold">Mode Terang</p>
                </button>
                <button onClick={() => setTheme("dark")} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${theme === "dark" ? "border-primary bg-primary-soft" : "border-border hover:bg-secondary"}`}>
                  <Moon className="h-6 w-6 text-info" />
                  <p className="font-semibold">Mode Gelap</p>
                </button>
              </div>
              <ToggleRow label="Animasi UI" desc="Aktifkan transisi dan animasi" defaultChecked />
              <ToggleRow label="Sidebar terbuka secara default" desc="Tampilkan sidebar saat aplikasi dibuka" defaultChecked />
              <SaveBar onSave={() => setToast("Pengaturan tampilan disimpan")} />
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}

function Field({ label, type = "text", defaultValue = "" }: { label: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      <input type={type} defaultValue={defaultValue} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
    </div>
  );
}
function ToggleRow({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  const [v, setV] = useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
      <div><p className="font-semibold">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
      <Toggle checked={v} onChange={setV} />
    </div>
  );
}
function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <button onClick={onSave} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        <Save className="h-4 w-4" /> Simpan Perubahan
      </button>
    </div>
  );
}
