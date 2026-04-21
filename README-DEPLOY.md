# 🚀 Panduan Deploy ke Vercel

Aplikasi **Santri-Dana-Ku** telah dikonfigurasi sebagai **Frontend-only SaaS Demo**. Berikut adalah panduan langkah demi langkah untuk melakukan deploy ke Vercel.

## 1. Persiapan Akun
Pastikan Anda memiliki akun di [Vercel](https://vercel.com). Anda bisa login menggunakan akun GitHub.

## 2. Push ke GitHub
Jika Anda belum melakukannya, buat repositori baru di GitHub dan push kode Anda ke sana:
```bash
git init
git add .
git commit -m "Initial commit for SaaS Demo"
git remote add origin <url-repository-anda>
git push -u origin main
```

## 3. Langkah Deploy di Dashboard Vercel
1. Klik tombol **"Add New"** -> **"Project"** di dashboard Vercel.
2. Impor repositori GitHub yang baru saja Anda buat.
3. Vercel akan mendeteksi **Vite** secara otomatis.
4. **Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (atau `.output` jika menggunakan TanStack Start secara full)
5. Klik **"Deploy"**.

## 4. Konfigurasi Khusus (Sudah Diatur)
Kami telah menyertakan berkas `vercel.json` yang secara otomatis menangani:
- **SPA Routing**: Memastikan navigasi seperti `/ajuan` atau `/pencairan` tidak menyebabkan error 404 saat halaman di-refresh.
- **Clean URLs**: Menghapus akhiran `.html` dari URL agar terlihat lebih profesional.

## 5. Catatan Penting
> [!IMPORTANT]
> Karena ini adalah demo berbasis frontend, semua data yang Anda masukkan (seperti ajuan baru) akan disimpan di **Local Storage** browser Anda. Data tidak akan tersinkronisasi antar perangkat yang berbeda.

---
**Sistem E-Budgeting Pesantren Modern Raudhatussalam Mahato**
*Modern, Transparan, Akuntabel.*
