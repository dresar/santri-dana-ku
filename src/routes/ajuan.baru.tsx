import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { instansiList, formatRupiah } from "@/lib/utils";
import { useCreateAjuan } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
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
  const [pengajuNama, setPengajuNama] = useState(profile?.nama_lengkap || "");
  const [items, setItems] = useState<Item[]>([{ id: "1", nama: "", qty: 1, satuan: "pcs", harga: 0 }]);
  const [submitted, setSubmitted] = useState(false);

  const total = items.reduce((s, i) => s + i.qty * i.harga, 0);

  const addItem = () => setItems(prev => [...prev, { id: String(Date.now()), nama: "", qty: 1, satuan: "pcs", harga: 0 }]);
  const removeItem = (id: string) => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  const updateItem = (id: string, patch: Partial<Item>) => setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

  const submit = async () => {
    if (!pengajuNama.trim()) { toast.error("Masukkan nama pengaju"); return; }
    if (!judul.trim() || !rencana.trim()) { toast.error("Lengkapi judul dan rencana penggunaan"); return; }
    if (items.some(i => !i.nama.trim() || i.qty <= 0 || i.harga <= 0)) { toast.error("Lengkapi semua rincian belanja"); return; }

    try {
      await createAjuan.mutateAsync({
        judul, 
        instansi, 
        rencana_penggunaan: rencana,
        pengaju_nama: pengajuNama,
        items: items.map(({ nama, qty, satuan, harga }) => ({ nama_item: nama, qty, satuan, harga })),
      });
      toast.success("Ajuan Berhasil Dikirim");
      if (!user) {
        setSubmitted(true);
      } else {
        router.navigate({ to: "/ajuan" });
      }
    } catch (e) {
      toast.error("Gagal mengirim ajuan");
    }
  };

  if (submitted) {
    return (
      <div className="py-12 text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20 text-success shadow-soft">
          <Send className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Alhamdulillah!</h2>
        <p className="mt-2 text-slate-600">
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
      <div className="mb-8 border-b border-slate-100 pb-2">
        <h2 className="text-xl font-bold text-slate-800">Formulir Pengajuan Anggaran</h2>
        <p className="text-sm text-slate-500">Mohon isi data di bawah dengan jujur dan lengkap untuk keperluan audit.</p>
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
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </Field>
              <Field label="Instansi / Bidang">
                <select 
                  value={instansi} 
                  onChange={e => setInstansi(e.target.value)} 
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right:10px_center] bg-no-repeat"
                >
                  {instansiList.map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Judul Penggunaan Dana" full>
                <input 
                  value={judul} 
                  onChange={e => setJudul(e.target.value)} 
                  placeholder="Contoh: Pembelian Kitab Santri Baru" 
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </Field>
              <Field label="Rencana & Tujuan Penggunaan" full>
                <textarea 
                  value={rencana} 
                  onChange={e => setRencana(e.target.value)} 
                  rows={4} 
                  placeholder="Jelaskan secara rinci untuk apa anggaran ini digunakan..." 
                  className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                />
              </Field>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Rincian Estimasi Biaya</h3>
              <button 
                onClick={addItem} 
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-primary/20 bg-primary/5 px-4 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-4 w-4" /> Tambah Baris
              </button>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-1 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-bold">Nama Kebutuhan</th>
                      <th className="px-4 py-3 font-bold w-24">Jumlah</th>
                      <th className="px-4 py-3 font-bold w-28">Satuan</th>
                      <th className="px-4 py-3 font-bold w-44">Harga Satuan (Rp)</th>
                      <th className="px-4 py-3 font-bold text-right">Total (Rp)</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(it => (
                      <tr key={it.id} className="bg-white">
                        <td className="px-2 py-3"><input value={it.nama} onChange={e => updateItem(it.id, { nama: e.target.value })} placeholder="Barang/Jasa" className="h-10 w-full rounded-lg bg-slate-50 px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20" /></td>
                        <td className="px-2 py-3"><input type="number" min={1} value={it.qty} onChange={e => updateItem(it.id, { qty: Number(e.target.value) || 0 })} className="h-10 w-full rounded-lg bg-slate-50 px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-center" /></td>
                        <td className="px-2 py-3"><input value={it.satuan} onChange={e => updateItem(it.id, { satuan: e.target.value })} placeholder="pcs" className="h-10 w-full rounded-lg bg-slate-50 px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-center" /></td>
                        <td className="px-2 py-3"><input type="number" min={0} value={it.harga} onChange={e => updateItem(it.id, { harga: Number(e.target.value) || 0 })} className="h-10 w-full rounded-lg bg-slate-50 px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-right" /></td>
                        <td className="px-4 py-3 text-right font-bold text-slate-700 tabular-nums">{formatRupiah(it.qty * it.harga)}</td>
                        <td className="px-2 py-3"><button onClick={() => removeItem(it.id)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-elevated">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Ringkasan Ajuan</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-4">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Anggaran Dibutuhkan</span>
                <span className="text-3xl font-black text-primary tracking-tight">{formatRupiah(total)}</span>
              </div>
              
              <div className="space-y-3 px-1 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Pengaju</span>
                  <span className="font-bold text-slate-800">{pengajuNama || "—"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Bidang</span>
                  <span className="font-bold text-slate-800">{instansi}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Jumlah Item</span>
                  <span className="font-bold text-slate-800">{items.length} Barang</span>
                </div>
              </div>
            </div>

            <button 
              onClick={submit} 
              disabled={createAjuan.isPending} 
              className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {createAjuan.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  Kirim Ajuan Sekarang
                </>
              )}
            </button>
            <p className="mt-4 text-center text-[11px] text-slate-400">
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
