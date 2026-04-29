import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useSettings, useVerifyReport, type Laporan } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Printer, Download, Calendar, User, FileText, Loader2, ImageIcon, CheckCircle2, AlertCircle, Check, X } from "lucide-react";
import { reportStatusBadgeClass, reportStatusLabel } from "@/lib/utils";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

export const Route = createFileRoute("/laporan/$id")({
  head: () => ({ meta: [{ title: "Detail Laporan Penggunaan — E-Budgeting Pesantren" }] }),
  component: DetailLaporanPage,
});

function DetailLaporanPage() {
  const { id } = Route.useParams();
  const { data: laporan, isLoading, isError } = useQuery<Laporan>({
    queryKey: ["laporan", id],
    queryFn: () => apiFetch(`/laporan/${id}`),
  });
  const { data: settings } = useSettings();
  const { role } = useAuth();
  const verify = useVerifyReport();

  const handleDownloadPdf = async () => {
    const element = document.getElementById("report-pdf-content");
    if (!element) return;
    
    toast.info("Menyiapkan PDF Laporan...");
    try {
      element.classList.remove("hidden");
      const canvas = await toPng(element, { quality: 1, pixelRatio: 2, backgroundColor: "#ffffff" });
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Page 1: Main Report
      const imgProps = pdf.getImageProperties(canvas);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(canvas, "PNG", 0, 0, pdfWidth, imgHeight);

      // Subsequent Pages: Receipts
      if (laporan.foto_nota_urls && laporan.foto_nota_urls.length > 0) {
        for (const url of laporan.foto_nota_urls) {
          if (url.toLowerCase().endsWith(".pdf")) continue; // Skip PDFs for now as they are hard to merge in browser

          try {
            pdf.addPage();
            pdf.setFontSize(10);
            pdf.text("Lampiran Bukti Nota", 10, 10);
            
            // Fetch image and convert to base64 to avoid CORS issues if possible, 
            // but since it's on Cloudinary we need anonymous access
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });

            const ratio = Math.min(pdfWidth / img.width, (pdfHeight - 20) / img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;
            pdf.addImage(img, "JPEG", (pdfWidth - w) / 2, 20, w, h);
          } catch (err) {
            console.error("Failed to add image to PDF:", url, err);
          }
        }
      }

      pdf.save(`Laporan_Lengkap_${laporan?.ajuan_kode}.pdf`);
      element.classList.add("hidden");
      toast.success("PDF Laporan Lengkap berhasil diunduh");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh PDF");
      element.classList.add("hidden");
    }
  };

  if (isLoading) return <div className="py-20 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /></div>;
  if (isError || !laporan) return <div className="py-20 text-center text-destructive">Laporan tidak ditemukan.</div>;

  return (
    <>
      <Link to="/ajuan" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <PageHeader 
        title={`Laporan Penggunaan: ${laporan.ajuan_judul}`}
        description={`Berdasarkan Ajuan ${laporan.ajuan_kode}`}
        actions={
          <button onClick={handleDownloadPdf} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
            <Download className="h-4 w-4" /> Unduh Laporan PDF
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-bold">Rincian Pengeluaran Real</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-right">Harga</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {laporan.items?.map((it) => (
                    <tr key={it.id}>
                      <td className="px-4 py-3 font-medium">{it.nama_item}</td>
                      <td className="px-4 py-3 text-center">{it.qty} {it.satuan}</td>
                      <td className="px-4 py-3 text-right">{formatRupiah(Number(it.harga))}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatRupiah(Number(it.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-secondary/30 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-right">Total Digunakan</td>
                    <td className="px-4 py-3 text-right text-primary">{formatRupiah(Number(laporan.total_digunakan))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Bukti Nota / Struk</h3>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
                {laporan.foto_nota_urls.length} Dokumen
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {laporan.foto_nota_urls.map((url, idx) => {
                const isPdf = url.toLowerCase().endsWith(".pdf");
                return (
                  <a 
                    key={idx} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-secondary/20 shadow-sm transition-all hover:shadow-md"
                  >
                    {isPdf ? (
                      <div className="flex h-full flex-col items-center justify-center gap-3 bg-secondary/30">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                          <FileText className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Dokumen PDF</span>
                      </div>
                    ) : (
                      <img src={url} alt={`Nota ${idx+1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="rounded-full bg-white/20 p-3 backdrop-blur-md">
                        <ImageIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-bold">Status Laporan</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs text-muted-foreground uppercase">Anggaran</span>
                <span className="font-bold">{formatRupiah(Number(laporan.total_anggaran))}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs text-muted-foreground uppercase">Realisasi</span>
                <span className="font-bold text-primary">{formatRupiah(Number(laporan.total_digunakan))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase">Sisa</span>
                <span className={`font-bold ${Number(laporan.sisa_dana) < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  {formatRupiah(Number(laporan.sisa_dana))}
                </span>
              </div>
            </div>
            {laporan.catatan && (
              <div className="mt-4 rounded-xl bg-secondary/50 p-4 text-xs italic">
                "{laporan.catatan}"
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className={`flex items-center gap-3 ${laporan.status === 'disetujui' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {laporan.status === 'disetujui' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              <div className="text-xs">
                <p className="font-bold">{laporan.status === 'disetujui' ? 'Laporan Terverifikasi' : 'Menunggu Verifikasi'}</p>
                <p className="text-muted-foreground">Diserahkan pada {new Date(laporan.created_at).toLocaleDateString("id-ID")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-bold uppercase text-[11px] text-muted-foreground tracking-widest">Status Verifikasi</h3>
            
            <div className="mb-6 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${reportStatusBadgeClass[laporan.status ?? 'menunggu']}`}>
                {reportStatusLabel[laporan.status ?? 'menunggu']}
              </span>
              <span className="text-[10px] text-muted-foreground">ID: {laporan.id.slice(0,8)}</span>
            </div>

            {laporan.status === 'menunggu' && (role === 'admin' || role === 'approver' || role === 'administrasi') ? (
              <div className="space-y-4">
                <textarea 
                  placeholder="Catatan verifikasi (opsional)..."
                  className="w-full rounded-xl border border-border bg-secondary/30 p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  id="catatan-verifikasi"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const catatan = (document.getElementById('catatan-verifikasi') as HTMLTextAreaElement).value;
                      verify.mutate({ id: laporan.id, status: 'disetujui', catatan });
                    }}
                    disabled={verify.isPending}
                    className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Terima Laporan
                  </button>
                  <button 
                    onClick={() => {
                      const catatan = (document.getElementById('catatan-verifikasi') as HTMLTextAreaElement).value;
                      if (!catatan) { toast.error("Berikan catatan alasan penolakan"); return; }
                      verify.mutate({ id: laporan.id, status: 'ditolak', catatan });
                    }}
                    disabled={verify.isPending}
                    className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive text-white text-xs font-bold hover:bg-destructive/90 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Tolak / Revisi
                  </button>
                </div>
              </div>
            ) : laporan.catatan_verifikasi && (
              <div className="rounded-xl bg-secondary/50 p-4 border-l-4 border-primary">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Catatan Verifikator:</p>
                <p className="text-xs italic">"{laporan.catatan_verifikasi}"</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Hidden content for PDF generation */}
      <div id="report-pdf-content" className="hidden p-10 bg-white text-black" style={{ width: "800px", fontFamily: "serif" }}>
        <div className="text-center border-b-4 border-double border-black pb-6 mb-8">
          <h1 className="text-2xl font-bold uppercase">{settings?.nama || "PESANTREN RAUDHATUSSALAM"}</h1>
          <p className="italic text-sm">{settings?.alamat}</p>
        </div>
        
        <h2 className="text-xl font-bold text-center underline uppercase mb-6">LAPORAN PENGGUNAAN DANA</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <p><strong>Kode Ajuan:</strong> {laporan.ajuan_kode}</p>
          <p><strong>Tanggal Laporan:</strong> {new Date(laporan.created_at).toLocaleDateString("id-ID")}</p>
          <p><strong>Pengaju:</strong> {laporan.pengaju_nama}</p>
          <p><strong>Judul:</strong> {laporan.ajuan_judul}</p>
        </div>

        <table className="w-full border-collapse border border-black text-sm mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-left">Item Pengeluaran</th>
              <th className="border border-black p-2 text-center w-20">Qty</th>
              <th className="border border-black p-2 text-right">Harga</th>
              <th className="border border-black p-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {laporan.items?.map(it => (
              <tr key={it.id}>
                <td className="border border-black p-2">{it.nama_item}</td>
                <td className="border border-black p-2 text-center">{it.qty} {it.satuan}</td>
                <td className="border border-black p-2 text-right">{formatRupiah(Number(it.harga))}</td>
                <td className="border border-black p-2 text-right">{formatRupiah(Number(it.subtotal))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-bold">
            <tr>
              <td colSpan={3} className="border border-black p-2 text-right">TOTAL REALISASI</td>
              <td className="border border-black p-2 text-right">{formatRupiah(Number(laporan.total_digunakan))}</td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-black p-2 text-right text-xs">TOTAL ANGGARAN AWAL</td>
              <td className="border border-black p-2 text-right text-xs">{formatRupiah(Number(laporan.total_anggaran))}</td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-black p-2 text-right text-xs">SISA DANA</td>
              <td className="border border-black p-2 text-right text-xs">{formatRupiah(Number(laporan.sisa_dana))}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8">
          <p className="font-bold mb-4">Lampiran Bukti Nota:</p>
          <div className="grid grid-cols-2 gap-4">
            {laporan.foto_nota_urls.map((url, idx) => (
              <div key={idx} className="border border-gray-300 p-1">
                <img src={url} crossOrigin="anonymous" alt="Nota" className="max-h-40 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex justify-between px-10">
          <div className="text-center">
            <p className="mb-20">Pelapor,</p>
            <p className="font-bold underline">{laporan.pengaju_nama}</p>
          </div>
          <div className="text-center">
            <p className="mb-20">Mengetahui, Pimpinan</p>
            <p className="font-bold underline">............................</p>
          </div>
        </div>
      </div>
    </>
  );
}
