import 'dotenv/config';
import sql from '../src/db';

async function migrate() {
  console.log('Running migration_v5...');
  try {
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS deletion_reason TEXT;`;
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
