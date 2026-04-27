import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import imageCompression from "browser-image-compression";
import { apiPost, apiFetch } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type StatusAjuan = "draft" | "menunggu" | "disetujui" | "ditolak" | "dicairkan" | "selesai";

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
  selesai: "bg-emerald-500/12 text-emerald-600 border-emerald-500/25",
};

export const reportStatusBadgeClass: Record<string, string> = {
  menunggu: "bg-warning/15 text-warning-foreground border-warning/30",
  disetujui: "bg-emerald-500/12 text-emerald-600 border-emerald-500/25",
  ditolak: "bg-destructive/12 text-destructive border-destructive/25",
};

export const statusLabel: Record<StatusAjuan, string> = {
  draft: "Draft",
  menunggu: "Menunggu",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dicairkan: "Dicairkan",
  selesai: "Selesai ✨",
};

export const reportStatusLabel: Record<string, string> = {
  menunggu: "Menunggu Verifikasi",
  disetujui: "Terverifikasi ✅",
  ditolak: "Revisi ❌",
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

export async function uploadToCloudinary(file: File, settings?: any) {
  let s = settings;
  if (!s) {
    try {
      // Fetch settings if not provided (e.g. from a component that doesn't use hooks)
      s = await apiFetch("/settings/instansi");
      console.log("Cloudinary fetched settings:", s);
    } catch (e) {
      console.error("Cloudinary failed to fetch settings:", e);
      s = {};
    }
  }

  // Cek apakah pakai Signed Upload (API Key & Secret ada di DB)
  const isSigned = !!(s?.cloudinary_api_key && (s?.cloudinary_api_secret || s?.has_secret || true)); 
  
  const cloudName = s?.cloudinary_cloud_name || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo";
  const preset = s?.cloudinary_upload_preset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "unsigned_upload";

  console.log("Cloudinary Config:", { cloudName, preset, isSigned });

  const formData = new FormData();
  formData.append("file", file);

  // Jika cloudName masih "demo", artinya konfigurasi belum diset
  if (cloudName === "demo") {
    throw new Error("Cloudinary belum dikonfigurasi. Silakan atur di menu Pengaturan > Cloud Storage.");
  }

  if (isSigned) {
    // Signed Upload
    try {
      const sigData = await apiPost("/settings/cloudinary-sign", {});
      formData.append("api_key", sigData.api_key);
      formData.append("timestamp", sigData.timestamp.toString());
      formData.append("signature", sigData.signature);
    } catch (e: any) {
      // Fallback ke unsigned jika signed gagal tapi ada preset
      if (preset && preset !== "unsigned_upload") {
        formData.append("upload_preset", preset);
      } else {
        throw new Error(`Gagal konfigurasi upload: ${e.message}`);
      }
    }
  } else {
    // Unsigned Upload
    formData.append("upload_preset", preset);
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
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
