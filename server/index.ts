import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { jwt, sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import sql from './db';

const app = new Hono().basePath('/api');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware
app.use('*', cors());

// Auth Helper
const createToken = async (user: any) => {
  return await sign({
    id: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  }, JWT_SECRET, 'HS256');
};

// Public Routes
app.get('/hello', (c) => c.json({ message: 'Hello from Hono!' }));

app.get('/health', async (c) => {
  try {
    const start = Date.now();
    const [row] = await sql`SELECT 1 as ok`;
    const checkTable = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles')`;
    return c.json({ 
      status: 'ok', 
      database: row.ok === 1 ? 'connected' : 'error',
      profiles_table: checkTable[0].exists ? 'exists' : 'missing',
      latency: `${Date.now() - start}ms`
    });
  } catch (err: any) {
    console.error('Health Check Error:', err);
    return c.json({ status: 'error', message: err.message }, 500);
  }
});

// Register
app.post('/auth/signup', async (c) => {
  const { email, password, nama_lengkap, jabatan, instansi, no_hp } = await c.req.json();
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const [existing] = await sql`SELECT id FROM profiles WHERE email = ${email}`;
    if (existing) return c.json({ error: 'Email already registered' }, 400);

    const [user] = await sql`
      INSERT INTO profiles (nama_lengkap, jabatan, instansi, no_hp, email, password)
      VALUES (${nama_lengkap}, ${jabatan}, ${instansi}, ${no_hp}, ${email}, ${hashedPassword})
      RETURNING id, email, nama_lengkap
    `;

    // Default role
    await sql`INSERT INTO user_roles (user_id, role) VALUES (${user.id}, 'pengaju')`;

    const token = await createToken(user);
    return c.json({ user, token });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Login
app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  
  try {
    const [user] = await sql`SELECT * FROM profiles WHERE email = ${email}`;
    if (!user) return c.json({ error: 'User not found' }, 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return c.json({ error: 'Invalid password' }, 401);

    const [roleObj] = await sql`SELECT role FROM user_roles WHERE user_id = ${user.id}`;

    const token = await createToken(user);
    return c.json({ 
      user: { id: user.id, email: user.email, nama_lengkap: user.nama_lengkap },
      role: roleObj?.role || 'pengaju',
      token 
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Dev Login (Bypass password for specific emails)
app.post('/auth/dev-login', async (c) => {
  const { email } = await c.req.json();
  const devEmails = ['admin@example.com', 'approver@example.com', 'pengaju@example.com'];
  
  if (!devEmails.includes(email)) {
    return c.json({ error: 'Not a dev email' }, 403);
  }

  try {
    const [user] = await sql`SELECT * FROM profiles WHERE email = ${email}`;
    if (!user) return c.json({ error: 'User not found in seed data' }, 404);

    const [roleObj] = await sql`SELECT role FROM user_roles WHERE user_id = ${user.id}`;
    const token = await createToken(user);
    
    return c.json({ 
      user: { id: user.id, email: user.email, nama_lengkap: user.nama_lengkap },
      role: roleObj?.role || 'pengaju',
      token 
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Protected Routes
const authMiddleware = jwt({ secret: JWT_SECRET, alg: 'HS256' });

app.get('/auth/me', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any;
  const [user] = await sql`SELECT id, email, nama_lengkap, jabatan, instansi, no_hp, foto_url FROM profiles WHERE id = ${payload.id}`;
  const [roleObj] = await sql`SELECT role FROM user_roles WHERE user_id = ${payload.id}`;
  
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ user, role: roleObj?.role || 'pengaju' });
});

// --- AJUAN ---
app.get('/ajuan', authMiddleware, async (c) => {
  const data = await sql`
    SELECT a.*, p.nama_lengkap as pengaju_nama 
    FROM ajuan_anggaran a
    LEFT JOIN profiles p ON a.pengaju_id = p.id
    ORDER BY a.created_at DESC
  `;
  return c.json(data);
});

app.get('/ajuan/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const [ajuan] = await sql`SELECT * FROM ajuan_anggaran WHERE id = ${id}`;
  const items = await sql`SELECT * FROM ajuan_items WHERE ajuan_id = ${id}`;
  const history = await sql`SELECT * FROM approval_history WHERE ajuan_id = ${id} ORDER BY created_at`;
  
  return c.json({ ajuan, items, history });
});

app.post('/ajuan', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any;
  const { judul, instansi, rencana_penggunaan, total, items, bukti_url } = await c.req.json();
  const kode = `AJU-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  try {
    const [ajuan] = await sql`
      INSERT INTO ajuan_anggaran (kode, judul, pengaju_id, instansi, rencana_penggunaan, total, status, bukti_url)
      VALUES (${kode}, ${judul}, ${payload.id}, ${instansi}, ${rencana_penggunaan}, ${total}, 'menunggu', ${bukti_url})
      RETURNING *
    `;

    if (items && items.length > 0) {
      const itemsToInsert = items.map((i: any) => ({
        ajuan_id: ajuan.id,
        nama_item: i.nama_item,
        qty: i.qty,
        satuan: i.satuan,
        harga: i.harga,
        subtotal: i.qty * i.harga
      }));
      await sql`INSERT INTO ajuan_items ${sql(itemsToInsert)}`;
    }

    // Audit log
    await sql`INSERT INTO audit_log (user_id, aksi, modul, detail) VALUES (${payload.id}, 'create', 'ajuan_anggaran', ${sql.json({ kode, total })})`;

    return c.json(ajuan);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// --- APPROVAL ---
app.post('/ajuan/:id/approve', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any;
  const ajuanId = c.req.param('id');
  const { aksi, catatan } = await c.req.json();

  try {
    await sql`UPDATE ajuan_anggaran SET status = ${aksi}, catatan = ${catatan} WHERE id = ${ajuanId}`;
    await sql`INSERT INTO approval_history (ajuan_id, approver_id, aksi, catatan) VALUES (${ajuanId}, ${payload.id}, ${aksi}, ${catatan})`;

    const [ajuan] = await sql`SELECT pengaju_id, kode FROM ajuan_anggaran WHERE id = ${ajuanId}`;
    if (ajuan) {
      await sql`INSERT INTO notifikasi (user_id, judul, pesan, tipe, link) VALUES (
        ${ajuan.pengaju_id}, 
        ${`Ajuan ${ajuan.kode} ${aksi}`}, 
        ${catatan || `Ajuan Anda telah ${aksi}.`}, 
        ${aksi === 'disetujui' ? 'sukses' : 'peringatan'}, 
        ${`/ajuan/${ajuanId}`}
      )`;
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// --- NOTIFIKASI ---
app.get('/notifikasi', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any;
  const data = await sql`SELECT * FROM notifikasi WHERE user_id = ${payload.id} ORDER BY created_at DESC`;
  return c.json(data);
});

app.patch('/notifikasi/:id/read', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await sql`UPDATE notifikasi SET dibaca = true WHERE id = ${id}`;
  return c.json({ success: true });
});

// --- PENCAIRAN ---
app.get('/pencairan', authMiddleware, async (c) => {
  const data = await sql`
    SELECT p.*, a.kode, a.judul, a.total
    FROM pencairan p
    JOIN ajuan_anggaran a ON p.ajuan_id = a.id
    ORDER BY p.created_at DESC
  `;
  return c.json(data);
});

app.post('/pencairan', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any;
  const input = await c.req.json();

  try {
    const [pencairan] = await sql`
      INSERT INTO pencairan (ajuan_id, bank, no_rekening, nama_pemilik, jumlah, status, diproses_oleh, bukti_url)
      VALUES (${input.ajuan_id}, ${input.bank}, ${input.no_rekening}, ${input.nama_pemilik}, ${input.jumlah}, 'selesai', ${payload.id}, ${input.bukti_url})
      RETURNING *
    `;
    await sql`UPDATE ajuan_anggaran SET status = 'dicairkan' WHERE id = ${input.ajuan_id}`;
    await sql`INSERT INTO audit_log (user_id, aksi, modul, detail) VALUES (${payload.id}, 'pencairan', 'pencairan', ${sql.json(input)})`;

    return c.json(pencairan);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// --- SYSTEM ---
app.get('/audit', authMiddleware, async (c) => {
  const data = await sql`
    SELECT a.*, p.nama_lengkap as user_nama 
    FROM audit_log a
    LEFT JOIN profiles p ON a.user_id = p.id
    ORDER BY a.created_at DESC LIMIT 200
  `;
  return c.json(data);
});

app.get('/pengguna', authMiddleware, async (c) => {
  const profiles = await sql`SELECT p.*, r.role FROM profiles p LEFT JOIN user_roles r ON p.id = r.user_id ORDER BY p.created_at DESC`;
  return c.json(profiles);
});

app.patch('/pengguna/:id/role', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { role } = await c.req.json();
  const payload = c.get('jwtPayload') as any;

  // Check if current user is admin
  const [currentRole] = await sql`SELECT role FROM user_roles WHERE user_id = ${payload.id}`;
  if (currentRole?.role !== 'admin') return c.json({ error: 'Unauthorized' }, 403);

  try {
    await sql.begin(async (sql) => {
      await sql`DELETE FROM user_roles WHERE user_id = ${id}`;
      await sql`INSERT INTO user_roles (user_id, role) VALUES (${id}, ${role})`;
    });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);
export const OPTIONS = handle(app);

export default app;
