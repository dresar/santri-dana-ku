import { Hono } from 'hono';
import sql from '../db';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';

const notifikasi = new Hono();

notifikasi.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { unread } = c.req.query();

  let rows: unknown[];
  if (unread === 'true') {
    rows = await sql`
      SELECT * FROM notifikasi
      WHERE user_id = ${userId} AND dibaca = false
      ORDER BY created_at DESC LIMIT 50
    `;
  } else {
    rows = await sql`
      SELECT * FROM notifikasi
      WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT 50
    `;
  }

  const countRows = await sql`
    SELECT COUNT(*) as total FROM notifikasi WHERE user_id = ${userId} AND dibaca = false
  `;

  return ok(c, { items: rows, unread_count: Number((countRows[0] as any)?.total ?? 0) });
});

notifikasi.patch('/:id/baca', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const rows = await sql`SELECT id, user_id FROM notifikasi WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) return fail(c, 'Notifikasi tidak ditemukan', 404);
  if ((rows[0] as any).user_id !== userId) return fail(c, 'Forbidden', 403);

  await sql`UPDATE notifikasi SET dibaca = true WHERE id = ${id}`;
  return ok(c, null, 'Notifikasi ditandai sudah dibaca');
});

notifikasi.post('/baca-semua', authMiddleware, async (c) => {
  const userId = c.get('userId');
  await sql`UPDATE notifikasi SET dibaca = true WHERE user_id = ${userId} AND dibaca = false`;
  return ok(c, null, 'Semua notifikasi telah ditandai sudah dibaca');
});

notifikasi.delete('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  const rows = await sql`SELECT id, user_id FROM notifikasi WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) return fail(c, 'Notifikasi tidak ditemukan', 404);
  if ((rows[0] as any).user_id !== userId) return fail(c, 'Forbidden', 403);

  await sql`DELETE FROM notifikasi WHERE id = ${id}`;
  return ok(c, null, 'Notifikasi berhasil dihapus');
});

export default notifikasi;
