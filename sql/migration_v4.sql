-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial settings data
INSERT INTO settings (key, value)
VALUES ('instansi', '{
    "nama": "Pesantren Modern Raudhatussalam Mahato",
    "alamat": "Jl. Pesantren No. 01, Mahato, Riau",
    "email": "info@raudhatussalam.sch.id",
    "kontak": "0812-3456-7890",
    "logo_url": null,
    "ttd_url": null,
    "show_ttd": true
}'::jsonb)
ON CONFLICT (key) DO NOTHING;
