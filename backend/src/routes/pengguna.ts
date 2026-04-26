import { Hono } from 'hono';
import sql from '../db';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import bcrypt from 'bcryptjs';
import { UpdateRoleSchema, CreateUserAdminSchema, UpdateProfileSchema } from '../lib/validators';

const pengguna = new Hono();

pengguna.post('/', authMiddleware, rbac('admin'), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateUserAdminSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { email, password, nama_lengkap, jabatan, instansi, no_hp, role } = parsed.data;

  const existing = await sql`SELECT id FROM profiles WHERE email = ${email} LIMIT 1`;
  if (existing[0]) return fail(c, 'Email sudah terdaftar', 400);

  const hash = await bcrypt.hash(password, 10);

  const userRows = await sql`
    INSERT INTO profiles (email, password, nama_lengkap, jabatan, instansi, no_hp) 
    VALUES (${email}, ${hash}, ${nama_lengkap}, ${jabatan ?? null}, ${instansi ?? null}, ${no_hp ?? null})
    RETURNING id
  `;
  const id = userRows[0].id;
  
  await sql`INSERT INTO user_roles (user_id, role) VALUES (${id}, ${role})`;

  return ok(c, { id }, 'Pengguna berhasil ditambahkan', 201);
});

pengguna.patch('/:id/password', authMiddleware, rbac('admin'), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  if (!body || !body.password || body.password.length < 6) {
    return fail(c, 'Password baru minimal 6 karakter', 400);
  }

  const userRows = await sql`SELECT id FROM profiles WHERE id = ${id} LIMIT 1`;
  if (!userRows[0]) return fail(c, 'Pengguna tidak ditemukan', 404);

  const hash = await bcrypt.hash(body.password, 10);
  await sql`UPDATE profiles SET password = ${hash}, updated_at = NOW() WHERE id = ${id}`;

  return ok(c, null, 'Password pengguna berhasil direset');
});

pengguna.patch('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const f = parsed.data;
  if (Object.keys(f).length === 0) return ok(c, null, 'Tidak ada perubahan');

  await sql`
    UPDATE profiles SET 
      nama_lengkap = COALESCE(${f.nama_lengkap ?? null}, nama_lengkap),
      jabatan = COALESCE(${f.jabatan ?? null}, jabatan),
      instansi = COALESCE(${f.instansi ?? null}, instansi),
      no_hp = COALESCE(${f.no_hp ?? null}, no_hp),
      foto_url = COALESCE(${f.foto_url ?? null}, foto_url)
    WHERE id = ${userId}
  `;

  return ok(c, null, 'Profil berhasil diperbarui');
});

pengguna.patch('/me/foto', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const foto = body?.foto_url || body?.foto_base64;
  
  if (!foto) return fail(c, 'Foto URL atau base64 wajib', 400);

  await sql`UPDATE profiles SET foto_url = ${foto} WHERE id = ${userId}`;
  return ok(c, { foto_url: foto }, 'Foto profil berhasil diubah');
});

pengguna.get('/', authMiddleware, rbac('admin'), async (c) => {
  const { search, page = '1', limit = '20' } = c.req.query();
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  let rows: unknown[];
  let countRows: unknown[];

  if (search) {
    const q = `%${search}%`;
    rows = await sql`
      SELECT p.id, p.email, p.nama_lengkap, p.jabatan, p.instansi, p.no_hp, p.foto_url, p.created_at, ur.role
      FROM profiles p LEFT JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.nama_lengkap ILIKE ${q} OR p.email ILIKE ${q}
      ORDER BY p.created_at DESC LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*) as total FROM profiles p
      WHERE p.nama_lengkap ILIKE ${q} OR p.email ILIKE ${q}
    `;
  } else {
    rows = await sql`
      SELECT p.id, p.email, p.nama_lengkap, p.jabatan, p.instansi, p.no_hp, p.foto_url, p.created_at, ur.role
      FROM profiles p LEFT JOIN user_roles ur ON ur.user_id = p.id
      ORDER BY p.created_at DESC LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`SELECT COUNT(*) as total FROM profiles`;
  }

  return c.json({
    data: rows,
    meta: { page: pageNum, limit: limitNum, total: Number((countRows[0] as any)?.total ?? 0) },
    error: null,
  });
});

pengguna.get('/:id', authMiddleware, rbac('admin'), async (c) => {
  const { id } = c.req.param();
  const rows = await sql`
    SELECT p.*, ur.role FROM profiles p
    LEFT JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.id = ${id} LIMIT 1
  `;
  if (!rows[0]) return fail(c, 'Pengguna tidak ditemukan', 404);

  const ajuanCountRows = await sql`SELECT COUNT(*) as total FROM ajuan_anggaran WHERE pengaju_id = ${id}`;
  return ok(c, { ...(rows[0] as any), ajuan_count: Number((ajuanCountRows[0] as any)?.total ?? 0) });
});

pengguna.patch('/:id/role', authMiddleware, rbac('admin'), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const parsed = UpdateRoleSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const userRows = await sql`SELECT id FROM profiles WHERE id = ${id} LIMIT 1`;
  if (!userRows[0]) return fail(c, 'Pengguna tidak ditemukan', 404);

  await sql`
    INSERT INTO user_roles (user_id, role) VALUES (${id}, ${parsed.data.role})
    ON CONFLICT (user_id) DO UPDATE SET role = ${parsed.data.role}
  `;

  return ok(c, null, `Role pengguna berhasil diubah ke ${parsed.data.role}`);
});

pengguna.delete('/:id', authMiddleware, rbac('admin'), async (c) => {
  const selfId = c.get('userId');
  const { id } = c.req.param();

  if (id === selfId) return fail(c, 'Tidak dapat menghapus akun sendiri', 400);

  const rows = await sql`SELECT id FROM profiles WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) return fail(c, 'Pengguna tidak ditemukan', 404);

  await sql`DELETE FROM profiles WHERE id = ${id}`;
  return ok(c, null, 'Pengguna berhasil dihapus');
});

export default pengguna;
