import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import imageCompression from "browser-image-compression";
import { apiPost } from "./api";

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

export async function compressImage(file: File) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    initialQuality: 0.8,
  };
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Compression error:", error);
    return file;
  }
}

export async function uploadToCloudinary(file: File, settings: any) {
  const isSigned = !!(settings?.cloudinary_api_key && settings?.cloudinary_api_secret);
  
  const cloudName = settings?.cloudinary_cloud_name || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo";
  const preset = settings?.cloudinary_upload_preset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "unsigned_upload";

  const formData = new FormData();
  formData.append("file", file);

  if (isSigned) {
    // Signed Upload
    try {
      const sigData = await apiPost("/settings/cloudinary-sign", {});
      formData.append("api_key", sigData.api_key);
      formData.append("timestamp", sigData.timestamp);
      formData.append("signature", sigData.signature);
    } catch (e: any) {
      throw new Error(`Gagal mendapatkan signature: ${e.message}`);
    }
  } else {
    // Unsigned Upload
    formData.append("upload_preset", preset);
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg = errorData.error?.message || "Cek konfigurasi Cloudinary di Pengaturan.";
    throw new Error(`Cloudinary Error: ${msg}`);
  }
  const data = await res.json();
  return data.secure_url;
}
