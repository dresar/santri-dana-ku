-- 1. Create Profiles
-- Password is 'password123' hashed with bcrypt (placeholder, will be handled by dev login bypass)
INSERT INTO profiles (id, email, password, nama_lengkap, jabatan, instansi, no_hp) VALUES
('d0e1a2b3-c4d5-e6f7-a8b9-c0d1e2f3a4b5', 'admin@example.com', '$2a$10$89L7Q6R5S4T3U2V1W0X0YuJ.H.G.F.E.D.C.B.A.9.8.7.6.5.4.3.2.1', 'Admin Utama', 'Bendahara Pusat', 'Yayasan Pesantren Madani', '081234567890'),
('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 'approver@example.com', '$2a$10$89L7Q6R5S4T3U2V1W0X0YuJ.H.G.F.E.D.C.B.A.9.8.7.6.5.4.3.2.1', 'Kyai Ahmad', 'Pimpinan Pesantren', 'Pesantren Pusat', '081234567891'),
('f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'pengaju@example.com', '$2a$10$89L7Q6R5S4T3U2V1W0X0YuJ.H.G.F.E.D.C.B.A.9.8.7.6.5.4.3.2.1', 'Ustadz Yusuf', 'Kepala Bidang Sarpras', 'Unit Madrasah Aliyah', '081234567892');

-- 2. Assign Roles
INSERT INTO user_roles (user_id, role) VALUES
('d0e1a2b3-c4d5-e6f7-a8b9-c0d1e2f3a4b5', 'admin'),
('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 'approver'),
('f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'pengaju');

-- 3. Create Ajuan Anggaran
INSERT INTO ajuan_anggaran (id, kode, judul, pengaju_id, instansi, rencana_penggunaan, total, status) VALUES
('a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'AJU-2026-1001', 'Perbaikan Atap Aula', 'f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'Unit Madrasah Aliyah', 'Perbaikan genteng bocor dan plafon aula pesantren', 2500000, 'menunggu'),
('b2c3d4e5-f6a1-b2c3-d4e5-f6a1b2c3d4e5', 'AJU-2026-1002', 'Pengadaan Laptop Staff', 'f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'Unit Madrasah Aliyah', 'Inventaris kantor untuk staff administrasi baru', 75000000, 'disetujui'),
('c3d4e5f6-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'AJU-2026-1003', 'Konsumsi Ramadhan', 'f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'Unit Madrasah Aliyah', 'Biaya buka puasa bersama santri selama 30 hari', 15000000, 'dicairkan');

-- 4. Create Ajuan Items
INSERT INTO ajuan_items (ajuan_id, nama_item, qty, satuan, harga, subtotal) VALUES
('a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'Genteng Keramik', 100, 'pcs', 15000, 1500000),
('a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'Semen', 10, 'sak', 65000, 650000),
('a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 'Pasir', 1, 'rit', 350000, 350000),
('b2c3d4e5-f6a1-b2c3-d4e5-f6a1b2c3d4e5', 'Laptop ThinkPad E14', 5, 'unit', 15000000, 75000000);

-- 5. Create Pencairan
INSERT INTO pencairan (ajuan_id, bank, no_rekening, nama_pemilik, jumlah, status, diproses_oleh) VALUES
('c3d4e5f6-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'Bank Syariah Indonesia (BSI)', '7012345678', 'Ustadz Yusuf', 15000000, 'selesai', 'd0e1a2b3-c4d5-e6f7-a8b9-c0d1e2f3a4b5');

-- 6. Create Notifikasi
INSERT INTO notifikasi (user_id, judul, pesan, tipe, link) VALUES
('f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'Ajuan Disetujui', 'Ajuan AJU-2026-1002 telah disetujui oleh Kyai Ahmad.', 'sukses', '/ajuan/b2c3d4e5-f6a1-b2c3-d4e5-f6a1b2c3d4e5'),
('f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7', 'Pencairan Dana', 'Dana untuk AJU-2026-1003 telah dicairkan ke rekening Anda.', 'info', '/pencairan');
