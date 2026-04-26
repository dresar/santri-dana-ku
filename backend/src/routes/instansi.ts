import { Hono } from 'hono';
import sql from '../db';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import { z } from 'zod';

const instansi = new Hono();

const CreateInstansiSchema = z.object({
  nama: z.string().min(2),
});

instansi.get('/', authMiddleware, async (c) => {
  const rows = await sql`SELECT id, nama, created_at FROM instansi ORDER BY nama ASC`;
  return ok(c, rows);
});

instansi.post('/', authMiddleware, rbac('admin'), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateInstansiSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { nama } = parsed.data;

  try {
    const rows = await sql`
      INSERT INTO instansi (nama)
      VALUES (${nama})
      RETURNING *
    `;
    return ok(c, rows[0], 'Instansi berhasil ditambahkan', 201);
  } catch (err: any) {
    if (err.code === '23505') {
      return fail(c, 'Instansi dengan nama ini sudah ada', 409);
    }
    throw err;
  }
});

instansi.delete('/:id', authMiddleware, rbac('admin'), async (c) => {
  const { id } = c.req.param();
  
  // Periksa apakah instansi sedang digunakan di tabel ajuan_anggaran
  const rows = await sql`SELECT nama FROM instansi WHERE id = ${id}`;
  if (!rows[0]) return fail(c, 'Instansi tidak ditemukan', 404);
  const namaInstansi = (rows[0] as any).nama;

  const usage = await sql`SELECT COUNT(*) as total FROM ajuan_anggaran WHERE instansi = ${namaInstansi}`;
  if (Number((usage[0] as any).total) > 0) {
    return fail(c, 'Instansi tidak dapat dihapus karena sudah memiliki data ajuan', 400);
  }

  await sql`DELETE FROM instansi WHERE id = ${id}`;
  return ok(c, null, 'Instansi berhasil dihapus');
});

export default instansi;
