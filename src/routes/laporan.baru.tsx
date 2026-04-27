import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { formatRupiah, compressImage, uploadToCloudinary } from "@/lib/utils";
import { useAjuanDetail, useCreateLaporan, useSettings } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Plus, Trash2, Upload, X, Send, Loader2, Image as ImageIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/laporan/baru")({
  validateSearch: z.object({
    ajuanId: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Buat Laporan Penggunaan — E-Budgeting Pesantren" }] }),
  component: BuatLaporanPage,
});

interface LaporanItem { id: string; nama: string; qty: number; satuan: string; harga: number }

function BuatLaporanPage() {
  const router = useRouter();
  const { ajuanId } = Route.useSearch();
  const { profile } = useAuth();
  const { data: ajuan, isLoading: isLoadingAjuan } = useAjuanDetail(ajuanId || "");
  const { data: settings } = useSettings();
  const createLaporan = useCreateLaporan();

  const [items, setItems] = useState<LaporanItem[]>([]);
  const [catatan, setCatatan] = useState("");
  const [notaFiles, setNotaFiles] = useState<File[]>([]);
  const [notaPreviews, setNotaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize items from ajuan if available
  useEffect(() => {
    if (ajuan?.items && items.length === 0) {
      setItems(ajuan.items.map(i => ({
        id: i.id,
        nama: i.nama_item,
        qty: Number(i.qty),
        satuan: i.satuan || "pcs",
        harga: Number(i.harga)
      })));
    }
  }, [ajuan]);
  
  // Guard: Only allow reporting for disbursed budgets
  useEffect(() => {
    if (!isLoadingAjuan && ajuan && ajuan.status !== "dicairkan") {
      toast.error("Maaf, Anda hanya dapat membuat laporan untuk anggaran yang sudah dicairkan.");
      router.navigate({ to: "/ajuan/$id", params: { id: ajuan.id } });
    }
  }, [ajuan, isLoadingAjuan, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} terlalu besar (> 5MB)`);
        return false;
      }
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isImage && !isPdf) {
        toast.error(`File ${file.name} bukan gambar atau PDF`);
        return false;
      }
      return true;
    });

    setNotaFiles(prev => [...prev, ...validFiles]);
    setNotaPreviews(prev => [...prev, ...validFiles.map(f => f.type === "application/pdf" ? "PDF_FILE" : URL.createObjectURL(f))]);
  };

  const removeFile = (index: number) => {
    setNotaFiles(prev => prev.filter((_, i) => i !== index));
    setNotaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const totalDigunakan = useMemo(() => items.reduce((s, i) => s + i.qty * i.harga, 0), [items]);
  const sisaDana = (Number(ajuan?.total) || 0) - totalDigunakan;

  const submit = async () => {
    if (!ajuanId) { toast.error("Ajuan tidak valid"); return; }
    if (items.some(i => !i.nama.trim() || i.qty <= 0 || i.harga <= 0)) {
      toast.error("Lengkapi rincian penggunaan uang");
      return;
    }
    if (notaFiles.length === 0) {
      toast.error("Harap unggah minimal satu bukti nota/struk (Gambar/PDF)");
      return;
    }

    setIsUploading(true);
    try {
      const urls: string[] = [];
      toast.info(`Mengunggah ${notaFiles.length} bukti...`);
      
      for (const file of notaFiles) {
        let fileToUpload = file;
        if (file.type.startsWith("image/")) {
          fileToUpload = await compressImage(file);
        }
        const url = await uploadToCloudinary(fileToUpload, settings);
        urls.push(url);
      }

      await createLaporan.mutateAsync({
        ajuan_id: ajuanId,
        total_anggaran: Number(ajuan?.total),
        total_digunakan: totalDigunakan,
        sisa_dana: sisaDana,
        catatan,
        foto_nota_urls: urls,
        items: items.map(i => ({
          nama_item: i.nama,
          qty: i.qty,
          satuan: i.satuan,
          harga: i.harga
        }))
      });

      toast.success("Laporan berhasil diserahkan");
      router.navigate({ to: "/ajuan" });
    } catch (e: any) {
      toast.error("Gagal mengirim laporan", { description: e.message });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoadingAjuan) return <div className="py-20 text-center text-muted-foreground">Memuat data ajuan...</div>;
  if (!ajuan) return <div className="py-20 text-center text-muted-foreground">Ajuan tidak ditemukan</div>;

  return (
    <>
      <Link to="/ajuan" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar ajuan
      </Link>
      
      <PageHeader 
        title="Laporan Penggunaan Dana" 
        description={`Melaporkan realisasi anggaran untuk kode ${ajuan.kode}`}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Info Ajuan */}
          <div className="rounded-2xl border border-border bg-secondary/20 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Informasi Anggaran</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Judul Anggaran</p>
                <p className="font-semibold">{ajuan.judul}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Dana Dicairkan</p>
                <p className="font-bold text-primary">{formatRupiah(Number(ajuan.total))}</p>
              </div>
            </div>
          </div>

          {/* Rincian Realisasi */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Rincian Penggunaan Uang</h3>
              <button 
                onClick={() => setItems(prev => [...prev, { id: String(Date.now()), nama: "", qty: 1, satuan: "pcs", harga: 0 }])}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-primary/20 bg-primary/5 px-4 text-xs font-bold text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" /> Tambah Baris
              </button>
            </div>
            
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Item Pengeluaran</th>
                    <th className="px-4 py-3 w-20 text-center">Qty</th>
                    <th className="px-4 py-3 w-40 text-right">Harga Satuan</th>
                    <th className="px-4 py-3 w-40 text-right">Subtotal</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="px-2 py-2">
                        <input 
                          value={it.nama} 
                          onChange={e => setItems(prev => prev.map(i => i.id === it.id ? { ...i, nama: e.target.value } : i))}
                          className="h-10 w-full rounded-lg bg-background px-3 outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Contoh: Transportasi, Konsumsi..."
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number"
                          value={it.qty} 
                          onChange={e => setItems(prev => prev.map(i => i.id === it.id ? { ...i, qty: Number(e.target.value) } : i))}
                          className="h-10 w-full rounded-lg bg-background px-2 text-center outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number"
                          value={it.harga} 
                          onChange={e => setItems(prev => prev.map(i => i.id === it.id ? { ...i, harga: Number(e.target.value) } : i))}
                          className="h-10 w-full rounded-lg bg-background px-3 text-right outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-bold tabular-nums">
                        {formatRupiah(it.qty * it.harga)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button 
                          onClick={() => setItems(prev => prev.filter(i => i.id !== it.id))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Upload Nota */}
          <section>
            <h3 className="text-lg font-bold mb-4">Upload Nota / Struk Belanja</h3>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 transition-all hover:bg-primary/10 hover:border-primary">
                <Plus className="h-8 w-8 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase text-center px-2">Tambah Nota (Unlimited)</span>
                <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
              </label>
              
              {notaPreviews.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl border border-border bg-secondary/30 overflow-hidden group shadow-sm">
                  {url === "PDF_FILE" ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 bg-secondary/50">
                      <FileText className="h-8 w-8 text-primary" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">PDF</span>
                    </div>
                  ) : (
                    <img src={url} alt={`Nota ${idx+1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="h-10 w-10 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-4">Catatan Tambahan</h3>
            <textarea 
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="Berikan keterangan jika ada sisa dana atau kendala lainnya..."
              rows={4}
            />
          </section>
        </div>

        <aside>
          <div className="sticky top-10 rounded-3xl border border-border bg-card p-6 shadow-elevated">
            <h3 className="text-lg font-bold mb-6">Ringkasan Laporan</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1 rounded-2xl bg-secondary/50 p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Total Digunakan</span>
                <span className="text-2xl font-black text-foreground">{formatRupiah(totalDigunakan)}</span>
              </div>

              <div className={`flex flex-col gap-1 rounded-2xl p-4 ${sisaDana < 0 ? 'bg-destructive/10' : 'bg-emerald-500/10'}`}>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Sisa Dana</span>
                <span className={`text-2xl font-black ${sisaDana < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  {formatRupiah(sisaDana)}
                </span>
                {sisaDana < 0 && <p className="text-[10px] text-destructive font-bold">⚠️ Penggunaan melebihi anggaran!</p>}
              </div>

              <button 
                onClick={submit}
                disabled={isUploading || createLaporan.isPending}
                className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isUploading || createLaporan.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Kirim Laporan
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-muted-foreground mt-4 italic">
                Laporan ini akan ditinjau oleh Admin Keuangan.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
