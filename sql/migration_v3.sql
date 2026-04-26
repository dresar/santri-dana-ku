CREATE TABLE IF NOT EXISTS instansi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Masukkan data awal jika tabel kosong
INSERT INTO instansi (nama)
SELECT 'Sekretariat Pesantren'
WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Sekretariat Pesantren');

INSERT INTO instansi (nama)
SELECT 'Bidang Kurikulum'
WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Bidang Kurikulum');

INSERT INTO instansi (nama)
SELECT 'Bidang Kesantrian'
WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Bidang Kesantrian');

INSERT INTO instansi (nama)
SELECT 'Bidang Sarana Prasarana'
WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Bidang Sarana Prasarana');

INSERT INTO instansi (nama)
SELECT 'Bidang Keuangan'
WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Bidang Keuangan');

INSERT INTO instansi (nama)
SELECT 'Unit Dapur Umum'
WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Unit Dapur Umum');

INSERT INTO instansi (nama)
SELECT 'Unit Kesehatan Santri'
WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Unit Kesehatan Santri');

INSERT INTO instansi (nama)
SELECT 'Unit Perpustakaan'
WHERE NOT EXISTS (SELECT 1 FROM instansi WHERE nama = 'Unit Perpustakaan');
