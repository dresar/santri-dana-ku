import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Loader2, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [instansi, setInstansi] = useState("");
  const [noHp, setNoHp] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) toast.error("Login gagal", { description: error });
      else { toast.success("Berhasil masuk"); navigate({ to: "/" }); }
    } else {
      if (!namaLengkap.trim()) { toast.error("Nama lengkap wajib diisi"); setBusy(false); return; }
      const { error } = await signUp(email, password, { nama_lengkap: namaLengkap, jabatan, instansi, no_hp: noHp });
      if (error) toast.error("Pendaftaran gagal", { description: error });
      else { toast.success("Pendaftaran berhasil", { description: "Silakan masuk dengan akun Anda." }); setMode("login"); }
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-soft via-background to-secondary p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elevated">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">E-Budgeting Pesantren</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pesantren Modern Raudhatussalam Mahato</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button onClick={() => setMode("login")} className={`rounded-md py-2 text-sm font-semibold transition-all ${mode === "login" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>Masuk</button>
            <button onClick={() => setMode("register")} className={`rounded-md py-2 text-sm font-semibold transition-all ${mode === "register" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>Daftar</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <Field label="Nama Lengkap" value={namaLengkap} onChange={setNamaLengkap} placeholder="Cth. Ust. Ahmad Fauzi" required />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jabatan" value={jabatan} onChange={setJabatan} placeholder="Staf, Bendahara..." />
                  <Field label="No. HP" value={noHp} onChange={setNoHp} placeholder="08xxxxxxxxxx" />
                </div>
                <Field label="Instansi / Bidang" value={instansi} onChange={setInstansi} placeholder="Bidang Kurikulum" />
              </>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="email@pesantren.id" required />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimal 6 karakter" required />

            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Masuk ke Sistem" : "Daftar Akun Baru"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-semibold text-primary hover:underline">
              {mode === "login" ? "Daftar di sini" : "Masuk"}
            </button>
          </p>

          {mode === "login" && (
            <div className="mt-8 border-t border-border pt-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Akses Cepat (Manual)</p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Dev Mode</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Admin", email: "admin@example.com", icon: ShieldCheck, color: "text-red-500 bg-red-50 border-red-100" },
                  { label: "Approver", email: "approver@example.com", icon: UserCheck, color: "text-blue-500 bg-blue-50 border-blue-100" },
                  { label: "Pengaju", email: "pengaju@example.com", icon: Users, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
                ].map((d) => (
                  <button
                    key={d.email}
                    disabled={busy}
                    onClick={() => {
                      setEmail(d.email);
                      setPassword("password123");
                      toast.info(`Form terisi untuk ${d.label}`, { description: "Silakan klik tombol Masuk untuk melanjutkan." });
                    }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-all hover:scale-105 active:scale-95 ${d.color} ${busy ? "opacity-50" : ""}`}
                  >
                    <d.icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">© 2025 Pesantren Modern Raudhatussalam Mahato</p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-foreground">{label}{required && <span className="text-destructive"> *</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" />
    </div>
  );
}
