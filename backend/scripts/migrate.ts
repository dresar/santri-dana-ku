import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

function splitStatements(content: string): string[] {
  // Remove comments
  const cleanContent = content.replace(/--[^\n]*/g, '');
  
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  
  const lines = cleanContent.split('\n');
  for (let line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.includes('$$')) inDollarQuote = !inDollarQuote;
    
    current += line + '\n';
    
    if (!inDollarQuote && trimmedLine.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  
  if (current.trim()) statements.push(current.trim());
  return statements.filter(s => s.length > 0);
}

async function runMigration(label: string, filePath: string) {
  console.log(`\n[migrate] Running: ${label}`);
  const content = readFileSync(filePath, 'utf-8');
  const statements = splitStatements(content);

  let ok = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      await sql(stmt as any);
      ok++;
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      const code: string = err?.code ?? '';
      if (
        code === '42710' ||
        code === '42P07' ||
        code === '23505' ||
        msg.includes('already exists') ||
        msg.includes('duplicate')
      ) {
        skipped++;
      } else {
        console.error(`[migrate] ❌ Statement failed: ${stmt.slice(0, 80)}...`);
        console.error(`[migrate]    Error: ${msg}`);
        throw err;
      }
    }
  }

  console.log(`[migrate] ✅ ${label} — ${ok} applied, ${skipped} skipped (already exist)`);
}

async function main() {
  console.log('[migrate] Starting database migration...');
  console.log('[migrate] Database:', DATABASE_URL!.split('@')[1]?.split('/')[1]?.split('?')[0]);

  await runMigration('SantriDanaKu Master Schema', join(process.cwd(), 'sql/migration.sql'));

  console.log('\n[migrate] ✅ All migrations complete!\n');
}

main().catch(err => {
  console.error('[migrate] Fatal error:', err?.message ?? err);
  process.exit(1);
});
