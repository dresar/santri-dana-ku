import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { formatRupiah, statusBadgeClass, statusLabel } from "@/lib/utils";
import { useAjuanDetail } from "@/lib/queries";
import { ArrowLeft, Printer, Download, Calendar, User, Building2, FileText, Clock, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/ajuan/$id")({
  head: () => ({ meta: [{ title: "Detail Ajuan — E-Budgeting Pesantren" }] }),
  component: DetailAjuanPage,
});

function DetailAjuanPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useAjuanDetail(id);

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data?.ajuan) {
    throw notFound();
  }
  const ajuan = data.ajuan;

  return (
    <>
      <Link to="/ajuan" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar ajuan
      </Link>
      <PageHeader
        title={ajuan.judul}
        description={`Kode ajuan: ${ajuan.kode}`}
        actions={
          <>
            <button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary"><Printer className="h-4 w-4" /> Cetak</button>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary"><Download className="h-4 w-4" /> Unduh PDF</button>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-elevated">
            <div className="border-b border-slate-100 bg-slate-50/50 p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status Pengajuan</p>
                  <div className="inline-flex"><StatusBadge className={`${statusBadgeClass[ajuan.status]} px-4 py-2 text-xs font-bold uppercase`}>{statusLabel[ajuan.status]}</StatusBadge></div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Nominal Anggaran</p>
                  <p className="text-4xl font-black tracking-tighter text-primary">{formatRupiah(Number(ajuan.total))}</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                <InfoItem icon={User} label="Nama Pengaju" value={ajuan.pengaju_nama ?? "—"} />
                <InfoItem icon={Building2} label="Bidang / Instansi" value={ajuan.instansi} />
                <InfoItem icon={Calendar} label="Tanggal Pengajuan" value={new Date(ajuan.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })} />
                <InfoItem icon={FileText} label="Nomor Referensi" value={ajuan.kode} />
              </div>

              <div className="mt-10 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-8 rounded-full bg-primary/30" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Rencana Penggunaan Dana</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-6 leading-relaxed text-slate-700 shadow-inner">
                  {ajuan.rencana_penggunaan}
                </div>
              </div>

              {ajuan.catatan && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
                  <div className="mb-2 flex items-center gap-2 text-amber-700">
                    <Clock className="h-4 w-4" />
                    <p className="text-xs font-bold uppercase tracking-wider">Catatan Peninjauan</p>
                  </div>
                  <p className="text-sm text-amber-900">{ajuan.catatan}</p>
                </div>
              )}

              {(ajuan.bukti_url || ajuan.dokumen_anggaran_url) && (
                <div className="mt-10">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-1 w-8 rounded-full bg-primary/30" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Lampiran Dokumen / RAB</p>
                  </div>
                  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 transition-all hover:border-primary/30">
                    <img 
                      src={ajuan.bukti_url || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=800"} 
                      alt="Lampiran" 
                      className="max-h-[400px] w-full rounded-xl object-cover grayscale-[0.2] transition-all group-hover:grayscale-0" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <a href={ajuan.bukti_url ?? "#"} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-6 py-3 text-sm font-bold shadow-xl hover:scale-105 active:scale-95 transition-transform">Lihat Dokumen Asli</a>
                    </div>
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
