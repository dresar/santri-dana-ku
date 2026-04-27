import { Hono } from 'hono';
import sql from '../db';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import { CreatePencairanSchema, UpdatePencairanStatusSchema, UpdatePencairanSchema } from '../lib/validators';

const pencairan = new Hono();

pencairan.get('/', authMiddleware, async (c) => {
  const role = c.get('role');
  const userId = c.get('userId');

  let rows: unknown[];
  if (role === 'admin' || role === 'administrasi') {
    rows = await sql`
      SELECT pc.*, a.kode, a.judul, p.nama_lengkap AS pengaju_nama, pr.nama_lengkap AS diproses_nama
      FROM pencairan pc
      LEFT JOIN ajuan_anggaran a ON a.id = pc.ajuan_id
      LEFT JOIN profiles p ON p.id = a.pengaju_id
      LEFT JOIN profiles pr ON pr.id = pc.diproses_oleh
      ORDER BY pc.created_at DESC
    `;
  } else {
    rows = await sql`
      SELECT pc.*, a.kode, a.judul
      FROM pencairan pc
      LEFT JOIN ajuan_anggaran a ON a.id = pc.ajuan_id
      WHERE a.pengaju_id = ${userId}
      ORDER BY pc.created_at DESC
    `;
  }

  return ok(c, rows);
});

pencairan.post('/', authMiddleware, rbac('admin', 'administrasi'), async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const parsed = CreatePencairanSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { ajuan_id, bank, no_rekening, nama_pemilik, jumlah, metode, bukti_url, bukti_penyerahan_url } = parsed.data;

  const ajuanRows = await sql`
    SELECT id, status, pengaju_id, kode, judul FROM ajuan_anggaran WHERE id = ${ajuan_id} LIMIT 1
  `;
  if (!ajuanRows[0]) return fail(c, 'Ajuan tidak ditemukan', 404);
  const ajuanRow = ajuanRows[0] as any;

  if (ajuanRow.status !== 'disetujui') {
    return fail(c, 'Ajuan harus berstatus "disetujui" untuk dapat dicairkan', 422);
  }

  const newRows = await sql`
    INSERT INTO pencairan (ajuan_id, bank, no_rekening, nama_pemilik, jumlah, diproses_oleh, status, metode, bukti_url, bukti_penyerahan_url)
    VALUES (${ajuan_id}, ${bank ?? null}, ${no_rekening ?? null}, ${nama_pemilik ?? null}, ${jumlah}, ${userId}, 'selesai', ${metode ?? 'tunai'}, ${bukti_url ?? null}, ${bukti_penyerahan_url ?? null})
    RETURNING *
  `;
  const newPencairan = newRows[0] as any;

  await sql`UPDATE ajuan_anggaran SET status = 'dicairkan', updated_at = NOW() WHERE id = ${ajuan_id}`;

  await sql`
    INSERT INTO notifikasi (user_id, judul, pesan, tipe, link)
    VALUES (
      ${ajuanRow.pengaju_id},
      ${`Pencairan Dana ${ajuanRow.kode}`},
      ${`Dana sebesar Rp ${Number(jumlah).toLocaleString('id-ID')} untuk ajuan "${ajuanRow.judul}" sedang diproses.`},
      'sukses',
      '/pencairan'
    )
  `;

  return ok(c, newPencairan, 'Pencairan berhasil dibuat', 201);
});

pencairan.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();

  const rows = await sql`
    SELECT pc.*, a.kode, a.judul, a.instansi,
           p.nama_lengkap AS pengaju_nama, pr.nama_lengkap AS diproses_nama
    FROM pencairan pc
    LEFT JOIN ajuan_anggaran a ON a.id = pc.ajuan_id
    LEFT JOIN profiles p ON p.id = a.pengaju_id
    LEFT JOIN profiles pr ON pr.id = pc.diproses_oleh
    WHERE pc.id = ${id} LIMIT 1
  `;

  if (!rows[0]) return fail(c, 'Data pencairan tidak ditemukan', 404);
  return ok(c, rows[0]);
});

pencairan.patch('/:id/status', authMiddleware, rbac('admin', 'administrasi'), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const parsed = UpdatePencairanStatusSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const existingRows = await sql`SELECT id FROM pencairan WHERE id = ${id} LIMIT 1`;
  if (!existingRows[0]) return fail(c, 'Pencairan tidak ditemukan', 404);

  const updatedRows = await sql`
    UPDATE pencairan SET status = ${parsed.data.status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return ok(c, updatedRows[0], 'Status pencairan berhasil diperbarui');
});

pencairan.patch('/:id', authMiddleware, rbac('admin', 'administrasi'), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const parsed = UpdatePencairanSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const existingRows = await sql`SELECT id FROM pencairan WHERE id = ${id} LIMIT 1`;
  if (!existingRows[0]) return fail(c, 'Pencairan tidak ditemukan', 404);

  const { metode, bank, no_rekening, nama_pemilik, jumlah, bukti_url, bukti_penyerahan_url, status } = parsed.data;

  const updatedRows = await sql`
    UPDATE pencairan 
    SET 
      metode = COALESCE(${metode ?? null}, metode),
      bank = COALESCE(${bank ?? null}, bank),
      no_rekening = COALESCE(${no_rekening ?? null}, no_rekening),
      nama_pemilik = COALESCE(${nama_pemilik ?? null}, nama_pemilik),
      jumlah = COALESCE(${jumlah ?? null}, jumlah),
      bukti_url = COALESCE(${bukti_url ?? null}, bukti_url),
      bukti_penyerahan_url = COALESCE(${bukti_penyerahan_url ?? null}, bukti_penyerahan_url),
      status = COALESCE(${status ?? null}, status),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return ok(c, updatedRows[0], 'Data pencairan berhasil diperbarui');
});

pencairan.delete('/:id', authMiddleware, rbac('admin', 'administrasi'), async (c) => {
  const { id } = c.req.param();

  const rows = await sql`SELECT id, ajuan_id FROM pencairan WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) return fail(c, 'Pencairan tidak ditemukan', 404);
  const pc = rows[0] as any;

  // Revert ajuan status to 'disetujui' if it was 'dicairkan'
  await sql`UPDATE ajuan_anggaran SET status = 'disetujui' WHERE id = ${pc.ajuan_id} AND status = 'dicairkan'`;
  
  await sql`DELETE FROM pencairan WHERE id = ${id}`;

  return ok(c, null, 'Pencairan berhasil dihapus');
});

export default pencairan;
