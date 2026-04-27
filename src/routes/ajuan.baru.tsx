import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { formatRupiah } from "@/lib/utils";
import { useCreateAjuan, useInstansiList, useSettings, useAjuanList } from "@/lib/queries";
import { compressImage, uploadToCloudinary } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Plus, Trash2, Upload, X, Send, Loader2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

export const Route = createFileRoute("/ajuan/baru")({
  head: () => ({ meta: [{ title: "Buat Ajuan Baru — E-Budgeting Pesantren" }] }),
  component: BuatAjuanPage,
});

interface Item { id: string; nama: string; qty: number; satuan: string; harga: number }

function BuatAjuanPage() {
  const router = useRouter();
  const { user, profile, role } = useAuth();
  const createAjuan = useCreateAjuan();
  const { data: instansiData = [] } = useInstansiList();
  const { data: settings } = useSettings();
  const { data: ajuanList = [] } = useAjuanList();
  
  const pendingReport = useMemo(() => {
    return ajuanList.find(a => (a.status === 'dicairkan' || a.status === 'disetujui') && !a.has_laporan);
  }, [ajuanList]);
  
  const [instansi, setInstansi] = useState(profile?.instansi || "");
  const [judul, setJudul] = useState("");
  const [rencana, setRencana] = useState("");
  const [pengajuNama, setPengajuNama] = useState(profile?.nama_lengkap || "");
  const [items, setItems] = useState<Item[]>([{ id: "1", nama: "", qty: 1, satuan: "pcs", harga: 0 }]);
  const [submitted, setSubmitted] = useState(false);

  const [gambarFile, setGambarFile] = useState<File | null>(null);
  const [gambarPreview, setGambarPreview] = useState<string>("");
  const [gambarUrl, setGambarUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar tidak boleh lebih dari 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Format gambar tidak valid. Gunakan JPG, PNG atau WebP");
      return;
    }

    setGambarFile(file);
    setGambarPreview(URL.createObjectURL(file));
  };

  const uploadAndSubmit = async () => {
    setIsUploading(true);
    try {
      let finalGambarUrl = gambarUrl;
      if (gambarFile) {
        toast.info("Mengompresi gambar...");
        const compressed = await compressImage(gambarFile);
        toast.info("Mengunggah ke cloud...");
        finalGambarUrl = await uploadToCloudinary(compressed, settings);
        setGambarUrl(finalGambarUrl);
      }

      await createAjuan.mutateAsync({
        judul, 
        instansi, 
        rencana_penggunaan: rencana,
        gambar_url: finalGambarUrl || undefined,
        items: items.map(({ nama, qty, satuan, harga }) => ({ nama_item: nama, qty, satuan, harga })),
      });
      toast.success("Ajuan Berhasil Dikirim");
      if (!user) {
        setSubmitted(true);
      } else {
        const newId = (createAjuan.data as any)?.id;
        if (newId) {
          router.navigate({ to: "/ajuan/$id", params: { id: newId } });
        } else {
          router.navigate({ to: "/ajuan" });
        }
      }
    } catch (e: any) {
      toast.error("Gagal mengirim ajuan", { description: e.message || "Terjadi kesalahan yang tidak diketahui" });
    } finally {
      setIsUploading(false);
    }
  };

  const submit = async () => {
    if (!pengajuNama.trim()) { toast.error("Masukkan nama pengaju"); return; }
    if (!instansi) { toast.error("Pilih instansi/bidang"); return; }
    if (!judul.trim() || !rencana.trim()) { toast.error("Lengkapi judul dan rencana penggunaan"); return; }
    if (judul.trim().length < 3) { toast.error("Judul minimal 3 karakter"); return; }
    if (rencana.trim().length < 10) { toast.error("Rencana penggunaan minimal 10 karakter"); return; }
    if (items.some(i => !i.nama.trim() || i.qty <= 0 || i.harga <= 0)) { toast.error("Lengkapi semua rincian belanja (nama, jumlah, dan harga tidak boleh 0)"); return; }
    
    await uploadAndSubmit();
  };

  // Sync profile data when loaded
  React.useEffect(() => {
    if (profile) {
      if (!instansi) setInstansi(profile.instansi || "");
      if (!pengajuNama) setPengajuNama(profile.nama_lengkap || "");
    }
  }, [profile]);

  const total = items.reduce((s, i) => s + i.qty * i.harga, 0);

  const addItem = () => setItems(prev => [...prev, { id: String(Date.now()), nama: "", qty: 1, satuan: "pcs", harga: 0 }]);
  const removeItem = (id: string) => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  const updateItem = (id: string, patch: Partial<Item>) => setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

  if (pendingReport) {
    return (
      <div className="py-20 text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 shadow-soft">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Selesaikan Laporan Dahulu</h2>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Anda masih memiliki anggaran yang dicairkan (<b>{pendingReport.kode}</b>) namun belum dilaporkan penggunaannya. Harap selesaikan laporan tersebut sebelum membuat pengajuan baru.
        </p>
        <Link 
          to="/laporan/baru"
          search={{ ajuanId: pendingReport.id }}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-soft hover:bg-primary/90 transition-all hover:scale-105"
        >
          Buat Laporan Sekarang
        </Link>
      </div>
    );
  }

  if (role === "approver") {
    return (
      <div className="py-20 text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-soft">
          <X className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Akses Dibatasi</h2>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Mohon maaf, akun dengan role <b>Approver</b> tidak diperkenankan untuk membuat ajuan anggaran. Role ini dikhususkan untuk meninjau dan menyetujui ajuan.
        </p>
        <Link 
          to="/ajuan"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-soft hover:bg-primary/90 transition-all hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="py-12 text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20 text-success shadow-soft">
          <Send className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Alhamdulillah!</h2>
        <p className="mt-2 text-muted-foreground">
          Ajuan anggaran Anda telah berhasil dikirim ke sistem.<br />
          Admin akan segera meninjau dan memproses ajuan tersebut.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-soft hover:bg-primary/90 transition-all hover:scale-105"
        >
          Buat Ajuan Lagi
        </button>
      </div>
    );
  }

  return (
    <>
      {user && (
        <Link to="/ajuan" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar ajuan
        </Link>
      )}
      <div className="mb-8 border-b border-border pb-2">
        <h2 className="text-xl font-bold text-foreground">Formulir Pengajuan Anggaran</h2>
        <p className="text-sm text-muted-foreground">Mohon isi data di bawah dengan jujur dan lengkap untuk keperluan audit.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Nama Pengaju">
                <input 
                  value={pengajuNama} 
                  onChange={e => setPengajuNama(e.target.value)} 
                  placeholder="Nama lengkap Anda"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </Field>
              <Field label="Instansi / Bidang">
                <select 
                  value={instansi} 
                  onChange={e => setInstansi(e.target.value)} 
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right:10px_center] bg-no-repeat"
                >
                  <option value="" disabled>Pilih Instansi</option>
                  {instansiData.map(i => <option key={i.id} value={i.nama}>{i.nama}</option>)}
                </select>
              </Field>
              <Field label="Judul Penggunaan Dana" full>
                <input 
                  value={judul} 
                  onChange={e => setJudul(e.target.value)} 
                  placeholder="Contoh: Pembelian Kitab Santri Baru" 
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </Field>
              <Field label="Rencana & Tujuan Penggunaan" full>
                <textarea 
                  value={rencana} 
                  onChange={e => setRencana(e.target.value)} 
                  rows={4} 
                  placeholder="Jelaskan secara rinci untuk apa anggaran ini digunakan..." 
                  className="w-full rounded-xl border border-input bg-background p-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </Field>
              <Field label="Gambar Referensi / Bukti Belanja (Opsional)" full>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-6 text-sm font-semibold text-primary transition-all hover:bg-primary/10">
                      <Upload className="h-4 w-4" />
                      {gambarFile ? "Ganti Gambar" : "Pilih Gambar dari Galeri"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Atau masukkan CDN URL Image..." 
                        className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary transition-all"
                        value={gambarUrl}
                        onChange={(e) => setGambarUrl(e.target.value)}
                      />
                    </div>
                    {(gambarFile || gambarUrl) && (
                      <button 
                        type="button" 
                        onClick={() => { setGambarFile(null); setGambarPreview(""); setGambarUrl(""); }}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {(gambarPreview || gambarUrl) && (
                    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-secondary/20">
                      <img src={gambarUrl || gambarPreview} alt="Preview" className="h-auto w-full" />
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Rincian Estimasi Biaya</h3>
              <button 
                onClick={addItem} 
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-primary/20 bg-primary/5 px-4 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-4 w-4" /> Tambah Baris
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-1 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-bold">Nama Kebutuhan</th>
                      <th className="px-4 py-3 font-bold w-24">Jumlah</th>
                      <th className="px-4 py-3 font-bold w-28">Satuan</th>
                      <th className="px-4 py-3 font-bold w-44">Harga Satuan (Rp)</th>
                      <th className="px-4 py-3 font-bold text-right">Total (Rp)</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map(it => (
                      <tr key={it.id} className="bg-card">
                        <td className="px-2 py-3"><input value={it.nama} onChange={e => updateItem(it.id, { nama: e.target.value })} placeholder="Barang/Jasa" className="h-10 w-full rounded-lg bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" /></td>
                        <td className="px-2 py-3"><input type="number" min={1} value={it.qty} onChange={e => updateItem(it.id, { qty: Number(e.target.value) || 0 })} className="h-10 w-full rounded-lg bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-center" /></td>
                        <td className="px-2 py-3"><input value={it.satuan} onChange={e => updateItem(it.id, { satuan: e.target.value })} placeholder="pcs" className="h-10 w-full rounded-lg bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-center" /></td>
                        <td className="px-2 py-3"><input type="number" min={0} value={it.harga} onChange={e => updateItem(it.id, { harga: Number(e.target.value) || 0 })} className="h-10 w-full rounded-lg bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-right" /></td>
                        <td className="px-4 py-3 text-right font-bold text-foreground tabular-nums">{formatRupiah(it.qty * it.harga)}</td>
                        <td className="px-2 py-3"><button onClick={() => removeItem(it.id)} className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-10 rounded-3xl border border-border bg-card p-6 shadow-elevated">
            <h3 className="text-lg font-bold text-foreground mb-6">Ringkasan Ajuan</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex flex-col gap-1 rounded-2xl bg-secondary/50 p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Total Anggaran Dibutuhkan</span>
                <span className="text-3xl font-black text-primary tracking-tight">{formatRupiah(total)}</span>
              </div>
              
              <div className="space-y-3 px-1 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Pengaju</span>
                  <span className="font-bold text-foreground">{pengajuNama || "—"}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Bidang</span>
                  <span className="font-bold text-foreground">{instansi}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Jumlah Item</span>
                  <span className="font-bold text-foreground">{items.length} Barang</span>
                </div>
              </div>
            </div>

            <button 
              onClick={submit} 
              disabled={createAjuan.isPending || isUploading} 
              className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {createAjuan.isPending || isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  Kirim Ajuan Sekarang
                </>
              )}
            </button>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Dengan menekan tombol, Anda menyatakan bahwa data anggaran yang diajukan adalah benar.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">{label}</dt><dd className="truncate font-semibold">{value}</dd></div>;
}
