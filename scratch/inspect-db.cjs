const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function main() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
  
  if (!match) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }
  
  const dbUrl = match[1];
  console.log('Connecting to:', dbUrl.split('@')[1] || dbUrl); // Log host only for safety

  const sql = postgres(dbUrl, { ssl: 'require' });

  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('\n--- TABLES ---');
    console.log(tables.map(t => t.table_name).join(', ') || 'NONE');

    if (tables.some(t => t.table_name === 'profiles')) {
      const users = await sql`SELECT id, email, nama_lengkap FROM profiles LIMIT 5`;
      console.log('\n--- PROFILES (First 5) ---');
      console.table(users);
      
      const count = await sql`SELECT count(*) FROM profiles`;
      console.log(`Total profiles: ${count[0].count}`);
    } else {
      console.log('\n[!] TABLE "profiles" IS MISSING!');
    }

    if (tables.some(t => t.table_name === 'ajuan_anggaran')) {
      const count = await sql`SELECT count(*) FROM ajuan_anggaran`;
      console.log(`Total ajuan_anggaran: ${count[0].count}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('\n--- DATABASE ERROR ---');
    console.error(err.message);
    process.exit(1);
  }
}

main();
