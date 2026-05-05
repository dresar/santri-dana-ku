import { Hono } from 'hono';
import sql from '../db';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import { CreateAjuanSchema, UpdateAjuanStatusSchema } from '../lib/validators';

const ajuan = new Hono();

async function generateKode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AJU-${year}-`;
  
  // Ambil nomor urut tertinggi langsung dari database menggunakan regex/substring
  const rows = await sql`
    SELECT COALESCE(
      MAX(CAST(NULLIF(regexp_replace(kode, '.*-', '', 'g'), '') AS INTEGER)), 
      0
    ) as last_seq
    FROM ajuan_anggaran 
    WHERE kode LIKE ${prefix + '%'}
  `;

  const nextSeq = ((rows[0] as any).last_seq || 0) + 1;
  let finalKode = `${prefix}${nextSeq.toString().padStart(4, '0')}`;
  
  // Double check uniqueness as a fallback
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const check = await sql`SELECT 1 FROM ajuan_anggaran WHERE kode = ${finalKode} LIMIT 1`;
    if (check.length === 0) {
      isUnique = true;
    } else {
      attempts++;
      finalKode = `${prefix}${(nextSeq + attempts).toString().padStart(4, '0')}`;
    }
  }
  
  return finalKode;
}

ajuan.get('/list-approvers', authMiddleware, async (c) => {
  try {
    const users = await sql`
      SELECT p.id, p.nama_lengkap, p.jabatan, p.instansi, p.foto_url
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id
      WHERE ur.role = 'approver'
      ORDER BY p.nama_lengkap ASC
    `;
    return ok(c, users);
  } catch (err: any) {
    return fail(c, err.message, 500);
  }
});

// Temporary migration route - run once by visiting /api/ajuan/migrate
ajuan.get('/migrate', async (c) => {
  try {
    // 1. Add missing columns to ajuan_anggaran
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS target_approver_id UUID REFERENCES profiles(id);`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS metode_pencairan TEXT DEFAULT 'tunai';`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS bank TEXT;`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS nomor_rekening TEXT;`;
    await sql`ALTER TABLE ajuan_anggaran ADD COLUMN IF NOT EXISTS nama_rekening TEXT;`;

    // 2. Ensure laporan_penggunaan table exists (it's often missing in older deploys)
    await sql`
      CREATE TABLE IF NOT EXISTS laporan_penggunaan (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ajuan_id UUID REFERENCES ajuan_anggaran(id) ON DELETE CASCADE,
        pengaju_id UUID REFERENCES profiles(id),
        total_anggaran NUMERIC NOT NULL,
        total_digunakan NUMERIC NOT NULL DEFAULT 0,
        sisa_dana NUMERIC NOT NULL DEFAULT 0,
        catatan TEXT,
        foto_nota_urls TEXT[],
        pdf_laporan_url TEXT,
        status TEXT DEFAULT 'menunggu',
        verifikator_id UUID REFERENCES profiles(id),
        catatan_verifikasi TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // 3. Update ENUMs
    try { await sql`ALTER TYPE ajuan_status ADD VALUE IF NOT EXISTS 'selesai'`; } catch (e) {}
    
    // 4. Sync statuses
    const syncRes = await sql`
      UPDATE ajuan_anggaran 
      SET status = 'selesai' 
      WHERE id IN (
        SELECT ajuan_id FROM laporan_penggunaan WHERE status = 'disetujui'
      ) AND status != 'selesai'
      RETURNING id
    `;
    
    // Debug Info
    const existing = await sql`SELECT kode FROM ajuan_anggaran ORDER BY kode DESC LIMIT 20`;
    const seqCheck = await sql`
      SELECT 
        kode,
        regexp_replace(kode, '.*-', '', 'g') as extracted_seq,
        CAST(NULLIF(regexp_replace(kode, '.*-', '', 'g'), '') AS INTEGER) as casted_seq
      FROM ajuan_anggaran 
      LIMIT 5
    `;
    const maxCheck = await sql`
      SELECT COALESCE(
        MAX(CAST(NULLIF(regexp_replace(kode, '.*-', '', 'g'), '') AS INTEGER)), 
        0
      ) as last_seq
      FROM ajuan_anggaran 
      WHERE kode LIKE ${'AJU-' + new Date().getFullYear() + '-%'}
    `;

    return c.json({
      message: 'Migration successful!',
      existing_codes: existing.map(r => r.kode),
      debug_seq: seqCheck,
      debug_max: maxCheck[0]
    });
  } catch (err: any) {
    console.error('[migrate] Error:', err);
    return c.json({ error: 'Migration failed', message: err.message }, 500);
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

  const s = (!status || status === 'all') ? null : status;
  const q = search ? `%${search}%` : null;

  if (role === 'pengaju') {
    rows = await sql`
      SELECT a.*, p.nama_lengkap AS pengaju_nama,
        EXISTS(SELECT 1 FROM laporan_penggunaan l WHERE l.ajuan_id = a.id) as has_laporan
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
  } else if (role === 'approver') {
    rows = await sql`
      SELECT a.*, p.nama_lengkap AS pengaju_nama,
        EXISTS(SELECT 1 FROM laporan_penggunaan l WHERE l.ajuan_id = a.id) as has_laporan
      FROM ajuan_anggaran a 
      LEFT JOIN profiles p ON p.id = a.pengaju_id 
      WHERE a.deleted_at IS NULL
        AND (a.target_approver_id IS NULL OR a.target_approver_id = ${userId})
        AND (${s}::text IS NULL OR a.status = ${s})
        AND (${q}::text IS NULL OR a.judul ILIKE ${q} OR a.kode ILIKE ${q})
      ORDER BY a.created_at DESC 
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*) as total 
      FROM ajuan_anggaran a 
      WHERE a.deleted_at IS NULL
        AND (a.target_approver_id IS NULL OR a.target_approver_id = ${userId})
        AND (${s}::text IS NULL OR a.status = ${s})
        AND (${q}::text IS NULL OR a.judul ILIKE ${q} OR a.kode ILIKE ${q})
    `;
  } else {
    rows = await sql`
      SELECT a.*, p.nama_lengkap AS pengaju_nama,
        EXISTS(SELECT 1 FROM laporan_penggunaan l WHERE l.ajuan_id = a.id) as has_laporan
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
  try {
    const userId = c.get('userId');
    const body = await c.req.json().catch(() => null);
    const parsed = CreateAjuanSchema.safeParse(body);
    if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

    // Check if user has outstanding reports
    const pendingReports = await sql`
      SELECT COUNT(*) as total 
      FROM ajuan_anggaran a 
      LEFT JOIN laporan_penggunaan l ON l.ajuan_id = a.id
      WHERE a.pengaju_id = ${userId} 
        AND a.status = 'dicairkan' 
        AND a.deleted_at IS NULL
        AND l.id IS NULL
    `;
    if (Number((pendingReports[0] as any)?.total ?? 0) > 0) {
      return fail(c, 'Harap selesaikan laporan penggunaan anggaran sebelumnya sebelum membuat pengajuan baru.', 403);
    }

    const { judul, instansi, rencana_penggunaan, items, gambar_url, target_approver_id, metode_pencairan, bank, nomor_rekening, nama_rekening } = parsed.data;
    const total = items.reduce((sum, i) => sum + i.qty * i.harga, 0);
    const kode = await generateKode();

    const ajuanRows = await sql`
      INSERT INTO ajuan_anggaran (kode, judul, pengaju_id, instansi, rencana_penggunaan, total, status, gambar_url, target_approver_id, metode_pencairan, bank, nomor_rekening, nama_rekening)
      VALUES (${kode}, ${judul}, ${userId}, ${instansi}, ${rencana_penggunaan}, ${total}, 'menunggu', ${gambar_url ?? null}, ${target_approver_id ?? null}, ${metode_pencairan ?? 'tunai'}, ${bank ?? null}, ${nomor_rekening ?? null}, ${nama_rekening ?? null})
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

    if (target_approver_id) {
      await sql`
        INSERT INTO notifikasi (user_id, judul, pesan, tipe, link)
        VALUES (${target_approver_id}, 'Ajuan Baru Masuk', ${`Ajuan ${kode} — ${judul} menunggu persetujuan Anda.`}, 'info', ${`/ajuan/${newAjuan.id}`})
      `;
    } else {
      const approvers = await sql`SELECT user_id FROM user_roles WHERE role = 'approver'`;
      for (const ap of approvers) {
        await sql`
          INSERT INTO notifikasi (user_id, judul, pesan, tipe, link)
          VALUES (${ap.user_id}, 'Ajuan Baru Masuk', ${`Ajuan ${kode} — ${judul} menunggu persetujuan Anda.`}, 'info', ${`/ajuan/${newAjuan.id}`})
        `;
      }
    }

    return ok(c, newAjuan, 'Ajuan berhasil dibuat', 201);
  } catch (err: any) {
    console.error('[ajuan.post] Error:', err);
    return fail(c, `Kesalahan Server: ${err.message} (Kode: ${kode ?? 'N/A'}, User: ${userId ?? 'N/A'})`, 500);
  }
});

ajuan.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();

  const ajuanRows = await sql`
    SELECT a.*, 
      p.nama_lengkap AS pengaju_nama, p.jabatan AS pengaju_jabatan, p.instansi AS pengaju_instansi,
      ap.nama_lengkap AS target_approver_nama
    FROM ajuan_anggaran a
    LEFT JOIN profiles p ON p.id = a.pengaju_id
    LEFT JOIN profiles ap ON ap.id = a.target_approver_id
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

ajuan.delete('/:id', authMiddleware, rbac('admin', 'pengaju'), async (c) => {
  const userId = c.get('userId');
  const role = c.get('role');
  const { id } = c.req.param();
  const { reason } = c.req.query();

  const rows = await sql`SELECT id, pengaju_id, kode, judul, status FROM ajuan_anggaran WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) return fail(c, 'Ajuan tidak ditemukan', 404);
  const ajuan = rows[0] as any;

  // New Restrictions:
  if (ajuan.status === 'selesai') {
    return fail(c, 'Ajuan yang sudah selesai tidak dapat dihapus', 403);
  }
  
  if (role === 'pengaju' && ['disetujui', 'dicairkan'].includes(ajuan.status)) {
    return fail(c, 'Pengaju tidak dapat menghapus ajuan yang sudah disetujui atau dicairkan', 403);
  }

  // Authorization
  if (role === 'pengaju' && ajuan.pengaju_id !== userId) {
    return fail(c, 'Tidak memiliki akses', 403);
  }

  // Soft delete for admin with reason
  if (role === 'admin') {
    await sql`
      UPDATE ajuan_anggaran 
      SET deleted_at = NOW(), deletion_reason = ${reason ?? 'Dihapus oleh Admin'}
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

ajuan.post('/:id/duplicate', authMiddleware, rbac('pengaju', 'admin'), async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');

  try {
    const existingRows = await sql`SELECT * FROM ajuan_anggaran WHERE id = ${id} LIMIT 1`;
    if (!existingRows[0]) return fail(c, 'Data tidak ditemukan', 404);
    const ex = existingRows[0] as any;

    const items = await sql`SELECT * FROM ajuan_items WHERE ajuan_id = ${id}`;
    
    const kode = await generateKode();
    const [newAjuan] = await sql`
      INSERT INTO ajuan_anggaran (
        kode, judul, pengaju_id, instansi, rencana_penggunaan, total, status, 
        target_approver_id, metode_pencairan, bank, nomor_rekening, nama_rekening
      )
      VALUES (
        ${kode}, ${ex.judul + ' (Copy)'}, ${userId}, ${ex.instansi}, ${ex.rencana_penggunaan}, ${ex.total}, 'draft',
        ${ex.target_approver_id}, ${ex.metode_pencairan}, ${ex.bank}, ${ex.nomor_rekening}, ${ex.nama_rekening}
      )
      RETURNING id
    ` as any;

    for (const it of items) {
      await sql`
        INSERT INTO ajuan_items (ajuan_id, nama_item, qty, satuan, harga, subtotal)
        VALUES (${newAjuan.id}, ${it.nama_item}, ${it.qty}, ${it.satuan}, ${it.harga}, ${it.subtotal})
      `;
    }

    return ok(c, { id: newAjuan.id }, 'Ajuan berhasil diduplikasi ke Draft');
  } catch (err: any) {
    return fail(c, err.message, 500);
  }
});

export default ajuan;
