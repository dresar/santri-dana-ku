import { StatusAjuan } from "./utils";

export interface AjuanItem {
  id: string;
  nama_item: string;
  qty: number;
  satuan: string;
  harga: number;
  subtotal: number;
}

export interface Ajuan {
  id: string;
  kode: string;
  judul: string;
  pengaju_nama: string;
  instansi: string;
  rencana_penggunaan: string;
  total: number;
  status: StatusAjuan;
  catatan: string | null;
  bukti_url: string | null;
  dokumen_anggaran_url?: string | null;
  created_at: string;
  items: AjuanItem[];
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_nama: string;
  aksi: string;
  modul: string;
  detail: any;
  created_at: string;
}

export interface Pencairan {
  id: string;
  ajuan_id: string;
  kode: string;
  judul: string;
  bank: string;
  no_rekening: string;
  nama_pemilik: string;
  jumlah: number;
  status: string;
  bukti_url: string | null;
  created_at: string;
}

// Initial Data
const INITIAL_AJUAN: Ajuan[] = [
  {
    id: "1",
    kode: "AJU-2025-1001",
    judul: "Pengadaan Laptop Sekretariat",
    pengaju_nama: "Ahmad Fauzi",
    instansi: "Sekretariat Pesantren",
    rencana_penggunaan: "Untuk operasional administrasi santri baru",
    total: 15000000,
    status: "disetujui",
    catatan: "Disetujui untuk 2 unit",
    bukti_url: null,
    created_at: "2025-04-10T08:00:00Z",
    items: [
      { id: "i1", nama_item: "Laptop ASUS", qty: 2, satuan: "unit", harga: 7500000, subtotal: 15000000 }
    ]
  },
  {
    id: "2",
    kode: "AJU-2025-1002",
    judul: "Renovasi Atap Dapur",
    pengaju_nama: "Siti Aminah",
    instansi: "Unit Dapur Umum",
    rencana_penggunaan: "Perbaikan atap bocor menjelang Ramadhan",
    total: 4500000,
    status: "menunggu",
    catatan: null,
    bukti_url: null,
    created_at: "2025-04-15T10:30:00Z",
    items: [
      { id: "i2", nama_item: "Seng Gelombang", qty: 20, satuan: "lembar", harga: 150000, subtotal: 3000000 },
      { id: "i3", nama_item: "Kayu Kaso", qty: 30, satuan: "batang", harga: 50000, subtotal: 1500000 }
    ]
  },
  {
    id: "3",
    kode: "AJU-2025-1003",
    judul: "Buku Paket Kurikulum 2025",
    pengaju_nama: "Ustadz Mansur",
    instansi: "Bidang Kurikulum",
    rencana_penggunaan: "Pembelian buku cetak untuk santri kelas 10",
    total: 12000000,
    status: "dicairkan",
    catatan: "Dokumen lengkap",
    bukti_url: null,
    created_at: "2025-04-05T09:15:00Z",
    items: [
      { id: "i4", nama_item: "Buku Akidah Akhlak", qty: 100, satuan: "eks", harga: 120000, subtotal: 12000000 }
    ]
  },
  {
    id: "4",
    kode: "AJU-2025-1004",
    judul: "Obat-obatan UKS Tahunan",
    pengaju_nama: "Dr. Lukman",
    instansi: "Unit Kesehatan Santri",
    rencana_penggunaan: "Stok obat-obatan dasar untuk setahun",
    total: 3500000,
    status: "menunggu",
    catatan: null,
    bukti_url: null,
    created_at: "2025-04-20T14:45:00Z",
    items: [
      { id: "i5", nama_item: "Paracetamol 500mg", qty: 50, satuan: "box", harga: 70000, subtotal: 3500000 }
    ]
  }
];

const INITIAL_AUDIT: AuditLog[] = [
  { id: "a1", user_id: "u1", user_nama: "Admin Utama", aksi: "persetujuan", modul: "ajuan_anggaran", detail: { id: "1", status: "disetujui" }, created_at: "2025-04-12T11:00:00Z" },
  { id: "a2", user_id: "u1", user_nama: "Admin Utama", aksi: "pencairan", modul: "pencairan", detail: { id: "3", jumlah: 12000000 }, created_at: "2025-04-08T15:20:00Z" }
];

const INITIAL_PENCAIRAN: Pencairan[] = [
  { id: "p1", ajuan_id: "3", kode: "AJU-2025-1003", judul: "Buku Paket Kurikulum 2025", bank: "BSI", no_rekening: "7123456789", nama_pemilik: "Penerbit Cahaya", jumlah: 12000000, status: "selesai", bukti_url: "https://example.com/doc.pdf", created_at: "2025-04-08T15:20:00Z" }
];

class MockStore {
  private ajuan: Ajuan[] = INITIAL_AJUAN;
  private audit: AuditLog[] = INITIAL_AUDIT;
  private pencairan: Pencairan[] = INITIAL_PENCAIRAN;

  constructor() {
    if (typeof window !== "undefined") {
      this.load();
    }
  }

  private save() {
    if (typeof window === "undefined") return;
    localStorage.setItem("santri_dana_ajuan", JSON.stringify(this.ajuan));
    localStorage.setItem("santri_dana_audit", JSON.stringify(this.audit));
    localStorage.setItem("santri_dana_pencairan", JSON.stringify(this.pencairan));
  }

  private load() {
    if (typeof window === "undefined") return;
    try {
      const a = localStorage.getItem("santri_dana_ajuan");
      const au = localStorage.getItem("santri_dana_audit");
      const p = localStorage.getItem("santri_dana_pencairan");
      if (a) this.ajuan = JSON.parse(a);
      if (au) this.audit = JSON.parse(au);
      if (p) this.pencairan = JSON.parse(p);
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
  }

  getAjuan() { return this.ajuan; }
  getAudit() { return this.audit; }
  getPencairan() { return this.pencairan; }

  getAjuanDetail(id: string) {
    return this.ajuan.find(a => a.id === id);
  }

  createAjuan(data: Partial<Ajuan>) {
    const newItem: Ajuan = {
      id: Math.random().toString(36).substr(2, 9),
      kode: `AJU-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      status: "menunggu",
      catatan: null,
      bukti_url: null,
      created_at: new Date().toISOString(),
      items: [],
      ...data
    } as Ajuan;
    this.ajuan.unshift(newItem);
    this.save();
    return newItem;
  }

  approveAjuan(id: string, aksi: "disetujui" | "ditolak", catatan?: string) {
    const idx = this.ajuan.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.ajuan[idx].status = aksi;
      this.ajuan[idx].catatan = catatan || null;
      this.audit.unshift({
        id: Math.random().toString(36).substr(2, 9),
        user_id: "admin",
        user_nama: "Admin Utama",
        aksi,
        modul: "ajuan_anggaran",
        detail: { id, aksi },
        created_at: new Date().toISOString()
      });
      this.save();
    }
  }

  createPencairan(data: any) {
    const ajuan = this.ajuan.find(a => a.id === data.ajuan_id);
    if (ajuan) {
      ajuan.status = "dicairkan";
      const newPencairan: Pencairan = {
        id: Math.random().toString(36).substr(2, 9),
        kode: ajuan.kode,
        judul: ajuan.judul,
        bank: data.bank,
        no_rekening: data.no_rekening,
        nama_pemilik: data.nama_pemilik,
        jumlah: data.jumlah,
        status: "selesai",
        bukti_url: data.bukti_url,
        created_at: new Date().toISOString(),
        ...data
      };
      this.pencairan.unshift(newPencairan);
      this.save();
      return newPencairan;
    }
  }
}

export const mockStore = new MockStore();
