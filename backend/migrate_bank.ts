import sql from './src/db';

async function runMigration() {
  try {
    console.log('Starting migration...');
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS metode_pencairan TEXT DEFAULT 'tunai';`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS bank TEXT;`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS nomor_rekening TEXT;`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS nama_rekening TEXT;`;
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
