import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { ajuanData, formatRupiah, statusBadgeClass, statusLabel, type Ajuan } from "@/lib/dummy-data";
import { ArrowLeft, Printer, Download, Calendar, User, Building2, FileText, Clock } from "lucide-react";

export const Route = createFileRoute("/ajuan/$id")({
  loader: ({ params }): { ajuan: Ajuan } => {
    const ajuan = ajuanData.find(a => a.id === params.id);
    if (!ajuan) throw notFound();
    return { ajuan };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.ajuan.kode ?? "Ajuan"} — E-Budgeting Pesantren` }] }),
  component: DetailAjuanPage,
  notFoundComponent: () => (
    <AppLayout>
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <p className="text-lg font-semibold">Ajuan tidak ditemukan</p>
        <Link to="/ajuan" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">Kembali ke daftar</Link>
      </div>
    </AppLayout>
  ),
});

function DetailAjuanPage() {
  const { ajuan } = Route.useLoaderData() as { ajuan: Ajuan };

  return (
    <AppLayout>
      <Link to="/ajuan" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar ajuan
      </Link>
      <PageHeader
        title={ajuan.judul}
        description={`Kode ajuan: ${ajuan.kode}`}
        actions={
          <>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary"><Printer className="h-4 w-4" /> Cetak</button>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary"><Download className="h-4 w-4" /> Unduh PDF</button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                <div className="mt-1.5"><StatusBadge className={statusBadgeClass[ajuan.status]}>{statusLabel[ajuan.status]}</StatusBadge></div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Ajuan</p>
                <p className="mt-1 text-2xl font-bold text-primary">{formatRupiah(ajuan.total)}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem icon={User} label="Pengaju" value={ajuan.pengaju} />
              <InfoItem icon={Building2} label="Instansi" value={ajuan.instansi} />
              <InfoItem icon={Calendar} label="Tanggal Diajukan" value={ajuan.tanggal} />
              <InfoItem icon={FileText} label="Kode Ajuan" value={ajuan.kode} />
            </div>
            <div className="mt-5 rounded-xl bg-secondary/40 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rencana Penggunaan</p>
              <p className="text-sm leading-relaxed">{ajuan.rencana}</p>
            </div>
            {ajuan.catatan && (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-destructive">Catatan Reviewer</p>
                <p className="text-sm">{ajuan.catatan}</p>
              </div>
            )}
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
                    <th className="px-3 py-2.5 text-right font-semibold">Harga Satuan</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ajuan.rincian.map((r, i) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2.5 font-medium">{r.nama}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{r.qty}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatRupiah(r.harga)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatRupiah(r.qty * r.harga)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary-soft/40">
                    <td colSpan={4} className="px-3 py-3 text-right text-sm font-semibold">Total</td>
                    <td className="px-3 py-3 text-right text-base font-bold text-primary">{formatRupiah(ajuan.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><Clock className="h-4 w-4" /> Riwayat Aktivitas</h3>
          <ol className="relative space-y-5 border-l-2 border-border pl-5">
            {ajuan.timeline.map((t, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[26px] flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-card" />
                <p className="text-sm font-semibold">{t.aksi}</p>
                <p className="text-xs text-muted-foreground">{t.aktor} • {t.waktu}</p>
                {t.catatan && <p className="mt-1 rounded-md bg-secondary/60 px-2 py-1 text-xs">{t.catatan}</p>}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </AppLayout>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
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
