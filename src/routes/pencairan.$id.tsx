import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
// Detail Route
import { formatRupiah } from "@/lib/utils";
import { usePencairanDetail, useSettings } from "@/lib/queries";
import { jsPDF } from "jspdf";
import { 
  FileText, 
  Wallet, 
  User, 
  Calendar, 
  Building2, 
  Download, 
  ArrowLeft, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Image as ImageIcon
} from "lucide-react";

export const Route = createFileRoute("/pencairan/$id")({
  head: () => ({ meta: [{ title: "Detail Pencairan Dana — E-Budgeting Pesantren" }] }),
  component: PencairanDetailPage,
});

function PencairanDetailPage() {
  const { id } = Route.useParams();
  const { data: pc, isLoading } = usePencairanDetail(id);
  const { data: settings } = useSettings("instansi");

  const downloadPDF = () => {
    if (!pc) return;
    try {
      toast.info("Sedang menyiapkan dokumen PDF...");
      const doc = new jsPDF();
      
      // Header background
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 45, 'F');
      
      // Logo placeholder / Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(settings?.nama?.substring(0, 1) || "R", 20, 30);
      
      doc.setFontSize(18);
      doc.text("BUKTI PENCAIRAN DANA", 40, 25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(settings?.nama || "Pesantren Modern Raudhatussalam Mahato", 40, 32);
      doc.text(settings?.alamat || "Mahato, Riau", 40, 37);

      // Content
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMASI TRANSAKSI", 20, 65);
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 67, 190, 67);
      
      doc.setFontSize(10);
      let y = 75;
      const row = (label: string, value: string, isBold = false) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 20, y);
        if (isBold) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");
        doc.text(": " + value, 70, y);
        y += 8;
      };

      row("Kode Referensi", pc.kode || "-");
      row("Judul Pengajuan", pc.judul || "-");
      row("Tanggal Pencairan", new Date(pc.created_at).toLocaleString("id-ID", { dateStyle: 'full' }));
      row("Waktu Transaksi", new Date(pc.created_at).toLocaleTimeString("id-ID"));
      row("Status", (pc.status || "selesai").toUpperCase(), true);
      
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("DETAIL PEMBAYARAN", 20, y);
      doc.line(20, y+2, 190, y+2);
      y += 12;
      doc.setFontSize(10);
      
      row("Metode", (pc.metode || "tunai").toUpperCase());
      if (pc.metode === "transfer") {
        row("Bank Tujuan", pc.bank || "-");
        row("Nomor Rekening", pc.no_rekening || "-");
        row("Atas Nama", pc.nama_pemilik || "-");
      } else {
        row("Penerima Tunai", pc.nama_pemilik || pc.pengaju_nama || "-");
      }
      
      y += 10;
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(20, y, 170, 20, 'F');
      doc.setTextColor(15, 118, 110); // emerald-700
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL DANA", 30, y + 13);
      doc.text(formatRupiah(Number(pc.jumlah)), 100, y + 13);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);

      y += 35;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("INFORMASI PIHAK TERKAIT", 20, y);
      doc.line(20, y+2, 190, y+2);
      y += 12;
      doc.setFontSize(10);
      row("Nama Pengaju", pc.pengaju_nama || "-");
      row("Petugas Administrasi", pc.diproses_nama || "Sistem");

      // Signatures
      y = 220;
      doc.setFont("helvetica", "bold");
      doc.text("Penerima,", 150, y, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text("(......................................)", 150, y + 30, { align: "center" });
      doc.text(pc.nama_pemilik || pc.pengaju_nama || "Nama Terang", 150, y + 35, { align: "center" });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Dokumen ini dihasilkan secara digital oleh E-Budgeting Pesantren.", 20, 285);
      doc.text("ID Transaksi: " + pc.id, 20, 289);
      doc.text("Waktu Cetak: " + new Date().toLocaleString("id-ID"), 190, 289, { align: "right" });

      doc.save(`Bukti_Pencairan_${pc.kode}.pdf`);
      toast.success("Bukti Pencairan berhasil diunduh");
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat PDF Bukti Pencairan");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!pc) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-rose-50 p-6 text-rose-500">
          <FileText className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold">Data Tidak Ditemukan</h2>
        <p className="text-muted-foreground">Detail pencairan yang Anda cari tidak tersedia atau telah dihapus.</p>
        <Link to="/pencairan" className="inline-flex items-center gap-2 font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Pencairan
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link 
          to="/pencairan" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Riwayat
        </Link>
        <div className="flex gap-2">
          {pc.bukti_url && (
            <a 
              href={pc.bukti_url} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold shadow-soft transition-all hover:bg-secondary"
            >
              <ExternalLink className="h-4 w-4" /> Buka Lampiran
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">{pc.kode}</p>
                <h1 className="text-2xl font-black tracking-tight">{pc.judul}</h1>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <DetailCard 
                icon={User} 
                label="Penerima / Pemilik" 
                value={pc.nama_pemilik || pc.pengaju_nama || "-"} 
              />
              <DetailCard 
                icon={Calendar} 
                label="Tanggal Pencairan" 
                value={new Date(pc.created_at).toLocaleString("id-ID", { dateStyle: 'full', timeStyle: 'short' })} 
              />
              <DetailCard 
                icon={Building2} 
                label="Metode Pembayaran" 
                value={pc.metode === "tunai" ? "TUNAI / CASH" : `TRANSFER (${pc.bank})`} 
              />
              {pc.metode === "transfer" && (
                <DetailCard 
                  icon={CreditCard} 
                  label="Nomor Rekening" 
                  value={pc.no_rekening || "-"} 
                />
              )}
            </div>

            <div className="mt-8 rounded-2xl bg-primary/[0.03] border border-primary/10 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary/60">Total Dana Dicairkan</p>
                  <p className="mt-1 text-4xl font-black text-primary tracking-tighter">
                    {formatRupiah(Number(pc.jumlah))}
                  </p>
                </div>
                <div className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="h-5 w-5" /> Terverifikasi
                </div>
              </div>
            </div>
          </div>

          {/* Visual Proofs */}
          <div className="grid gap-6 sm:grid-cols-2">
             <ProofSection 
               title="Lampiran Anggaran" 
               url={pc.bukti_url} 
               icon={FileText}
             />
             <ProofSection 
               title="Bukti Penyerahan" 
               url={pc.bukti_penyerahan_url} 
               icon={ImageIcon}
             />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-bold">Informasi Proses</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Diproses Oleh</span>
                <span className="font-bold text-foreground">{pc.diproses_nama || "Sistem"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status Transaksi</span>
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700">
                  {pc.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Waktu Update</span>
                <span className="font-medium">{new Date(pc.updated_at).toLocaleDateString("id-ID")}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-soft">
            <h3 className="mb-3 font-bold text-blue-400">Pemberitahuan</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Data pencairan ini merupakan dokumen sah yang telah melalui proses verifikasi oleh bagian administrasi dan pimpinan pesantren.
            </p>
            <button 
              onClick={downloadPDF} 
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold backdrop-blur-md transition-all hover:bg-white/20"
            >
              <Download className="h-4 w-4" /> Download Bukti PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-2">
      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-bold text-foreground leading-snug">{value}</p>
      </div>
    </div>
  );
}

function ProofSection({ title, url, icon: Icon }: { title: string; url?: string; icon: any }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-bold">{title}</h4>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      {url ? (
        <a 
          href={url} 
          target="_blank" 
          rel="noreferrer" 
          className="group relative block aspect-video overflow-hidden rounded-2xl border border-border"
        >
          <img 
            src={url} 
            alt={title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Download className="h-8 w-8 text-white mb-2" />
            <span className="text-[10px] font-black uppercase text-white tracking-widest">Download / Buka</span>
          </div>
        </a>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary/30">
          <p className="text-xs italic text-muted-foreground">Tidak ada lampiran</p>
        </div>
      )}
    </div>
  );
}
