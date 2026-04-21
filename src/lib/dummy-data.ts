export type StatusAjuan = "draft" | "menunggu" | "disetujui" | "ditolak" | "dicairkan";

export interface RincianBelanja {
  id: string;
  nama: string;
  qty: number;
  harga: number;
}

export interface Ajuan {
  id: string;
  kode: string;
  judul: string;
  pengaju: string;
  instansi: string;
  rencana: string;
  tanggal: string;
  total: number;
  status: StatusAjuan;
  rincian: RincianBelanja[];
  catatan?: string;
  timeline: { waktu: string; aktor: string; aksi: string; catatan?: string }[];
}

export const instansiList = [
  "Sekretariat Pesantren",
  "Bidang Kurikulum",
  "Bidang Kesantrian",
  "Bidang Sarana Prasarana",
  "Bidang Keuangan",
  "Unit Dapur Umum",
  "Unit Kesehatan Santri",
  "Unit Perpustakaan",
];

export const ajuanData: Ajuan[] = [
  {
    id: "1",
    kode: "AJU-2025-0421",
    judul: "Pengadaan Kitab Kuning Santri Baru",
    pengaju: "Ust. Ahmad Fauzi",
    instansi: "Bidang Kurikulum",
    rencana: "Pembelian kitab kuning untuk 120 santri baru tahun ajaran 2025/2026 sebagai penunjang kegiatan belajar mengajar pondok.",
    tanggal: "2025-04-18",
    total: 14_400_000,
    status: "menunggu",
    rincian: [
      { id: "r1", nama: "Kitab Safinatun Najah", qty: 120, harga: 35_000 },
      { id: "r2", nama: "Kitab Ta'limul Muta'allim", qty: 120, harga: 45_000 },
      { id: "r3", nama: "Kitab Jurumiyah", qty: 120, harga: 40_000 },
    ],
    timeline: [
      { waktu: "2025-04-18 09:14", aktor: "Ust. Ahmad Fauzi", aksi: "Mengajukan anggaran" },
      { waktu: "2025-04-18 10:02", aktor: "Sistem", aksi: "Diteruskan ke Bagian Keuangan" },
    ],
  },
  {
    id: "2",
    kode: "AJU-2025-0420",
    judul: "Renovasi Asrama Putra Blok B",
    pengaju: "Ust. Hasan Basri",
    instansi: "Bidang Sarana Prasarana",
    rencana: "Renovasi atap dan pengecatan ulang asrama putra blok B yang mengalami kebocoran.",
    tanggal: "2025-04-15",
    total: 28_750_000,
    status: "disetujui",
    rincian: [
      { id: "r1", nama: "Genteng metal", qty: 250, harga: 65_000 },
      { id: "r2", nama: "Cat tembok 25kg", qty: 12, harga: 425_000 },
      { id: "r3", nama: "Upah tukang (10 hari)", qty: 5, harga: 1_500_000 },
    ],
    timeline: [
      { waktu: "2025-04-15 08:00", aktor: "Ust. Hasan Basri", aksi: "Mengajukan anggaran" },
      { waktu: "2025-04-16 14:22", aktor: "KH. Abdurrahman", aksi: "Disetujui", catatan: "Segera dilaksanakan sebelum musim hujan" },
    ],
  },
  {
    id: "3",
    kode: "AJU-2025-0419",
    judul: "Konsumsi Acara Haflah Akhirussanah",
    pengaju: "Ustz. Maryam",
    instansi: "Unit Dapur Umum",
    rencana: "Penyediaan konsumsi untuk 1.500 tamu undangan acara haflah akhirussanah.",
    tanggal: "2025-04-12",
    total: 22_500_000,
    status: "dicairkan",
    rincian: [
      { id: "r1", nama: "Nasi kotak premium", qty: 1500, harga: 15_000 },
    ],
    timeline: [
      { waktu: "2025-04-12 07:30", aktor: "Ustz. Maryam", aksi: "Mengajukan anggaran" },
      { waktu: "2025-04-13 09:11", aktor: "KH. Abdurrahman", aksi: "Disetujui" },
      { waktu: "2025-04-14 11:45", aktor: "Bag. Keuangan", aksi: "Dana dicairkan ke BSI 7012345678" },
    ],
  },
  {
    id: "4",
    kode: "AJU-2025-0418",
    judul: "Pengadaan Obat-obatan Klinik",
    pengaju: "Ust. Yusuf",
    instansi: "Unit Kesehatan Santri",
    rencana: "Restock obat-obatan dasar dan vitamin untuk klinik pesantren periode April–Juni.",
    tanggal: "2025-04-10",
    total: 6_850_000,
    status: "ditolak",
    rincian: [
      { id: "r1", nama: "Paket obat dasar", qty: 1, harga: 4_850_000 },
      { id: "r2", nama: "Multivitamin santri", qty: 100, harga: 20_000 },
    ],
    catatan: "Mohon revisi rincian, sertakan harga satuan obat",
    timeline: [
      { waktu: "2025-04-10 10:00", aktor: "Ust. Yusuf", aksi: "Mengajukan anggaran" },
      { waktu: "2025-04-11 13:20", aktor: "KH. Abdurrahman", aksi: "Ditolak", catatan: "Mohon revisi rincian, sertakan harga satuan obat" },
    ],
  },
  {
    id: "5",
    kode: "AJU-2025-0417",
    judul: "Buku Bacaan Perpustakaan",
    pengaju: "Ustz. Khadijah",
    instansi: "Unit Perpustakaan",
    rencana: "Pengadaan 200 judul buku bacaan baru untuk perpustakaan pesantren.",
    tanggal: "2025-04-08",
    total: 9_500_000,
    status: "menunggu",
    rincian: [
      { id: "r1", nama: "Buku bacaan campur", qty: 200, harga: 47_500 },
    ],
    timeline: [
      { waktu: "2025-04-08 14:05", aktor: "Ustz. Khadijah", aksi: "Mengajukan anggaran" },
    ],
  },
  {
    id: "6",
    kode: "AJU-2025-0416",
    judul: "Seragam Olahraga Santri",
    pengaju: "Ust. Ridwan",
    instansi: "Bidang Kesantrian",
    rencana: "Pengadaan seragam olahraga untuk 350 santri.",
    tanggal: "2025-04-05",
    total: 31_500_000,
    status: "disetujui",
    rincian: [{ id: "r1", nama: "Kaos & celana training", qty: 350, harga: 90_000 }],
    timeline: [
      { waktu: "2025-04-05 09:00", aktor: "Ust. Ridwan", aksi: "Mengajukan anggaran" },
      { waktu: "2025-04-06 10:30", aktor: "KH. Abdurrahman", aksi: "Disetujui" },
    ],
  },
  {
    id: "7",
    kode: "AJU-2025-0415",
    judul: "Perbaikan Pompa Air Sumur Bor",
    pengaju: "Ust. Hasan Basri",
    instansi: "Bidang Sarana Prasarana",
    rencana: "Penggantian pompa air sumur bor utama yang mengalami kerusakan.",
    tanggal: "2025-04-03",
    total: 4_750_000,
    status: "dicairkan",
    rincian: [{ id: "r1", nama: "Pompa Shimizu PC-375", qty: 1, harga: 4_750_000 }],
    timeline: [
      { waktu: "2025-04-03 08:15", aktor: "Ust. Hasan Basri", aksi: "Mengajukan anggaran" },
      { waktu: "2025-04-03 14:00", aktor: "KH. Abdurrahman", aksi: "Disetujui" },
      { waktu: "2025-04-04 09:00", aktor: "Bag. Keuangan", aksi: "Dana dicairkan" },
    ],
  },
  {
    id: "8",
    kode: "AJU-2025-0414",
    judul: "ATK Sekretariat Bulan April",
    pengaju: "Ustz. Aisyah",
    instansi: "Sekretariat Pesantren",
    rencana: "Pengadaan ATK rutin sekretariat bulan April.",
    tanggal: "2025-04-01",
    total: 2_350_000,
    status: "draft",
    rincian: [{ id: "r1", nama: "Paket ATK", qty: 1, harga: 2_350_000 }],
    timeline: [{ waktu: "2025-04-01 10:00", aktor: "Ustz. Aisyah", aksi: "Membuat draft" }],
  },
];

export const statistikDashboard = {
  totalAjuan: 142,
  menunggu: 18,
  disetujui: 76,
  dicairkan: 41,
  ditolak: 7,
  totalNilai: 1_284_500_000,
};

export const grafikBulanan = [
  { bulan: "Okt", ajuan: 18, disetujui: 14, dicairkan: 12 },
  { bulan: "Nov", ajuan: 22, disetujui: 19, dicairkan: 17 },
  { bulan: "Des", ajuan: 28, disetujui: 24, dicairkan: 22 },
  { bulan: "Jan", ajuan: 19, disetujui: 16, dicairkan: 15 },
  { bulan: "Feb", ajuan: 24, disetujui: 21, dicairkan: 18 },
  { bulan: "Mar", ajuan: 31, disetujui: 26, dicairkan: 23 },
  { bulan: "Apr", ajuan: 20, disetujui: 12, dicairkan: 8 },
];

export const grafikInstansi = [
  { instansi: "Sarpras", nilai: 312_000_000 },
  { instansi: "Kurikulum", nilai: 184_500_000 },
  { instansi: "Dapur", nilai: 268_000_000 },
  { instansi: "Kesantrian", nilai: 156_000_000 },
  { instansi: "Kesehatan", nilai: 92_000_000 },
  { instansi: "Sekretariat", nilai: 64_000_000 },
];

export const aktivitasTerbaru = [
  { waktu: "5 menit lalu", aktor: "KH. Abdurrahman", aksi: "menyetujui", target: "AJU-2025-0420 — Renovasi Asrama Putra" },
  { waktu: "32 menit lalu", aktor: "Ust. Ahmad Fauzi", aksi: "membuat ajuan", target: "AJU-2025-0421 — Pengadaan Kitab Kuning" },
  { waktu: "1 jam lalu", aktor: "Bag. Keuangan", aksi: "mencairkan dana", target: "AJU-2025-0419 — Konsumsi Haflah" },
  { waktu: "3 jam lalu", aktor: "KH. Abdurrahman", aksi: "menolak", target: "AJU-2025-0418 — Obat-obatan Klinik" },
  { waktu: "Kemarin", aktor: "Ustz. Khadijah", aksi: "membuat ajuan", target: "AJU-2025-0417 — Buku Perpustakaan" },
];

export interface Pengguna {
  id: string;
  nama: string;
  email: string;
  role: "Admin" | "Staff" | "Viewer";
  instansi: string;
  status: "Aktif" | "Nonaktif";
  terakhirLogin: string;
}

export const penggunaData: Pengguna[] = [
  { id: "u1", nama: "KH. Abdurrahman", email: "kyai@raudhatussalam.id", role: "Admin", instansi: "Pimpinan", status: "Aktif", terakhirLogin: "2025-04-21 06:30" },
  { id: "u2", nama: "Ust. Ahmad Fauzi", email: "fauzi@raudhatussalam.id", role: "Staff", instansi: "Bidang Kurikulum", status: "Aktif", terakhirLogin: "2025-04-21 08:14" },
  { id: "u3", nama: "Ustz. Maryam", email: "maryam@raudhatussalam.id", role: "Staff", instansi: "Unit Dapur Umum", status: "Aktif", terakhirLogin: "2025-04-20 19:00" },
  { id: "u4", nama: "Ust. Hasan Basri", email: "hasan@raudhatussalam.id", role: "Staff", instansi: "Sarana Prasarana", status: "Aktif", terakhirLogin: "2025-04-21 07:45" },
  { id: "u5", nama: "Ust. Yusuf", email: "yusuf@raudhatussalam.id", role: "Staff", instansi: "Unit Kesehatan", status: "Aktif", terakhirLogin: "2025-04-19 10:22" },
  { id: "u6", nama: "Ustz. Khadijah", email: "khadijah@raudhatussalam.id", role: "Staff", instansi: "Perpustakaan", status: "Aktif", terakhirLogin: "2025-04-20 13:11" },
  { id: "u7", nama: "Auditor Internal", email: "audit@raudhatussalam.id", role: "Viewer", instansi: "Pengawas", status: "Aktif", terakhirLogin: "2025-04-18 09:00" },
  { id: "u8", nama: "Ust. Mahmud", email: "mahmud@raudhatussalam.id", role: "Staff", instansi: "Bidang Kesantrian", status: "Nonaktif", terakhirLogin: "2025-03-12 15:40" },
];

export interface Notifikasi {
  id: string;
  judul: string;
  pesan: string;
  waktu: string;
  jenis: "info" | "success" | "warning" | "error";
  dibaca: boolean;
}

export const notifikasiData: Notifikasi[] = [
  { id: "n1", judul: "Ajuan baru menunggu persetujuan", pesan: "AJU-2025-0421 dari Bidang Kurikulum perlu ditinjau.", waktu: "5 menit lalu", jenis: "info", dibaca: false },
  { id: "n2", judul: "Ajuan disetujui", pesan: "AJU-2025-0420 telah disetujui oleh KH. Abdurrahman.", waktu: "1 jam lalu", jenis: "success", dibaca: false },
  { id: "n3", judul: "Pencairan berhasil", pesan: "Dana sebesar Rp 22.500.000 telah dicairkan.", waktu: "3 jam lalu", jenis: "success", dibaca: true },
  { id: "n4", judul: "Ajuan ditolak", pesan: "AJU-2025-0418 ditolak. Mohon revisi rincian.", waktu: "Kemarin", jenis: "error", dibaca: true },
  { id: "n5", judul: "Pengingat dokumen", pesan: "Lengkapi dokumen pendukung untuk AJU-2025-0417.", waktu: "2 hari lalu", jenis: "warning", dibaca: true },
];

export interface AuditLog {
  id: string;
  waktu: string;
  aktor: string;
  aksi: string;
  modul: string;
  detail: string;
  ip: string;
}

export const auditLogData: AuditLog[] = [
  { id: "a1", waktu: "2025-04-21 09:14:22", aktor: "Ust. Ahmad Fauzi", aksi: "CREATE", modul: "Ajuan", detail: "Membuat ajuan AJU-2025-0421", ip: "192.168.1.24" },
  { id: "a2", waktu: "2025-04-21 08:42:11", aktor: "KH. Abdurrahman", aksi: "APPROVE", modul: "Approval", detail: "Menyetujui AJU-2025-0420", ip: "192.168.1.10" },
  { id: "a3", waktu: "2025-04-21 08:30:00", aktor: "KH. Abdurrahman", aksi: "LOGIN", modul: "Auth", detail: "Login berhasil", ip: "192.168.1.10" },
  { id: "a4", waktu: "2025-04-20 16:22:09", aktor: "Bag. Keuangan", aksi: "DISBURSE", modul: "Pencairan", detail: "Mencairkan dana AJU-2025-0419 sebesar Rp 22.500.000", ip: "192.168.1.15" },
  { id: "a5", waktu: "2025-04-20 14:01:45", aktor: "Ustz. Maryam", aksi: "UPDATE", modul: "Ajuan", detail: "Memperbarui rincian AJU-2025-0419", ip: "192.168.1.31" },
  { id: "a6", waktu: "2025-04-20 11:18:33", aktor: "Auditor Internal", aksi: "EXPORT", modul: "Laporan", detail: "Export laporan keuangan PDF April 2025", ip: "192.168.1.50" },
  { id: "a7", waktu: "2025-04-19 17:45:12", aktor: "KH. Abdurrahman", aksi: "REJECT", modul: "Approval", detail: "Menolak AJU-2025-0418", ip: "192.168.1.10" },
  { id: "a8", waktu: "2025-04-19 09:00:00", aktor: "Admin Sistem", aksi: "UPDATE", modul: "Pengguna", detail: "Menonaktifkan akun Ust. Mahmud", ip: "192.168.1.5" },
];

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export const statusBadgeClass: Record<StatusAjuan, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  menunggu: "bg-warning/15 text-warning-foreground border-warning/30",
  disetujui: "bg-primary/12 text-primary border-primary/25",
  ditolak: "bg-destructive/12 text-destructive border-destructive/25",
  dicairkan: "bg-info/12 text-info border-info/25",
};

export const statusLabel: Record<StatusAjuan, string> = {
  draft: "Draft",
  menunggu: "Menunggu",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dicairkan: "Dicairkan",
};
