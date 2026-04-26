import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const sql = neon(DATABASE_URL);

async function main() {
  console.log('[seed] Hashing passwords...');
  const hash = await bcrypt.hash('password123', 10);

  console.log('[seed] Upserting profiles...');
  await sql`
    INSERT INTO profiles (id, email, password, nama_lengkap, jabatan, instansi, no_hp)
    VALUES
      ('d0e1a2b3-c4d5-e6f7-a8b9-c0d1e2f3a4b5', 'admin@example.com', ${hash}, 'Admin Utama', 'Bendahara Pusat', 'Yayasan Pesantren Madani', '081234567890'),
      ('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 'approver@example.com', ${hash}, 'Kyai Ahmad', 'Pimpinan Pesantren', 'Pesantren Pusat', '081234567891'),
      ('f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'pengaju@example.com', ${hash}, 'Ustadz Yusuf', 'Kepala Bidang Sarpras', 'Unit Madrasah Aliyah', '081234567892')
    ON CONFLICT (id) DO UPDATE SET password = ${hash}, updated_at = NOW()
  `;

  console.log('[seed] Upserting roles...');
  await sql`INSERT INTO user_roles (user_id, role) VALUES ('d0e1a2b3-c4d5-e6f7-a8b9-c0d1e2f3a4b5', 'admin') ON CONFLICT (user_id) DO UPDATE SET role = 'admin'`;
  await sql`INSERT INTO user_roles (user_id, role) VALUES ('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 'approver') ON CONFLICT (user_id) DO UPDATE SET role = 'approver'`;
  await sql`INSERT INTO user_roles (user_id, role) VALUES ('f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'pengaju') ON CONFLICT (user_id) DO UPDATE SET role = 'pengaju'`;

  console.log('[seed] Upserting ajuan...');
  await sql`
    INSERT INTO ajuan_anggaran (id, kode, judul, pengaju_id, instansi, rencana_penggunaan, total, status)
    VALUES
      ('a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'AJU-2026-0001', 'Perbaikan Atap Aula', 'f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'Unit Madrasah Aliyah', 'Perbaikan genteng bocor dan plafon aula pesantren', 2500000, 'menunggu'),
      ('b2c3d4e5-f6a1-b2c3-d4e5-f6a1b2c3d4e5', 'AJU-2026-0002', 'Pengadaan Laptop Staff', 'f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'Unit Madrasah Aliyah', 'Inventaris kantor untuk staff administrasi baru', 75000000, 'disetujui'),
      ('c3d4e5f6-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'AJU-2026-0003', 'Konsumsi Ramadhan', 'f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'Unit Madrasah Aliyah', 'Biaya buka puasa bersama santri selama 30 hari', 15000000, 'dicairkan')
    ON CONFLICT (id) DO NOTHING
  `;

  console.log('[seed] Upserting ajuan items...');
  await sql`INSERT INTO ajuan_items (ajuan_id, nama_item, qty, satuan, harga, subtotal) VALUES ('a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'Genteng Keramik', 100, 'pcs', 15000, 1500000) ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO ajuan_items (ajuan_id, nama_item, qty, satuan, harga, subtotal) VALUES ('a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'Semen', 10, 'sak', 65000, 650000) ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO ajuan_items (ajuan_id, nama_item, qty, satuan, harga, subtotal) VALUES ('a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'Pasir', 1, 'rit', 350000, 350000) ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO ajuan_items (ajuan_id, nama_item, qty, satuan, harga, subtotal) VALUES ('b2c3d4e5-f6a1-b2c3-d4e5-f6a1b2c3d4e5', 'Laptop ThinkPad E14', 5, 'unit', 15000000, 75000000) ON CONFLICT DO NOTHING`;

  console.log('[seed] Upserting pencairan...');
  await sql`
    INSERT INTO pencairan (ajuan_id, bank, no_rekening, nama_pemilik, jumlah, status, diproses_oleh)
    VALUES ('c3d4e5f6-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'Bank Syariah Indonesia (BSI)', '7012345678', 'Ustadz Yusuf', 15000000, 'selesai', 'd0e1a2b3-c4d5-e6f7-a8b9-c0d1e2f3a4b5')
    ON CONFLICT DO NOTHING
  `;

  console.log('[seed] ✅ Seed complete!');
  console.log('[seed] Login accounts:');
  console.log('       admin@example.com / password123  (admin)');
  console.log('       approver@example.com / password123  (approver)');
  console.log('       pengaju@example.com / password123  (pengaju)');
}

main().catch(e => { console.error('[seed] Error:', e?.message); process.exit(1); });
