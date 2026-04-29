import { useState } from "react";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/utils";
import { useAjuanDetail, useAnalyzeAjuan, useApproval, useSettings, useDeleteAjuan } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Printer, Download, Calendar, User, Building2, FileText, Clock, Loader2, Bot, Sparkles, X, Check, Mail, Phone, Trash2, CreditCard, Banknote, Landmark } from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

export const Route = createFileRoute("/ajuan/$id")({
  head: () => ({ meta: [{ title: "Detail Ajuan — E-Budgeting Pesantren" }] }),
  component: DetailAjuanPage,
});

const DEFAULT_SETTINGS = {
  nama: "Pesantren Modern Raudhatussalam Mahato",
  alamat: "Jl. Pesantren No. 01, Mahato, Riau",
  email: "info@raudhatussalam.sch.id",
  kontak: "0812-3456-7890",
  logo_url: null,
  ttd_url: null,
  show_ttd: true
};

function DetailAjuanPage() {
  const { id } = Route.useParams();
  const { data, isLoading, isError, error } = useAjuanDetail(id);

  const [catatanApproval, setCatatanApproval] = useState("");
  const approval = useApproval();
  const deleteAjuan = useDeleteAjuan();
  const { role: userRole, userId: currentUserId } = useAuth();
  const { data: settings } = useSettings();
  const router = useRouter();

  if (isLoading) return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Memuat detail ajuan...</p>
    </div>
  );

  if (isError) return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <X className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold">Gagal memuat data</h2>
      <p className="text-sm text-muted-foreground max-w-xs">{(error as Error)?.message || "Terjadi kesalahan saat mengambil data ajuan."}</p>
      <Link to="/ajuan" className="mt-2 text-sm font-bold text-primary hover:underline">Kembali ke Daftar</Link>
    </div>
  );

  if (!data) {
    throw notFound();
  }
  const ajuan = data;

  const handleAnalyze = async () => {
    setShowAi(true);
    if (aiResult) return; // already analyzed
    try {
      const res = await analyze.mutateAsync(id);
      setAiResult(res);
    } catch (err: any) {
      setAiResult(`Error: ${err.message}`);
    }
  };

  const isApprover = userRole === "admin" || userRole === "approver";
  const canApprove = isApprover && ajuan.status === "menunggu";

  const handleApprove = async (aksi: "disetujui" | "ditolak") => {
    try {
      await approval.mutateAsync({ ajuanId: id, aksi, catatan: catatanApproval || undefined });
      toast.success(aksi === "disetujui" ? "Ajuan disetujui" : "Ajuan ditolak");
    } catch (e: any) {
      toast.error("Gagal", { description: e.message });
    }
  };

  const handleDelete = async () => {
    const isOwner = ajuan.pengaju_id === currentUserId;
    const isPrivileged = userRole === "admin" || userRole === "approver";
    
    if (!isOwner && !isPrivileged) {
      toast.error("Anda tidak memiliki akses untuk menghapus ajuan ini.");
      return;
    }

    let reason = "";
    if (isPrivileged) {
      const input = prompt(`Masukkan alasan penghapusan untuk ajuan ${ajuan.kode}:`, "Kesalahan data / Pembatalan operasional");
      if (input === null) return;
      reason = input;
    } else {
      if (!confirm(`Apakah Anda yakin ingin menghapus ajuan ${ajuan.kode}?`)) return;
    }

    try {
      await deleteAjuan.mutateAsync({ id, reason });
      toast.success("Ajuan berhasil dihapus");
      router.navigate({ to: "/ajuan" });
    } catch (err: any) {
      toast.error("Gagal menghapus", { description: err.message });
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Ajuan_${ajuan.kode}_${ajuan.judul.replace(/\s+/g, '_')}`;
    window.print();
    document.title = originalTitle;
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById("print-document");
    if (!element) return;
    
    toast.info("Sedang menyiapkan file PDF...", { duration: 2000 });
    
    try {
      // Temporarily show the element for capture
      element.classList.remove("hidden");
      element.classList.add("block");
      element.style.position = "static";
      
      const dataUrl = await toPng(element, {
        quality: 0.7,
        pixelRatio: 1.2,
        backgroundColor: "#ffffff",
      });
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate height based on aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // If content is taller than one page, we might need multiple pages, 
      // but for "Ajuan" usually it fits in one or we just scale it.
      // Scaling to width:
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));
      
      const safeKode = (ajuan.kode || "dokumen").replace(/[^a-z0-9]/gi, '_');
      const filename = `Ajuan_${safeKode}.pdf`;

      const blob = pdf.output("blob");
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Re-hide the element
      element.classList.remove("block");
      element.classList.add("hidden");
      element.style.position = "fixed";
      
      toast.success("PDF berhasil diunduh");
    } catch (err: any) {
      console.error("PDF Error:", err);
      toast.error("Gagal membuat PDF", { description: "Terjadi kesalahan teknis saat merender dokumen." });
      // Clean up on error
      element.classList.remove("block");
      element.classList.add("hidden");
      element.style.position = "fixed";
    }
  };

  return (
    <>
      <Link to="/ajuan" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar ajuan
      </Link>
      <PageHeader
        title={ajuan.judul}
        description={`Kode ajuan: ${ajuan.kode}`}
        actions={
          <>
            <button onClick={handlePrint} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary print:hidden"><Printer className="h-4 w-4" /> Cetak</button>
            <button onClick={handleDownloadPdf} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 print:hidden"><Download className="h-4 w-4" /> Unduh PDF (Direct)</button>
            {ajuan.status === "dicairkan" && !ajuan.has_laporan && ajuan.pengaju_id === currentUserId && (
              <Link 
                to="/laporan/baru" 
                search={{ ajuanId: id }}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-soft hover:bg-emerald-700 print:hidden"
              >
                <FileText className="h-4 w-4" /> Buat Laporan Penggunaan
              </Link>
            )}
            {(userRole === "admin" ? ajuan.status !== "selesai" : (ajuan.pengaju_id === currentUserId && ["menunggu", "draft", "ditolak"].includes(ajuan.status))) && (
              <button 
                onClick={handleDelete} 
                disabled={deleteAjuan.isPending}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 print:hidden"
              >
                {deleteAjuan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Hapus
              </button>
            )}
          </>
        }
      />


      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevated">
            <div className="border-b border-border bg-secondary/30 p-5 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status Pengajuan</p>
                  <div className="inline-flex"><StatusBadge className={`${statusBadgeClass[ajuan.status]} px-4 py-2 text-xs font-bold uppercase`}>{statusLabel[ajuan.status]}</StatusBadge></div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Nominal Anggaran</p>
                  <p className="text-3xl md:text-4xl font-black tracking-tighter text-primary">{formatRupiah(Number(ajuan.total))}</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8">
              <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                <InfoItem icon={User} label="Nama Pengaju" value={ajuan.pengaju_nama ?? "—"} />
                <InfoItem icon={Building2} label="Bidang / Instansi" value={ajuan.instansi} />
                <InfoItem icon={Calendar} label="Tanggal Pengajuan" value={new Date(ajuan.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })} />
                <InfoItem icon={Check} label="Approver Ditargetkan" value={ajuan.target_approver_nama ?? "Semua Approver"} />
                <InfoItem 
                  icon={ajuan.metode_pencairan === 'transfer' ? Landmark : Banknote} 
                  label="Metode Pencairan" 
                  value={ajuan.metode_pencairan === 'transfer' ? `Transfer (${ajuan.bank || 'Bank'})` : "Tunai (Cash)"} 
                />
                {ajuan.metode_pencairan === 'transfer' && (
                  <InfoItem 
                    icon={CreditCard} 
                    label="Rekening Tujuan" 
                    value={`${ajuan.nomor_rekening} a.n ${ajuan.nama_rekening}`} 
                  />
                )}
                <InfoItem icon={FileText} label="Nomor Referensi" value={ajuan.kode} />
              </div>

              <div className="mt-8 md:mt-10 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-8 rounded-full bg-primary/30" />
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground">Rencana Penggunaan Dana</p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/10 p-4 md:p-6 leading-relaxed text-foreground shadow-inner text-sm md:text-base">
                  {ajuan.rencana_penggunaan}
                </div>
              </div>

              {ajuan.catatan && (
                <div className="mt-6 rounded-2xl border border-warning/20 bg-warning/5 p-6">
                  <div className="mb-2 flex items-center gap-2 text-warning">
                    <Clock className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-wider">Catatan Peninjauan</p>
                  </div>
                  <p className="text-sm text-foreground/90">{ajuan.catatan}</p>
                </div>
              )}

              {/* Lampiran */}
              {(ajuan.gambar_url || ajuan.bukti_url) && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-8 rounded-full bg-primary/30" />
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground">Lampiran Pendukung</p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {(ajuan.gambar_url || ajuan.bukti_url) && (
                      <div className="group relative overflow-hidden rounded-2xl border border-border bg-secondary/30 p-2 transition-all hover:border-primary/30">
                        <img 
                          src={ajuan.gambar_url || ajuan.bukti_url || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=800"} 
                          alt="Lampiran Gambar" 
                          className="max-h-[300px] w-full rounded-xl object-cover grayscale-[0.2] transition-all group-hover:grayscale-0" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                          <a href={ajuan.gambar_url || ajuan.bukti_url || "#"} target="_blank" rel="noreferrer" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-transform">Lihat Gambar Penuh</a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="mb-4 font-semibold">Rincian Belanja</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5 font-semibold">#</th>
                    <th className="px-3 py-2.5 font-semibold">Nama Item</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2.5 font-semibold">Satuan</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Harga</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r, i) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2.5 font-medium">{r.nama_item}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{r.qty}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.satuan ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatRupiah(Number(r.harga))}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatRupiah(Number(r.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary-soft/40">
                    <td colSpan={5} className="px-3 py-3 text-right text-sm font-semibold">Total</td>
                    <td className="px-3 py-3 text-right text-base font-bold text-primary">{formatRupiah(Number(ajuan.total))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {canApprove && (
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 shadow-soft">
              <h3 className="mb-2 text-lg font-bold text-primary flex items-center gap-2">
                <Check className="h-5 w-5" /> Keputusan Approval
              </h3>
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">Anda memiliki wewenang untuk menyetujui atau menolak ajuan ini. Tambahkan catatan jika perlu sebelum memproses.</p>
              <textarea 
                value={catatanApproval} 
                onChange={e => setCatatanApproval(e.target.value)} 
                rows={3} 
                placeholder="Tuliskan catatan atau alasan di sini (opsional)..." 
                className="mb-4 w-full rounded-xl border border-input bg-background p-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
              />
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => handleApprove("disetujui")} 
                  disabled={approval.isPending} 
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {approval.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                  Setujui Ajuan
                </button>
                <button 
                  onClick={() => handleApprove("ditolak")} 
                  disabled={approval.isPending} 
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-destructive/20 bg-destructive/10 px-6 font-bold text-destructive hover:bg-destructive/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {approval.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                  Tolak Ajuan
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><Clock className="h-4 w-4" /> Riwayat Aktivitas</h3>
          {data.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas approval.</p>
          ) : (
            <ol className="relative space-y-5 border-l-2 border-border pl-5">
              {data.history.map((t) => (
                <li key={t.id as string} className="relative">
                  <span className="absolute -left-[26px] flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-card" />
                  <p className="text-sm font-semibold capitalize">{t.aksi as string}</p>
                  <p className="text-xs text-muted-foreground">{(t.approver_nama as string) ?? "—"} • {new Date(t.created_at as string).toLocaleString("id-ID")}</p>
                  {t.catatan != null && <p className="mt-1 rounded-md bg-secondary/60 px-2 py-1 text-xs">{t.catatan as string}</p>}
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>

      <PrintLayout ajuan={ajuan} items={data.items} settings={settings || DEFAULT_SETTINGS} />
    </>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"><Icon className="h-4 w-4 text-muted-foreground" /></div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function PrintLayout({ ajuan, items, settings }: { ajuan: any; items: any[]; settings: any }) {
  const styles = {
    container: {
      backgroundColor: '#ffffff',
      color: '#000000',
      padding: '40px',
      fontFamily: 'serif',
      lineHeight: '1.5'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      borderBottom: '4px double #000000',
      paddingBottom: '24px',
      marginBottom: '32px'
    },
    logo: {
      height: '96px',
      width: '96px',
      objectFit: 'contain' as const
    },
    headerInfo: {
      flex: 1,
      textAlign: 'center' as const
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      margin: 0
    },
    address: {
      fontSize: '14px',
      fontStyle: 'italic',
      margin: '4px 0'
    },
    contact: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      fontSize: '12px',
      marginTop: '4px'
    },
    docTitle: {
      textAlign: 'center' as const,
      marginBottom: '32px'
    },
    docTitleH2: {
      fontSize: '20px',
      fontWeight: 'bold',
      textDecoration: 'underline',
      textTransform: 'uppercase' as const,
      margin: 0
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      fontSize: '14px',
      marginBottom: '32px'
    },
    infoItem: {
      display: 'grid',
      gridTemplateColumns: '120px 1fr'
    },
    infoLabel: {
      fontWeight: 'bold'
    },
    sectionTitle: {
      fontWeight: 'bold',
      fontSize: '14px',
      marginBottom: '8px'
    },
    rencanaBox: {
      fontSize: '14px',
      padding: '16px',
      border: '1px solid #000000',
      borderRadius: '8px',
      marginBottom: '32px'
    },
    table: {
      width: '100%',
      fontSize: '14px',
      borderCollapse: 'collapse' as const,
      border: '1px solid #000000',
      marginBottom: '40px'
    },
    th: {
      border: '1px solid #000000',
      padding: '8px 12px',
      textAlign: 'left' as const,
      backgroundColor: '#f1f5f9'
    },
    td: {
      border: '1px solid #000000',
      padding: '8px 12px'
    },
    tfoot: {
      fontWeight: 'bold',
      backgroundColor: '#f8fafc'
    },
    signatureSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: '48px',
      fontSize: '14px'
    },
    signatureBox: {
      textAlign: 'center' as const,
      width: '256px'
    },
    ttdImage: {
      height: '80px',
      objectFit: 'contain' as const,
      marginBottom: '8px'
    },
    footer: {
      position: 'absolute' as const,
      bottom: '40px',
      left: '40px',
      right: '40px',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '10px',
      color: '#94a3b8',
      borderTop: '1px solid #f1f5f9',
      paddingTop: '16px'
    }
  };

  return (
    <div id="print-document" className="hidden print:block fixed inset-0" style={styles.container}>
      {/* Kop Surat */}
      <div style={styles.header}>
        {settings.logo_url && <img src={settings.logo_url} crossOrigin="anonymous" style={styles.logo} alt="Logo" />}
        <div style={styles.headerInfo}>
          <h1 style={styles.title}>{settings.nama}</h1>
          <p style={styles.address}>{settings.alamat}</p>
          <div style={styles.contact}>
            <span>{settings.email}</span>
            <span>{settings.kontak}</span>
          </div>
        </div>
      </div>

      {/* Judul Dokumen */}
      <div style={styles.docTitle}>
        <h2 style={styles.docTitleH2}>SURAT PENGAJUAN ANGGARAN</h2>
        <p style={{ fontFamily: 'monospace', fontSize: '14px', marginTop: '4px' }}>Nomor: {ajuan.kode}</p>
      </div>

      {/* Informasi Utama */}
      <div style={styles.infoGrid}>
        <div style={styles.infoItem}><span style={styles.infoLabel}>Nama Pengaju</span><span>: {ajuan.pengaju_nama}</span></div>
        <div style={styles.infoItem}><span style={styles.infoLabel}>Bidang/Unit</span><span>: {ajuan.instansi}</span></div>
        <div style={styles.infoItem}><span style={styles.infoLabel}>Tanggal</span><span>: {new Date(ajuan.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
        <div style={styles.infoItem}><span style={styles.infoLabel}>Perihal</span><span>: {ajuan.judul}</span></div>
      </div>

      {/* Rencana Penggunaan */}
      <div>
        <h3 style={styles.sectionTitle}>Rencana Penggunaan Dana:</h3>
        <p style={styles.rencanaBox}>{ajuan.rencana_penggunaan}</p>
      </div>

      {/* Tabel Rincian */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: '40px', textAlign: 'center' }}>#</th>
            <th style={styles.th}>Deskripsi Kebutuhan</th>
            <th style={{ ...styles.th, width: '64px', textAlign: 'center' }}>Qty</th>
            <th style={{ ...styles.th, width: '80px' }}>Satuan</th>
            <th style={{ ...styles.th, width: '128px', textAlign: 'right' }}>Harga Satuan</th>
            <th style={{ ...styles.th, width: '128px', textAlign: 'right' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.id}>
              <td style={{ ...styles.td, textAlign: 'center' }}>{idx + 1}</td>
              <td style={styles.td}>{it.nama_item}</td>
              <td style={{ ...styles.td, textAlign: 'center' }}>{it.qty}</td>
              <td style={styles.td}>{it.satuan}</td>
              <td style={{ ...styles.td, textAlign: 'right' }}>{formatRupiah(Number(it.harga))}</td>
              <td style={{ ...styles.td, textAlign: 'right' }}>{formatRupiah(Number(it.subtotal))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={styles.tfoot}>
            <td colSpan={5} style={{ ...styles.td, textAlign: 'right' }}>TOTAL ANGGARAN</td>
            <td style={{ ...styles.td, textAlign: 'right' }}>{formatRupiah(Number(ajuan.total))}</td>
          </tr>
        </tfoot>
      </table>

      {/* Tanda Tangan */}
      <div style={styles.signatureSection}>
        <div style={styles.signatureBox}>
          <p style={{ marginBottom: '64px', textTransform: 'uppercase', fontWeight: 'bold' }}>Pengaju,</p>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{ajuan.pengaju_nama}</p>
          <p style={{ fontSize: '12px' }}>{ajuan.instansi}</p>
        </div>
        <div style={styles.signatureBox}>
          <p style={{ marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Mengetahui/Menyetujui,</p>
          <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
            {settings.show_ttd && settings.ttd_url && (
              <img src={settings.ttd_url} crossOrigin="anonymous" style={styles.ttdImage} alt="TTD" />
            )}
          </div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Pimpinan Pesantren</p>
          <p style={{ fontSize: '12px' }}>SantriDanaKu System</p>
        </div>
      </div>

      {/* Footer Print */}
      <div style={styles.footer}>
        <p>Dicetak otomatis melalui Sistem E-Budgeting SantriDanaKu</p>
        <p>{new Date().toLocaleString("id-ID")}</p>
      </div>
    </div>
  );
}
