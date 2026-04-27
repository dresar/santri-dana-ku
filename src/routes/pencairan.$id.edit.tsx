import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { uploadToCloudinary } from "@/lib/utils";
import { usePencairanDetail, useUpdatePencairan, useSettings } from "@/lib/queries";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Wallet, 
  Building2, 
  Upload, 
  X, 
  CreditCard, 
  User, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pencairan/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Pencairan Dana — E-Budgeting Pesantren" }] }),
  component: PencairanEditPage,
});

const banks = ["Bank Syariah Indonesia (BSI)", "Bank Muamalat", "Bank Mandiri", "Bank Riau Kepri Syariah", "BCA Syariah"];

function PencairanEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: pc, isLoading: loadingDetail } = usePencairanDetail(id);
  const { data: settings } = useSettings("instansi");
  const update = useUpdatePencairan();

  const [metode, setMetode] = useState<"tunai" | "transfer">("tunai");
  const [bank, setBank] = useState(banks[0]);
  const [norek, setNorek] = useState("");
  const [pemilik, setPemilik] = useState("");
  const [jumlah, setJumlah] = useState(0);
  const [bukti_url, setBuktiUrl] = useState("");
  const [bukti_penyerahan_url, setBuktiPenyerahanUrl] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (pc) {
      setMetode(pc.metode);
      setBank(pc.bank || banks[0]);
      setNorek(pc.no_rekening || "");
      setPemilik(pc.nama_pemilik || "");
      setJumlah(Number(pc.jumlah) || 0);
      setBuktiUrl(pc.bukti_url || "");
      setBuktiPenyerahanUrl(pc.bukti_penyerahan_url || "");
    }
  }, [pc]);

  const handleUpload = async (file: File, target: 'bukti' | 'penyerahan') => {
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file, settings);
      if (target === 'bukti') setBuktiUrl(url);
      else setBuktiPenyerahanUrl(url);
      toast.success("Gambar berhasil diperbarui");
    } catch (e) {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!pc) return;
    setBusy(true);
    try {
      await update.mutateAsync({
        id: pc.id,
        input: {
          metode,
          bank: metode === 'transfer' ? bank : null,
          no_rekening: metode === 'transfer' ? norek : null,
          nama_pemilik: pemilik,
          jumlah: Number(jumlah),
          bukti_url,
          bukti_penyerahan_url
        }
      });
      toast.success("Perubahan berhasil disimpan");
      navigate({ to: "/pencairan/$id", params: { id: pc.id } });
    } catch (e) {
      toast.error("Gagal memperbarui data");
    } finally {
      setBusy(false);
    }
  };

  if (loadingDetail) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!pc) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link 
          to="/pencairan" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Riwayat
        </Link>
        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase text-amber-600 border border-amber-100">
          <AlertCircle className="h-3 w-3" /> Mode Pengeditan
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 shadow-elevated">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Formulir Perubahan</p>
            <h1 className="text-3xl font-black tracking-tighter">Edit Transaksi Pencairan</h1>
            <p className="text-sm text-muted-foreground">Sesuaikan detail pembayaran dan lampiran untuk <span className="font-bold text-foreground">{pc.kode}</span></p>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={() => navigate({ to: "/pencairan" })}
               className="h-12 rounded-xl bg-secondary px-6 text-sm font-bold transition-all hover:bg-secondary/80"
             >
               Batal
             </button>
             <button 
               onClick={handleSave}
               disabled={busy || isUploading}
               className="h-12 flex items-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
             >
               {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Simpan Perubahan
             </button>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Section 1: Payment Method */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary">
              <CreditCard className="h-4 w-4" /> Metode & Nominal
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setMetode("tunai")}
                    className={`flex h-14 items-center justify-center gap-3 rounded-2xl border-2 transition-all font-bold ${metode === "tunai" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary"}`}
                  >
                    <Wallet className="h-5 w-5" /> TUNAI
                  </button>
                  <button 
                    onClick={() => setMetode("transfer")}
                    className={`flex h-14 items-center justify-center gap-3 rounded-2xl border-2 transition-all font-bold ${metode === "transfer" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary"}`}
                  >
                    <Building2 className="h-5 w-5" /> TRANSFER
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Jumlah Dana (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">Rp</span>
                  <input 
                    type="number" 
                    value={jumlah} 
                    onChange={e => setJumlah(Number(e.target.value))}
                    className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-xl font-black text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" 
                  />
                </div>
              </div>
            </div>

            {metode === "transfer" && (
              <div className="rounded-3xl border border-border bg-secondary/30 p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Bank Tujuan</label>
                  <select 
                    value={bank} 
                    onChange={e => setBank(e.target.value)}
                    className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm font-bold outline-none focus:border-primary"
                  >
                    {banks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Nomor Rekening</label>
                  <input 
                    value={norek} 
                    onChange={e => setNorek(e.target.value)}
                    className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm font-bold outline-none focus:border-primary"
                    placeholder="Masukkan no. rekening"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Atas Nama / Penerima</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  value={pemilik} 
                  onChange={e => setPemilik(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm font-bold outline-none focus:border-primary"
                  placeholder="Nama pemilik rekening atau penerima"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Uploads */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-600">
              <ShieldCheck className="h-4 w-4" /> Berkas Pendukung
            </h3>

            <div className="space-y-6">
               <UploadBox 
                 title="Ganti Lampiran Anggaran" 
                 currentUrl={bukti_url} 
                 onUpload={(f) => handleUpload(f, 'bukti')} 
               />
               <UploadBox 
                 title="Ganti Bukti Penyerahan" 
                 currentUrl={bukti_penyerahan_url} 
                 onUpload={(f) => handleUpload(f, 'penyerahan')} 
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadBox({ title, currentUrl, onUpload }: { title: string; currentUrl?: string; onUpload: (f: File) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-muted-foreground uppercase">{title}</label>
      <div className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card transition-all hover:border-primary/50 hover:bg-secondary/10">
        {currentUrl ? (
          <div className="relative aspect-video">
            <img src={currentUrl} className="h-full w-full object-cover" alt="Preview" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
               <label className="cursor-pointer rounded-xl bg-white px-4 py-2 text-xs font-black text-black transition-all hover:scale-105 active:scale-95">
                 GANTI BERKAS
                 <input type="file" className="hidden" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
               </label>
            </div>
          </div>
        ) : (
          <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground transition-transform group-hover:-translate-y-1" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Klik untuk Unggah</p>
            <input type="file" className="hidden" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
          </label>
        )}
      </div>
    </div>
  );
}
