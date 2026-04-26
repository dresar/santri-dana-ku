-- Add soft delete support
ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
