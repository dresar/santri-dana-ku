import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Toggle } from "./pengguna";
import { User, Palette, Save, Sun, Moon, Camera, Loader2, Building2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUpdateProfile, useUpdatePhoto, useInstansiList, useCreateInstansi, useDeleteInstansi, useSettings, useUpdateSettings } from "@/lib/queries";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { compressImage, uploadToCloudinary } from "@/lib/utils";

export const Route = createFileRoute("/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan — E-Budgeting Pesantren" }] }),
  component: PengaturanPage,
});

const baseTabs = [
  { value: "profil", label: "Profil Saya", icon: User },
  { value: "tampilan", label: "Tampilan", icon: Palette },
] as const;

function PengaturanPage() {
  const [tab, setTab] = useState<typeof tabs[number]["value"]>("profil");
  const [theme, setTheme] = useState<"light" | "dark">(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  const { profile, user, role, reload } = useAuth();
  
  const updateProfile = useUpdateProfile();
  const updatePhoto = useUpdatePhoto();
  
  const { data: instansiList = [] } = useInstansiList();
  const createInstansi = useCreateInstansi();
  const deleteInstansi = useDeleteInstansi();
  const [newInstansi, setNewInstansi] = useState("");

  const tabs = [
    ...baseTabs,
    ...(role === "admin" ? [
      { value: "instansi", label: "Kelola Instansi", icon: Building2 },
      { value: "kop", label: "Kop & TTD", icon: Save },
      { value: "cloud", label: "Cloud Storage", icon: Camera }
    ] : []),
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nama_lengkap: profile?.nama_lengkap ?? "",
    no_hp: profile?.no_hp ?? "",
    jabatan: profile?.jabatan ?? "",
    instansi: profile?.instansi ?? "",
  });

  // Sync form when profile loads
  useEffect(() => {
    if (profile) setForm({
      nama_lengkap: profile.nama_lengkap ?? "",
      no_hp: profile.no_hp ?? "",
      jabatan: profile.jabatan ?? "",
      instansi: profile.instansi ?? "",
    });
  }, [profile]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleSaveTheme = () => {
    localStorage.setItem("theme", theme);
    toast.success("Pengaturan tampilan berhasil disimpan");
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(form);
      toast.success("Profil berhasil diperbarui");
      setIsEditing(false);
      reload(); // reload user context to reflect changes globally
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  };

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const { data: cloudSettings } = useSettings("instansi");

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!cloudSettings?.cloudinary_cloud_name) {
      toast.error("Gagal", { description: "Konfigurasi Cloudinary belum siap atau belum diisi di tab Cloud Storage." });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadToCloudinary(compressed, cloudSettings);
      await updatePhoto.mutateAsync(url);
      toast.success("Foto profil berhasil diperbarui");
      reload();
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleManualPhotoUrl = async (url: string) => {
    if (!url.trim()) return;
    try {
      await updatePhoto.mutateAsync(url);
      toast.success("Foto profil diperbarui dari URL");
      reload();
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  };

  return (
    <>
      <PageHeader title="Pengaturan" description="Lihat informasi profil Anda dan atur preferensi antarmuka." />

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
          {tab === "profil" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">Informasi Profil</h3>
                <p className="text-xs text-muted-foreground">Detail informasi akun Anda saat ini.</p>
              </div>

              <div className="flex items-center gap-6 py-2">
                <div className="relative group">
                  {profile?.foto_url ? (
                    <img src={profile.foto_url} alt="Profile" className="h-20 w-20 rounded-2xl object-cover shadow-soft" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-soft">
                      {(profile?.nama_lengkap ?? user?.email ?? "U").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-secondary text-foreground shadow-sm transition-transform hover:scale-110">
                    {updatePhoto.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={updatePhoto.isPending} />
                  </label>
                </div>
                <div>
                  <p className="font-bold text-lg">{profile?.nama_lengkap ?? "Pengguna"}</p>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{role}</p>
                  
                  <div className="mt-2 max-w-xs">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">CDN Image URL (Cloudinary)</label>
                    <input 
                      type="text" 
                      placeholder="https://res.cloudinary.com/..." 
                      className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2 text-[11px] outline-none focus:border-primary"
                      value={profile?.foto_url || ""}
                      onChange={(e) => handleManualPhotoUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Alamat Email" value={user?.email ?? "—"} readOnly />
                <div className="hidden sm:block" /> {/* spacer */}
                
                <Field label="Nama Lengkap" value={form.nama_lengkap} readOnly={!isEditing} onChange={v => setForm(p => ({...p, nama_lengkap: v}))} />
                <Field label="Nomor Handphone" value={form.no_hp} readOnly={!isEditing} onChange={v => setForm(p => ({...p, no_hp: v}))} />
                <Field label="Jabatan" value={form.jabatan} readOnly={!isEditing} onChange={v => setForm(p => ({...p, jabatan: v}))} />
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Instansi/Bidang</label>
                  {isEditing ? (
                    <select 
                      value={form.instansi} 
                      onChange={e => setForm(p => ({...p, instansi: e.target.value}))}
                      className="h-10 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-ring transition-colors bg-background"
                    >
                      <option value="">-- Pilih Instansi --</option>
                      {instansiList.map(i => <option key={i.id} value={i.nama}>{i.nama}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={form.instansi} readOnly className="h-10 w-full rounded-lg px-3 text-sm bg-secondary/50 text-muted-foreground cursor-not-allowed border-transparent" />
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="h-10 rounded-lg px-4 text-sm font-semibold hover:bg-secondary">Batal</button>
                    <button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                      {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Profil
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary">
                    Edit Profil
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === "tampilan" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">Tema Antarmuka</h3>
                <p className="text-xs text-muted-foreground">Pilih mode tampilan favorit Anda.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button onClick={() => setTheme("light")} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${theme === "light" ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-secondary text-muted-foreground"}`}>
                  <Sun className="h-6 w-6" />
                  <p className="font-semibold">Terang</p>
                </button>
                <button onClick={() => setTheme("dark")} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${theme === "dark" ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-secondary text-muted-foreground"}`}>
                  <Moon className="h-6 w-6" />
                  <p className="font-semibold">Gelap</p>
                </button>
              </div>



              <div className="flex pt-4">
                <button onClick={handleSaveTheme} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  <Save className="h-4 w-4" /> Simpan Preferensi
                </button>
              </div>
            </div>
          )}

          {tab === "instansi" && role === "admin" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold">Kelola Instansi / Bidang</h3>
                <p className="text-xs text-muted-foreground">Tambah atau hapus instansi yang tersedia untuk pengajuan.</p>
              </div>

              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newInstansi} 
                  onChange={e => setNewInstansi(e.target.value)} 
                  placeholder="Nama instansi baru..." 
                  className="h-10 flex-1 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-background"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newInstansi.trim() && !createInstansi.isPending) {
                      createInstansi.mutateAsync(newInstansi).then(() => setNewInstansi("")).catch((e) => toast.error(e.message));
                    }
                  }}
                />
                <button 
                  onClick={() => createInstansi.mutateAsync(newInstansi).then(() => setNewInstansi("")).catch((e) => toast.error(e.message))}
                  disabled={!newInstansi.trim() || createInstansi.isPending}
                  className="h-10 px-4 inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {createInstansi.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tambah
                </button>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nama Instansi / Bidang</th>
                      <th className="px-4 py-3 font-semibold w-[100px] text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {instansiList.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">Belum ada instansi.</td>
                      </tr>
                    ) : instansiList.map(i => (
                      <tr key={i.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{i.nama}</td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => {
                              if(confirm(`Yakin hapus ${i.nama}?`)) {
                                deleteInstansi.mutateAsync(i.id).catch(e => toast.error(e.message));
                              }
                            }}
                            disabled={deleteInstansi.isPending}
                            className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "kop" && role === "admin" && <KopSettingsTab />}
          {tab === "cloud" && role === "admin" && <CloudSettingsTab />}
        </div>
      </div>
    </>
  );
}

function KopSettingsTab() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<any>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setForm({
      nama: "", alamat: "", email: "", kontak: "", logo_url: null, ttd_url: null, show_ttd: true,
      ...settings
    });
  }, [settings]);

  if (isLoading || !form) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const handleSave = async () => {
    try {
      await update.mutateAsync(form);
      toast.success("Pengaturan Kop & TTD berhasil disimpan");
    } catch (e: any) {
      toast.error("Gagal", { description: e.message });
    }
  };

  const handleUpload = (field: "logo_url" | "ttd_url") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(field);
    try {
      const compressed = await compressImage(file);
      const url = await uploadToCloudinary(compressed, form);
      setForm((p: any) => ({ ...p, [field]: url }));
      toast.success("Berhasil diunggah ke Cloudinary");
    } catch (err: any) {
      toast.error("Upload gagal", { description: err.message });
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Pengaturan Kop Surat & Tanda Tangan</h3>
        <p className="text-xs text-muted-foreground">Informasi ini akan muncul pada dokumen cetak PDF.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Instansi" value={form.nama} onChange={v => setForm((p: any) => ({ ...p, nama: v }))} />
        <Field label="Email Instansi" value={form.email} onChange={v => setForm((p: any) => ({ ...p, email: v }))} />
        <Field label="Kontak / WhatsApp" value={form.kontak} onChange={v => setForm((p: any) => ({ ...p, kontak: v }))} />
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold">Alamat Lengkap</label>
          <textarea 
            value={form.alamat} 
            onChange={e => setForm((p: any) => ({ ...p, alamat: e.target.value }))}
            className="w-full rounded-lg border border-input p-3 text-sm outline-none focus:border-ring bg-background"
            rows={2}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-xs font-semibold">Logo Instansi</label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-border bg-slate-50 overflow-hidden">
              {form.logo_url ? <img src={form.logo_url} className="h-full w-full object-contain" /> : <Building2 className="h-8 w-8 text-muted-foreground" />}
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-block cursor-pointer rounded-lg bg-secondary px-4 py-2 text-xs font-bold hover:bg-secondary/80">
                {isUploading === "logo_url" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Pilih Logo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload("logo_url")} />
              </label>
              <input 
                type="text" 
                placeholder="CDN URL Logo..." 
                className="h-8 w-full rounded-lg border border-input bg-background px-3 text-[11px] outline-none focus:border-primary"
                value={form.logo_url || ""}
                onChange={(e) => setForm((p: any) => ({ ...p, logo_url: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold">Tanda Tangan Digital</label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-40 items-center justify-center rounded-xl border border-dashed border-border bg-slate-50 overflow-hidden">
              {form.ttd_url ? <img src={form.ttd_url} className="h-full w-full object-contain" /> : <Save className="h-8 w-8 text-muted-foreground" />}
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-block cursor-pointer rounded-lg bg-secondary px-4 py-2 text-xs font-bold hover:bg-secondary/80">
                {isUploading === "ttd_url" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Upload TTD"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload("ttd_url")} />
              </label>
              <input 
                type="text" 
                placeholder="CDN URL TTD..." 
                className="h-8 w-full rounded-lg border border-input bg-background px-3 text-[11px] outline-none focus:border-primary"
                value={form.ttd_url || ""}
                onChange={(e) => setForm((p: any) => ({ ...p, ttd_url: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
        <div>
          <p className="font-semibold text-sm">Tampilkan Tanda Tangan</p>
          <p className="text-xs text-muted-foreground">Munculkan gambar TTD pada dokumen PDF yang dicetak.</p>
        </div>
        <Toggle checked={form.show_ttd} onChange={v => setForm((p: any) => ({ ...p, show_ttd: v }))} />
      </div>

      <div className="flex pt-4">
        <button onClick={handleSave} disabled={update.isPending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Pengaturan Kop
        </button>
      </div>
    </div>
  );
}

function CloudSettingsTab() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (settings) setForm({
      cloudinary_cloud_name: "djsgachpd", 
      cloudinary_upload_preset: "unsigned_upload",
      cloudinary_api_key: "878523218365883",
      cloudinary_api_secret: "npoG3AqRhj2u8KAhFxmMzc3i67s",
      ...settings
    });
  }, [settings]);

  if (isLoading || !form) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const handleSave = async () => {
    try {
      await update.mutateAsync(form);
      toast.success("Pengaturan Cloudinary berhasil disimpan");
    } catch (e: any) {
      toast.error("Gagal", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-primary flex items-center gap-2"><Camera className="h-5 w-5" /> Pengaturan Cloudinary</h3>
        <p className="text-xs text-muted-foreground">Konfigurasi ini digunakan untuk menyimpan gambar bukti pengajuan.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cloudinary Cloud Name" value={form.cloudinary_cloud_name || ""} onChange={v => setForm((p: any) => ({ ...p, cloudinary_cloud_name: v }))} />
        <Field label="Upload Preset (Unsigned)" value={form.cloudinary_upload_preset || ""} onChange={v => setForm((p: any) => ({ ...p, cloudinary_upload_preset: v }))} />
        <Field label="Cloudinary API Key" value={form.cloudinary_api_key || ""} onChange={v => setForm((p: any) => ({ ...p, cloudinary_api_key: v }))} />
        <Field label="Cloudinary API Secret" value={form.cloudinary_api_secret || ""} onChange={v => setForm((p: any) => ({ ...p, cloudinary_api_secret: v }))} />
      </div>

      <div className="rounded-xl border border-info/20 bg-info/5 p-4 text-xs leading-relaxed text-info-foreground">
        <p className="font-bold mb-1">💡 Cara Mendapatkan Keys:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Buka <a href="https://cloudinary.com" target="_blank" className="underline font-bold">Cloudinary Dashboard</a>.</li>
          <li>Cari <b>Cloud Name</b> di bagian Product Environment.</li>
          <li>Pergi ke <b>Settings &gt; Upload</b>.</li>
          <li>Scroll ke bawah ke bagian <b>Upload Presets</b>.</li>
          <li>Klik "Add upload preset", pilih mode <b>Unsigned</b>, lalu simpan dan ambil namanya.</li>
        </ol>
      </div>

      <div className="flex pt-4">
        <button onClick={handleSave} disabled={update.isPending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Konfigurasi Cloud
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, readOnly, onChange }: { label: string; value: string; readOnly?: boolean; onChange?: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">{label}</label>
      <input 
        type="text" 
        value={value} 
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        className={`h-10 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-ring transition-colors ${readOnly ? "bg-secondary/50 text-muted-foreground cursor-not-allowed border-transparent" : "bg-background"}`} 
      />
    </div>
  );
}

function ToggleRow({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  const [v, setV] = useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
      <div><p className="font-semibold text-sm">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
      <Toggle checked={v} onChange={setV} />
    </div>
  );
}
