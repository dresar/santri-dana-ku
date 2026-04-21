import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { instansiList, formatRupiah } from "@/lib/dummy-data";
import { useCreateAjuan } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2, Upload, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ajuan/baru")({
  head: () => ({ meta: [{ title: "Buat Ajuan Baru — E-Budgeting Pesantren" }] }),
  component: BuatAjuanPage,
});

interface Item { id: string; nama: string; qty: number; satuan: string; harga: number }

function BuatAjuanPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const createAjuan = useCreateAjuan();
  const [instansi, setInstansi] = useState(profile?.instansi || instansiList[0]);
  const [judul, setJudul] = useState("");
  const [rencana, setRencana] = useState("");
  const [items, setItems] = useState<Item[]>([{ id: "1", nama: "", qty: 1, satuan: "pcs", harga: 0 }]);
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const total = items.reduce((s, i) => s + i.qty * i.harga, 0);

  const addItem = () => setItems(prev => [...prev, { id: String(Date.now()), nama: "", qty: 1, satuan: "pcs", harga: 0 }]);
  const removeItem = (id: string) => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  const updateItem = (id: string, patch: Partial<Item>) => setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setBuktiFile(f); setBuktiPreview(URL.createObjectURL(f)); }
  };

  const submit = async () => {
    if (!judul.trim() || !rencana.trim()) { toast.error("Lengkapi judul dan rencana penggunaan"); return; }
    if (items.some(i => !i.nama.trim() || i.qty <= 0 || i.harga <= 0)) { toast.error("Lengkapi semua item dengan benar"); return; }
    if (!user) { toast.error("Sesi tidak valid"); return; }

    setUploading(true);
    let bukti_url: string | null = null;
    if (buktiFile) {
      const path = `${user.id}/${Date.now()}-${buktiFile.name}`;
      const { error: upErr } = await supabase.storage.from("bukti").upload(path, buktiFile);
      if (upErr) { toast.error("Upload bukti gagal", { description: upErr.message }); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("bukti").getPublicUrl(path);
      bukti_url = urlData.publicUrl;
    }

    try {
      await createAjuan.mutateAsync({
        judul, instansi, rencana_penggunaan: rencana,
        items: items.map(({ nama, qty, satuan, harga }) => ({ nama_item: nama, qty, satuan, harga })),
        bukti_url,
      });
      toast.success("Ajuan berhasil dikirim");
      router.navigate({ to: "/ajuan" });
    } catch (e) {
      toast.error("Gagal menyimpan ajuan", { description: (e as Error).message });
    } finally { setUploading(false); }
  };

  return (
    <>
      <Link to="/ajuan" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar ajuan
      </Link>
      <PageHeader title="Buat Ajuan Anggaran Baru" description="Lengkapi formulir di bawah dengan rincian kebutuhan anggaran" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold">Informasi Pengaju</h3>
            <p className="mb-4 text-xs text-muted-foreground">Data pengaju otomatis diisi dari profil Anda.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Pengaju">
                <input value={profile?.nama_lengkap ?? ""} disabled className="h-10 w-full rounded-lg border border-input bg-muted px-3 text-sm" />
              </Field>
              <Field label="Instansi / Bidang">
                <select value={instansi} onChange={e => setInstansi(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
                  {instansiList.map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Judul Ajuan" full>
                <input value={judul} onChange={e => setJudul(e.target.value)} placeholder="Judul singkat ajuan" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
              </Field>
              <Field label="Rencana Penggunaan" full>
                <textarea value={rencana} onChange={e => setRencana(e.target.value)} rows={3} placeholder="Jelaskan rencana penggunaan anggaran..." className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Rincian Belanja</h3>
                <p className="text-xs text-muted-foreground">Tambahkan setiap item dengan jumlah dan harga satuan.</p>
              </div>
              <button onClick={addItem} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" /> Tambah
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-semibold">Nama Item</th>
                    <th className="pb-2 font-semibold w-20">Qty</th>
                    <th className="pb-2 font-semibold w-24">Satuan</th>
                    <th className="pb-2 font-semibold w-40">Harga Satuan</th>
                    <th className="pb-2 font-semibold w-40 text-right">Subtotal</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id}>
                      <td className="pr-2 py-1.5"><input value={it.nama} onChange={e => updateItem(it.id, { nama: e.target.value })} placeholder="Nama barang/jasa" className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" /></td>
                      <td className="pr-2 py-1.5"><input type="number" min={1} value={it.qty} onChange={e => updateItem(it.id, { qty: Number(e.target.value) || 0 })} className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" /></td>
                      <td className="pr-2 py-1.5"><input value={it.satuan} onChange={e => updateItem(it.id, { satuan: e.target.value })} placeholder="pcs" className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" /></td>
                      <td className="pr-2 py-1.5"><input type="number" min={0} value={it.harga} onChange={e => updateItem(it.id, { harga: Number(e.target.value) || 0 })} className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-ring" /></td>
                      <td className="pr-2 py-1.5 text-right font-semibold tabular-nums">{formatRupiah(it.qty * it.harga)}</td>
                      <td className="py-1.5"><button onClick={() => removeItem(it.id)} className="flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td colSpan={4} className="pt-3 text-right text-sm font-semibold text-muted-foreground">Total Anggaran</td>
                    <td className="pt-3 text-right text-lg font-bold text-primary">{formatRupiah(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold">Bukti / Dokumen Pendukung</h3>
            <p className="mb-4 text-xs text-muted-foreground">Unggah penawaran harga, RAB, atau dokumen pendukung lainnya.</p>
            {buktiPreview ? (
              <div className="relative inline-block">
                <img src={buktiPreview} alt="Bukti" className="max-h-48 rounded-lg border border-border" />
                <button onClick={() => { setBuktiPreview(null); setBuktiFile(null); }} className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-soft"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center transition-colors hover:bg-secondary/60">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-semibold">Klik untuk unggah</p>
                <p className="text-xs text-muted-foreground">PNG, JPG hingga 5MB</p>
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </label>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold">Ringkasan</h3>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Pengaju" value={profile?.nama_lengkap ?? "—"} />
              <Row label="Instansi" value={instansi} />
              <Row label="Jumlah item" value={String(items.length)} />
              <div className="my-3 border-t border-border" />
              <div className="flex items-center justify-between">
                <dt className="text-sm font-semibold">Total Anggaran</dt>
                <dd className="text-lg font-bold text-primary">{formatRupiah(total)}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              <button onClick={submit} disabled={uploading || createAjuan.isPending} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {(uploading || createAjuan.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Kirim Ajuan
              </button>
            </div>
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
