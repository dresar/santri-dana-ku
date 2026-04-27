import { Hono } from 'hono';
import sql from '../db';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import { CreateLaporanSchema } from '../lib/validators';

const laporan = new Hono();

// Get all reports (Admin/Approver see all, Pengaju see theirs)
laporan.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const role = c.get('role');
  const { page = '1', limit = '20' } = c.req.query();
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  let rows;
  let countRows;

  if (role === 'pengaju') {
    rows = await sql`
      SELECT l.*, a.kode as ajuan_kode, a.judul as ajuan_judul, p.nama_lengkap as pengaju_nama
      FROM laporan_penggunaan l
      JOIN ajuan_anggaran a ON l.ajuan_id = a.id
      JOIN profiles p ON l.pengaju_id = p.id
      WHERE l.pengaju_id = ${userId}
      ORDER BY l.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`SELECT COUNT(*) as total FROM laporan_penggunaan WHERE pengaju_id = ${userId}`;
  } else {
    rows = await sql`
      SELECT l.*, a.kode as ajuan_kode, a.judul as ajuan_judul, p.nama_lengkap as pengaju_nama
      FROM laporan_penggunaan l
      JOIN ajuan_anggaran a ON l.ajuan_id = a.id
      JOIN profiles p ON l.pengaju_id = p.id
      ORDER BY l.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`SELECT COUNT(*) as total FROM laporan_penggunaan`;
  }

  return c.json({
    data: rows,
    meta: { page: pageNum, limit: limitNum, total: Number((countRows[0] as any)?.total ?? 0) },
    error: null,
  });
});

// Submit a new report
laporan.post('/', authMiddleware, rbac('pengaju', 'admin'), async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const parsed = CreateLaporanSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { ajuan_id, total_anggaran, total_digunakan, sisa_dana, catatan, foto_nota_urls, items } = parsed.data;

  // Check if ajuan exists and is disbursed
  const ajuan = await sql`SELECT id, status, pengaju_id FROM ajuan_anggaran WHERE id = ${ajuan_id} LIMIT 1`;
  if (!ajuan[0]) return fail(c, 'Ajuan tidak ditemukan', 404);
  if (ajuan[0].status !== 'dicairkan') {
    return fail(c, 'Hanya anggaran yang sudah dicairkan yang dapat dilaporkan', 400);
  }
  
  // Verify ownership if not admin
  if (c.get('role') !== 'admin' && ajuan[0].pengaju_id !== userId) {
    return fail(c, 'Anda tidak berwenang melaporkan anggaran ini', 403);
  }

  // Check if already reported
  const existing = await sql`SELECT id FROM laporan_penggunaan WHERE ajuan_id = ${ajuan_id} LIMIT 1`;
  if (existing[0]) return fail(c, 'Anggaran ini sudah dilaporkan sebelumnya', 400);

  try {
    const reportRows = await sql`
      INSERT INTO laporan_penggunaan (ajuan_id, pengaju_id, total_anggaran, total_digunakan, sisa_dana, catatan, foto_nota_urls)
      VALUES (${ajuan_id}, ${userId}, ${total_anggaran}, ${total_digunakan}, ${sisa_dana}, ${catatan ?? null}, ${foto_nota_urls})
      RETURNING *
    `;
    const newReport = reportRows[0] as any;

    for (const item of items) {
      await sql`
        INSERT INTO laporan_items (laporan_id, nama_item, qty, satuan, harga, subtotal)
        VALUES (${newReport.id}, ${item.nama_item}, ${item.qty}, ${item.satuan ?? null}, ${item.harga}, ${item.qty * item.harga})
      `;
    }

    // Notify Admins
    const admins = await sql`SELECT user_id FROM user_roles WHERE role = 'admin'`;
    for (const admin of admins) {
      await sql`
        INSERT INTO notifikasi (user_id, judul, pesan, tipe, link)
        VALUES (${admin.user_id}, 'Laporan Penggunaan Baru', ${`Laporan untuk anggaran ${ajuan_id} telah diserahkan.`}, 'sukses', ${`/laporan/${newReport.id}`})
      `;
    }

    return ok(c, newReport, 'Laporan berhasil diserahkan', 201);
  } catch (err: any) {
    console.error('[laporan] Error saving report:', err);
    return fail(c, 'Gagal menyimpan laporan', 500);
  }
});

// Get report details
laporan.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');
  const role = c.get('role');

  const reportRows = await sql`
    SELECT l.*, a.kode as ajuan_kode, a.judul as ajuan_judul, p.nama_lengkap as pengaju_nama
    FROM laporan_penggunaan l
    JOIN ajuan_anggaran a ON l.ajuan_id = a.id
    JOIN profiles p ON l.pengaju_id = p.id
    WHERE l.id = ${id}
    LIMIT 1
  `;
  if (!reportRows[0]) return fail(c, 'Laporan tidak ditemukan', 404);
  const report = reportRows[0] as any;

  // Authorization
  if (role === 'pengaju' && report.pengaju_id !== userId) {
    return fail(c, 'Tidak memiliki akses', 403);
  }

  const items = await sql`SELECT * FROM laporan_items WHERE laporan_id = ${id} ORDER BY created_at`;

  return ok(c, { ...report, items });
});

// Verify/Approve a report
laporan.patch('/:id/status', authMiddleware, rbac('approver', 'admin', 'administrasi'), async (c) => {
  const verifikatorId = c.get('userId');
  const { id } = c.req.param();
  const { status, catatan } = await c.req.json();

  if (!['disetujui', 'ditolak'].includes(status)) {
    return fail(c, 'Status tidak valid', 400);
  }

  const reportRows = await sql`SELECT ajuan_id, pengaju_id FROM laporan_penggunaan WHERE id = ${id} LIMIT 1`;
  if (!reportRows[0]) return fail(c, 'Laporan tidak ditemukan', 404);
  const report = reportRows[0] as any;

  try {
    const updatedRows = await sql`
      UPDATE laporan_penggunaan 
      SET status = ${status}, verifikator_id = ${verifikatorId}, catatan_verifikasi = ${catatan ?? null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // If report is approved, the budget is officially "Finished" (Selesai)
    if (status === 'disetujui') {
      await sql`UPDATE ajuan_anggaran SET status = 'selesai', updated_at = NOW() WHERE id = ${report.ajuan_id}`;
    }

    // Notify Pengaju
    const label = status === 'disetujui' ? 'Diterima ✅' : 'Ditolak ❌';
    const tipe = status === 'disetujui' ? 'sukses' : 'error';
    await sql`
      INSERT INTO notifikasi (user_id, judul, pesan, tipe, link)
      VALUES (${report.pengaju_id}, 'Update Laporan Penggunaan', ${`Laporan Anda telah ${label}.`}, ${tipe}, ${`/laporan/${id}`})
    `;

    return ok(c, updatedRows[0], `Laporan berhasil ${status}`);
  } catch (err: any) {
    console.error('[laporan] Error verifying report:', err);
    return fail(c, 'Gagal memproses verifikasi laporan', 500);
  }
});

export default laporan;
