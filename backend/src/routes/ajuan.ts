import { Hono } from 'hono';
import sql from '../db';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import { CreateAjuanSchema, UpdateAjuanStatusSchema } from '../lib/validators';

const ajuan = new Hono();

async function generateKode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AJU-${year}-%`;
  const rows = await sql`SELECT COUNT(*) as total FROM ajuan_anggaran WHERE kode LIKE ${prefix}`;
  const seq = (Number((rows[0] as any)?.total ?? 0) + 1).toString().padStart(4, '0');
  return `AJU-${year}-${seq}`;
}

// Temporary migration route - run once by visiting /api/ajuan/migrate
ajuan.get('/migrate', async (c) => {
  try {
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS deletion_reason TEXT;`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS dokumen_url TEXT;`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS gambar_url TEXT;`;
    return c.text('Migration successful!');
  } catch (err: any) {
    return c.text('Migration failed: ' + err.message, 500);
  }
});

ajuan.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const role = c.get('role');
  const { status, search, page = '1', limit = '20' } = c.req.query();
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  let rows: unknown[];
  let countRows: unknown[];

  const s = status === 'all' ? null : status;
  const q = search ? `%${search}%` : null;

  if (role === 'pengaju') {
    rows = await sql`
      SELECT a.*, p.nama_lengkap AS pengaju_nama 
      FROM ajuan_anggaran a 
      LEFT JOIN profiles p ON p.id = a.pengaju_id 
      WHERE a.pengaju_id = ${userId} 
        AND a.deleted_at IS NULL
        AND (${s}::text IS NULL OR a.status = ${s})
        AND (${q}::text IS NULL OR a.judul ILIKE ${q} OR a.kode ILIKE ${q})
      ORDER BY a.created_at DESC 
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*) as total 
      FROM ajuan_anggaran a 
      WHERE a.pengaju_id = ${userId} 
        AND a.deleted_at IS NULL
        AND (${s}::text IS NULL OR a.status = ${s})
        AND (${q}::text IS NULL OR a.judul ILIKE ${q} OR a.kode ILIKE ${q})
    `;
  } else {
    rows = await sql`
      SELECT a.*, p.nama_lengkap AS pengaju_nama 
      FROM ajuan_anggaran a 
      LEFT JOIN profiles p ON p.id = a.pengaju_id 
      WHERE a.deleted_at IS NULL
        AND (${s}::text IS NULL OR a.status = ${s})
        AND (${q}::text IS NULL OR a.judul ILIKE ${q} OR a.kode ILIKE ${q})
      ORDER BY a.created_at DESC 
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*) as total 
      FROM ajuan_anggaran a 
      WHERE a.deleted_at IS NULL
        AND (${s}::text IS NULL OR a.status = ${s})
        AND (${q}::text IS NULL OR a.judul ILIKE ${q} OR a.kode ILIKE ${q})
    `;
  }

  return c.json({
    data: rows,
    meta: { page: pageNum, limit: limitNum, total: Number((countRows[0] as any)?.total ?? 0) },
    error: null,
  });
});

ajuan.post('/', authMiddleware, rbac('pengaju', 'admin'), async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const parsed = CreateAjuanSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { judul, instansi, rencana_penggunaan, items, gambar_url } = parsed.data;
  const total = items.reduce((sum, i) => sum + i.qty * i.harga, 0);
  const kode = await generateKode();

  const ajuanRows = await sql`
    INSERT INTO ajuan_anggaran (kode, judul, pengaju_id, instansi, rencana_penggunaan, total, status, gambar_url)
    VALUES (${kode}, ${judul}, ${userId}, ${instansi}, ${rencana_penggunaan}, ${total}, 'menunggu', ${gambar_url ?? null})
    RETURNING *
  `;
  const newAjuan = ajuanRows[0] as any;

  for (const item of items) {
    const subtotal = item.qty * item.harga;
    await sql`
      INSERT INTO ajuan_items (ajuan_id, nama_item, qty, satuan, harga, subtotal)
      VALUES (${newAjuan.id}, ${item.nama_item}, ${item.qty}, ${item.satuan ?? null}, ${item.harga}, ${subtotal})
    `;
  }

  const approvers = await sql`SELECT user_id FROM user_roles WHERE role = 'approver'`;
  for (const ap of approvers) {
    await sql`
      INSERT INTO notifikasi (user_id, judul, pesan, tipe, link)
      VALUES (${ap.user_id}, 'Ajuan Baru Masuk', ${`Ajuan ${kode} — ${judul} menunggu persetujuan Anda.`}, 'info', ${`/ajuan/${newAjuan.id}`})
    `;
  }

  return ok(c, newAjuan, 'Ajuan berhasil dibuat', 201);
});

ajuan.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();

  const ajuanRows = await sql`
    SELECT a.*, p.nama_lengkap AS pengaju_nama, p.jabatan AS pengaju_jabatan, p.instansi AS pengaju_instansi
    FROM ajuan_anggaran a
    LEFT JOIN profiles p ON p.id = a.pengaju_id
    WHERE a.id = ${id}
    LIMIT 1
  `;
  if (!ajuanRows[0]) return fail(c, 'Ajuan tidak ditemukan', 404);

  const items = await sql`SELECT * FROM ajuan_items WHERE ajuan_id = ${id} ORDER BY created_at`;
  const history = await sql`
    SELECT ah.*, p.nama_lengkap AS approver_nama
    FROM approval_history ah
    LEFT JOIN profiles p ON p.id = ah.approver_id
    WHERE ah.ajuan_id = ${id}
    ORDER BY ah.created_at DESC
  `;

  return ok(c, { ...(ajuanRows[0] as any), items, history });
});

ajuan.patch('/:id/status', authMiddleware, rbac('approver', 'admin'), async (c) => {
  const approverId = c.get('userId');
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const parsed = UpdateAjuanStatusSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { status, catatan } = parsed.data;

  const existingRows = await sql`SELECT id, pengaju_id, kode, judul FROM ajuan_anggaran WHERE id = ${id} LIMIT 1`;
  if (!existingRows[0]) return fail(c, 'Ajuan tidak ditemukan', 404);
  const existing = existingRows[0] as any;

  const updatedRows = await sql`
    UPDATE ajuan_anggaran SET status = ${status}, catatan = ${catatan ?? null}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  await sql`
    INSERT INTO approval_history (ajuan_id, approver_id, aksi, catatan)
    VALUES (${id}, ${approverId}, ${status}, ${catatan ?? null})
  `;

  const labelMap: Record<string, string> = {
    disetujui: 'disetujui ✅', ditolak: 'ditolak ❌', dicairkan: 'dicairkan 💰', menunggu: 'dikembalikan ke menunggu',
  };
  const tipe = status === 'disetujui' || status === 'dicairkan' ? 'sukses' : status === 'ditolak' ? 'error' : 'info';

  await sql`
    INSERT INTO notifikasi (user_id, judul, pesan, tipe, link)
    VALUES (${existing.pengaju_id}, ${`Update Ajuan ${existing.kode}`}, ${`Ajuan "${existing.judul}" telah ${labelMap[status] ?? status}.`}, ${tipe}, ${`/ajuan/${id}`})
  `;

  return ok(c, updatedRows[0], `Status berhasil diubah ke ${status}`);
});

ajuan.delete('/:id', authMiddleware, rbac('admin', 'approver', 'pengaju'), async (c) => {
  const userId = c.get('userId');
  const role = c.get('role');
  const { id } = c.req.param();
  const { reason } = c.req.query();

  const rows = await sql`SELECT id, pengaju_id, kode, judul FROM ajuan_anggaran WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) return fail(c, 'Ajuan tidak ditemukan', 404);
  const ajuan = rows[0] as any;

  // Authorization
  if (role === 'pengaju' && ajuan.pengaju_id !== userId) {
    return fail(c, 'Tidak memiliki akses', 403);
  }

  // Soft delete for admin/approver with reason
  if (role === 'admin' || role === 'approver') {
    await sql`
      UPDATE ajuan_anggaran 
      SET deleted_at = NOW(), deletion_reason = ${reason ?? 'Dihapus oleh Admin/Approver'}
      WHERE id = ${id}
    `;
    
    // Notify pengaju
    await sql`
      INSERT INTO notifikasi (user_id, judul, pesan, tipe, link)
      VALUES (${ajuan.pengaju_id}, 'Ajuan Dihapus', ${`Ajuan ${ajuan.kode} — ${ajuan.judul} telah dihapus dengan alasan: ${reason ?? '-'}`}, 'error', '#')
    `;
  } else {
    // Hard delete for pengaju (or soft delete too if preferred, let's go with hard delete for now if pengaju deletes it)
    await sql`DELETE FROM ajuan_anggaran WHERE id = ${id}`;
  }

  return ok(c, null, 'Ajuan berhasil dihapus');
});

export default ajuan;
