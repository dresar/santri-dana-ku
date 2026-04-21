import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, Toast } from "@/components/PageHeader";
import { penggunaData, type Pengguna } from "@/lib/dummy-data";
import { Plus, Pencil, Trash2, Search, Shield, X } from "lucide-react";

export const Route = createFileRoute("/pengguna")({
  head: () => ({ meta: [{ title: "Manajemen Pengguna — E-Budgeting Pesantren" }] }),
  component: PenggunaPage,
});

const roles: Pengguna["role"][] = ["Admin", "Staff", "Viewer"];

const permissions = [
  { key: "ajuan_create", label: "Membuat ajuan", admin: true, staff: true, viewer: false },
  { key: "ajuan_approve", label: "Menyetujui ajuan", admin: true, staff: false, viewer: false },
  { key: "pencairan", label: "Memproses pencairan", admin: true, staff: false, viewer: false },
  { key: "laporan_view", label: "Melihat laporan", admin: true, staff: true, viewer: true },
  { key: "laporan_export", label: "Export laporan", admin: true, staff: true, viewer: false },
  { key: "user_manage", label: "Mengelola pengguna", admin: true, staff: false, viewer: false },
];

function PenggunaPage() {
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<Pengguna | "new" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [perms, setPerms] = useState(permissions);

  const filtered = penggunaData.filter(u => `${u.nama} ${u.email} ${u.instansi}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppLayout>
      <PageHeader title="Manajemen Pengguna" description="Kelola pengguna dan hak akses sistem"
        actions={tab === "users" && (
          <button onClick={() => setModal("new")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </button>
        )}
      />

      <div className="mb-4 flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
        <button onClick={() => setTab("users")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${tab === "users" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>Daftar Pengguna</button>
        <button onClick={() => setTab("roles")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${tab === "roles" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>Role & Permission</button>
      </div>

      {tab === "users" ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="border-b border-border p-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari pengguna..." className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Pengguna</th>
                  <th className="px-4 py-3 font-semibold">Instansi</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Terakhir Login</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{u.nama.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{u.nama}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.instansi}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        u.role === "Admin" ? "border-primary/30 bg-primary-soft text-primary" :
                        u.role === "Staff" ? "border-info/30 bg-info/10 text-info" :
                        "border-border bg-secondary text-muted-foreground"
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.status === "Aktif" ? "text-success" : "text-muted-foreground"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === "Aktif" ? "bg-success" : "bg-muted-foreground"}`} />{u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.terakhirLogin}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setModal(u)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                        <button onClick={() => setToast(`Pengguna ${u.nama} dihapus`)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Pengaturan Role & Permission</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-3 font-semibold">Permission</th>
                  <th className="px-3 py-3 text-center font-semibold">Admin</th>
                  <th className="px-3 py-3 text-center font-semibold">Staff</th>
                  <th className="px-3 py-3 text-center font-semibold">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {perms.map((p, i) => (
                  <tr key={p.key} className="border-b border-border last:border-0">
                    <td className="px-3 py-3 font-medium">{p.label}</td>
                    {(["admin", "staff", "viewer"] as const).map(role => (
                      <td key={role} className="px-3 py-3 text-center">
                        <Toggle checked={p[role]} onChange={v => setPerms(prev => prev.map((x, j) => j === i ? { ...x, [role]: v } : x))} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-elevated animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{modal === "new" ? "Tambah Pengguna" : "Edit Pengguna"}</h3>
              <button onClick={() => setModal(null)} className="rounded-md p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Nama Lengkap" defaultValue={modal === "new" ? "" : modal.nama} />
              <Field label="Email" type="email" defaultValue={modal === "new" ? "" : modal.email} />
              <Field label="Instansi" defaultValue={modal === "new" ? "" : modal.instansi} />
              <div>
                <label className="mb-1.5 block text-xs font-semibold">Role</label>
                <select defaultValue={modal === "new" ? "Staff" : modal.role} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring">
                  {roles.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary">Batal</button>
              <button onClick={() => { setModal(null); setToast(modal === "new" ? "Pengguna baru ditambahkan" : "Pengguna berhasil diperbarui"); }} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Simpan</button>
            </div>
          </div>
        </div>
      )}

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

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-secondary border border-border"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
