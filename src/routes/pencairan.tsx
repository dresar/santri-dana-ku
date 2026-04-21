import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, Toast } from "@/components/PageHeader";
import { ajuanData, formatRupiah } from "@/lib/dummy-data";
import { Search, Wallet, CheckCircle2, Upload, X, Building2, User, Calendar } from "lucide-react";

export const Route = createFileRoute("/pencairan")({
  head: () => ({ meta: [{ title: "Pencairan Dana — E-Budgeting Pesantren" }] }),
  component: PencairanPage,
});

const banks = ["Bank Syariah Indonesia (BSI)", "Bank Muamalat", "Bank Mandiri Syariah", "Bank Riau Kepri Syariah", "BCA Syariah"];

function PencairanPage() {
  const disetujui = ajuanData.filter(a => a.status === "disetujui" || a.status === "dicairkan");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(disetujui[0]?.id ?? null);
  const [bank, setBank] = useState(banks[0]);
  const [norek, setNorek] = useState("");
  const [pemilik, setPemilik] = useState("");
  const [bukti, setBukti] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const found = disetujui.filter(a => `${a.kode} ${a.judul}`.toLowerCase().includes(q.toLowerCase()));
  const selected = ajuanData.find(a => a.id === selectedId);

  const submit = () => {
    setToast(`Pencairan untuk ${selected?.kode} berhasil diproses`);
  };

  return (
    <AppLayout>
      <PageHeader title="Pencairan Dana" description="Proses pencairan untuk ajuan yang telah disetujui" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari kode ajuan..." className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
            </div>
            <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ajuan disetujui</p>
            <ul className="scrollbar-thin max-h-[480px] space-y-1.5 overflow-y-auto">
              {found.length === 0 ? <li className="rounded-lg p-4 text-center text-sm text-muted-foreground">Tidak ada hasil</li> : found.map(a => (
                <li key={a.id}>
                  <button onClick={() => setSelectedId(a.id)} className={`w-full rounded-lg border p-3 text-left transition-all ${selectedId === a.id ? "border-primary bg-primary-soft" : "border-border hover:bg-secondary/60"}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs font-semibold">{a.kode}</p>
                      {a.status === "dicairkan" && <CheckCircle2 className="h-4 w-4 text-info" />}
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold">{a.judul}</p>
                    <p className="mt-0.5 text-xs text-primary">{formatRupiah(a.total)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {selected ? (
            <>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Wallet className="h-5 w-5" /></div>
                  <div>
                    <p className="font-mono text-xs font-semibold text-muted-foreground">{selected.kode}</p>
                    <h3 className="font-bold">{selected.judul}</h3>
                  </div>
                  <p className="ml-auto text-2xl font-bold text-primary">{formatRupiah(selected.total)}</p>
                </div>
                <div className="grid gap-3 rounded-xl bg-secondary/40 p-4 sm:grid-cols-3">
                  <Info icon={User} label="Pengaju" value={selected.pengaju} />
                  <Info icon={Building2} label="Instansi" value={selected.instansi} />
                  <Info icon={Calendar} label="Tanggal" value={selected.tanggal} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h3 className="mb-4 font-semibold">Form Pencairan Dana</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold">Bank Tujuan</label>
                    <select value={bank} onChange={e => setBank(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
                      {banks.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold">Nomor Rekening</label>
                    <input value={norek} onChange={e => setNorek(e.target.value)} placeholder="7012345678" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold">Nama Pemilik Rekening</label>
                    <input value={pemilik} onChange={e => setPemilik(e.target.value)} placeholder="Nama sesuai buku rekening" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold">Bukti Transfer</label>
                    {bukti ? (
                      <div className="relative inline-block">
                        <img src={bukti} alt="Bukti transfer" className="max-h-44 rounded-lg border border-border" />
                        <button onClick={() => setBukti(null)} className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/30 p-6 text-center hover:bg-secondary/60">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-semibold">Klik untuk unggah bukti transfer</p>
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setBukti(URL.createObjectURL(f)); }} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary">Batal</button>
                  <button onClick={submit} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    <Wallet className="h-4 w-4" /> Proses Pencairan
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
              Pilih ajuan di sebelah kiri untuk memulai pencairan.
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
