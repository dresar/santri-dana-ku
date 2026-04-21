import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type StatusAjuan = "draft" | "menunggu" | "disetujui" | "ditolak" | "dicairkan";

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
