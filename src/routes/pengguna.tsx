import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { usePengguna, useUpdateRole, useResetPassword, useDeletePengguna, type Pengguna } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { Search, Shield, Loader2, Plus, Key, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pengguna")({
  head: () => ({ meta: [{ title: "Manajemen Pengguna — E-Budgeting Pesantren" }] }),
  component: PenggunaPage,
});

const roles = ["admin", "approver", "pengaju"] as const;
type Role = typeof roles[number];

function PenggunaPage() {
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [q, setQ] = useState("");
  const { data: usersRaw = [], isLoading } = usePengguna();
  const users: Pengguna[] = Array.isArray(usersRaw) ? usersRaw : [];
  const { role: currentRole } = useAuth();
  const updateRole = useUpdateRole();
  const isAdmin = currentRole === "admin";

  const filtered = useMemo(() =>
    users.filter(u => `${u.nama_lengkap} ${u.instansi ?? ""} ${u.jabatan ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    [users, q]
  );

  const resetPassword = useResetPassword();
  const deletePengguna = useDeletePengguna();

  const changeRole = async (userId: string, newRole: Role) => {
    if (!isAdmin) { toast.error("Hanya admin yang dapat mengubah role"); return; }
    try {
      await updateRole.mutateAsync({ id: userId, role: newRole });
      toast.success("Role berhasil diubah");
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  };

  const handleResetPassword = async (u: Pengguna) => {
    const newPass = prompt(`Masukkan password baru untuk ${u.nama_lengkap}:`, "santri123");
    if (!newPass) return;
    if (newPass.length < 6) { toast.error("Password minimal 6 karakter"); return; }

    try {
      await resetPassword.mutateAsync({ id: u.id, password: newPass });
      toast.success(`Password ${u.nama_lengkap} berhasil direset`);
    } catch (err: any) {
      toast.error("Gagal reset password", { description: err.message });
    }
  };

  const handleDelete = async (u: Pengguna) => {
    if (!confirm(`Hapus pengguna ${u.nama_lengkap}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deletePengguna.mutateAsync(u.id);
      toast.success("Pengguna dihapus");
    } catch (err: any) {
      toast.error("Gagal menghapus", { description: err.message });
    }
  };

  return (
    <>
      <PageHeader title="Manajemen Pengguna" description="Kelola pengguna dan hak akses sistem" 
        actions={isAdmin && (
          <Link to="/pengguna/baru" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 transition-transform hover:scale-105">
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </Link>
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
                  <th className="px-4 py-3 font-semibold">Jabatan / Instansi</th>
                  <th className="px-4 py-3 font-semibold">Kontak</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Bergabung</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Belum ada pengguna.</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{u.nama_lengkap.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                        <p className="font-semibold">{u.nama_lengkap}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{u.jabatan ?? "—"}</p>
                      <p className="text-xs">{u.instansi ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.no_hp ?? "—"}</td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <select value={u.role} onChange={e => changeRole(u.id, e.target.value as Role)} className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold capitalize outline-none focus:border-ring">
                          {roles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                        </select>
                      ) : (
                        <span className="inline-flex rounded-full border border-primary/30 bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary capitalize">{u.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleResetPassword(u)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(u)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
          <div className="mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><h3 className="font-semibold">Role & Permission</h3></div>
          <div className="space-y-3">
            {[
              { role: "Admin", desc: "Akses penuh: kelola pengguna, role, pencairan, semua data, audit log" },
              { role: "Approver", desc: "Menyetujui/menolak ajuan, melihat semua ajuan & laporan" },
              { role: "Pengaju", desc: "Membuat & melihat ajuan miliknya, melihat status approval" },
            ].map(r => (
              <div key={r.role} className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="font-semibold">{r.role}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-secondary border border-border"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
