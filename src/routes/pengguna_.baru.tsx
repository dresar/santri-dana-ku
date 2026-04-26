import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useCreatePengguna, useInstansiList } from "@/lib/queries";
import { ArrowLeft, Send, Loader2, Shield, User, Mail, Lock, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pengguna_/baru")({
  head: () => ({ meta: [{ title: "Tambah Pengguna Baru — E-Budgeting" }] }),
  component: TambahPenggunaPage,
});

const roles = ["admin", "approver", "pengaju"] as const;
type Role = typeof roles[number];

function TambahPenggunaPage() {
  const router = useRouter();
  const createUser = useCreatePengguna();
  const { data: instansiList = [] } = useInstansiList();
  
  const [form, setForm] = useState({ 
    email: "", 
    password: "", 
    nama_lengkap: "", 
    jabatan: "",
    instansi: "",
    no_hp: "",
    role: "pengaju" as Role 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_lengkap || !form.email || !form.password) {
      toast.error("Harap lengkapi semua field wajib");
      return;
    }
    
    try {
      await createUser.mutateAsync(form);
      toast.success("Pengguna berhasil ditambahkan");
      router.navigate({ to: "/pengguna" });
    } catch (err: any) {
      toast.error("Gagal menambahkan pengguna", { description: err.message });
    }
  };

  return (
    <>
      <Link to="/pengguna" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Manajemen Pengguna
      </Link>
      
      <PageHeader 
        title="Tambah Pengguna Baru" 
        description="Daftarkan akun pengguna baru dan tentukan hak aksesnya dalam sistem." 
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevated p-8">
            <h3 className="mb-6 text-lg font-bold text-foreground border-b border-border pb-4">Informasi Akun</h3>
            
            <div className="space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" /> Nama Lengkap
                </label>
                <input 
                  required 
                  value={form.nama_lengkap} 
                  onChange={e => setForm(p => ({...p, nama_lengkap: e.target.value}))} 
                  placeholder="Masukkan nama lengkap"
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" /> Alamat Email
                </label>
                <input 
                  required 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm(p => ({...p, email: e.target.value}))} 
                  placeholder="contoh@pesantren.id"
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" /> Jabatan / Posisi
                </label>
                <input 
                  value={form.jabatan} 
                  onChange={e => setForm(p => ({...p, jabatan: e.target.value}))} 
                  placeholder="Contoh: Kepala Sekretariat"
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" /> Nomor HP (WhatsApp)
                </label>
                <input 
                  value={form.no_hp} 
                  onChange={e => setForm(p => ({...p, no_hp: e.target.value}))} 
                  placeholder="0812xxxxxxxx"
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-muted-foreground" /> Password
                </label>
                <input 
                  required 
                  type="password" 
                  minLength={6} 
                  value={form.password} 
                  onChange={e => setForm(p => ({...p, password: e.target.value}))} 
                  placeholder="Minimal 6 karakter"
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-muted-foreground" /> Instansi / Bidang (Opsional)
                </label>
                <select 
                  value={form.instansi} 
                  onChange={e => setForm(p => ({...p, instansi: e.target.value}))} 
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right:14px_center] bg-no-repeat"
                >
                  <option value="">-- Kosong --</option>
                  {instansiList.map(i => <option key={i.id} value={i.nama}>{i.nama}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Shield className="h-4 w-4 text-muted-foreground" /> Role Sistem
                </label>
                <select 
                  value={form.role} 
                  onChange={e => setForm(p => ({...p, role: e.target.value as Role}))} 
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm capitalize outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right:14px_center] bg-no-repeat"
                >
                  {roles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
                <p className="mt-2 text-xs text-muted-foreground">
                  {form.role === "admin" && "Admin memiliki akses penuh ke seluruh fitur dan pengaturan sistem."}
                  {form.role === "approver" && "Approver dapat meninjau dan menyetujui ajuan anggaran."}
                  {form.role === "pengaju" && "Pengaju hanya dapat membuat ajuan dan melihat status ajuannya sendiri."}
                </p>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-border flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => router.navigate({ to: "/pengguna" })} 
                className="h-12 rounded-xl border border-input bg-card px-6 font-bold text-foreground hover:bg-secondary transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={createUser.isPending} 
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {createUser.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                Buat Akun
              </button>
            </div>
          </form>
        </div>
        
        <aside className="lg:col-span-1">
          <div className="sticky top-10 rounded-3xl border border-border bg-card p-6 shadow-elevated">
            <h3 className="text-lg font-bold text-foreground mb-4">Panduan Pembuatan Akun</h3>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Pastikan alamat email yang dimasukkan benar, karena email ini akan digunakan untuk login ke dalam sistem E-Budgeting.
              </p>
              <div className="rounded-xl bg-info/10 p-4 border border-info/20 text-info">
                <strong className="font-bold text-foreground">Penting:</strong> Password default minimal 6 karakter. Pengguna dapat mengubah passwordnya sendiri melalui menu pengaturan.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
