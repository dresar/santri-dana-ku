import { Hono } from 'hono';
import sql from '../db';
import { ok } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const laporan = new Hono();

laporan.get('/ringkasan', authMiddleware, rbac('admin', 'approver'), async (c) => {
  const [totalAjuan] = await sql`SELECT COUNT(*) as total FROM ajuan_anggaran`;
  const [totalUsers] = await sql`SELECT COUNT(*) as total FROM profiles`;
  const [totalPencairan] = await sql`SELECT COUNT(*) as total FROM pencairan`;
  const [totalDana] = await sql`SELECT COALESCE(SUM(jumlah), 0) as total FROM pencairan WHERE status = 'selesai'`;

  const byStatus = await sql`
    SELECT status, COUNT(*) as count, COALESCE(SUM(total), 0) as nilai
    FROM ajuan_anggaran
    GROUP BY status
  `;

  const recentAjuan = await sql`
    SELECT a.id, a.kode, a.judul, a.total, a.status, a.created_at, p.nama_lengkap AS pengaju_nama
    FROM ajuan_anggaran a
    LEFT JOIN profiles p ON p.id = a.pengaju_id
    ORDER BY a.created_at DESC
    LIMIT 5
  `;

  return ok(c, {
    stats: {
      total_ajuan: Number((totalAjuan as any)?.total ?? 0),
      total_pengguna: Number((totalUsers as any)?.total ?? 0),
      total_pencairan: Number((totalPencairan as any)?.total ?? 0),
      total_dana_dicairkan: Number((totalDana as any)?.total ?? 0),
    },
    by_status: byStatus,
    recent_ajuan: recentAjuan,
  });
});

laporan.get('/bulanan', authMiddleware, rbac('admin', 'approver'), async (c) => {
  const { year = new Date().getFullYear().toString() } = c.req.query();
  const yearNum = Number(year);

  const rows = await sql`
    SELECT
      EXTRACT(MONTH FROM created_at)::int AS bulan,
      COUNT(*) AS total_ajuan,
      COALESCE(SUM(total), 0) AS total_nilai,
      COUNT(*) FILTER (WHERE status = 'disetujui') AS disetujui,
      COUNT(*) FILTER (WHERE status = 'ditolak') AS ditolak,
      COUNT(*) FILTER (WHERE status = 'dicairkan') AS dicairkan
    FROM ajuan_anggaran
    WHERE EXTRACT(YEAR FROM created_at)::int = ${yearNum}
    GROUP BY bulan
    ORDER BY bulan
  `;

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const found = rows.find((r: any) => Number(r.bulan) === i + 1) as any;
    return {
      bulan: i + 1,
      total_ajuan: Number(found?.total_ajuan ?? 0),
      total_nilai: Number(found?.total_nilai ?? 0),
      disetujui: Number(found?.disetujui ?? 0),
      ditolak: Number(found?.ditolak ?? 0),
      dicairkan: Number(found?.dicairkan ?? 0),
    };
  });

  return ok(c, { year: yearNum, monthly });
});

laporan.get('/export', authMiddleware, rbac('admin'), async (c) => {
  const rows = await sql`
    SELECT a.kode, a.judul, a.instansi, a.rencana_penggunaan, a.total, a.status,
           a.created_at, p.nama_lengkap AS pengaju, p.jabatan
    FROM ajuan_anggaran a
    LEFT JOIN profiles p ON p.id = a.pengaju_id
    ORDER BY a.created_at DESC
  `;

  const headers = ['Kode', 'Judul', 'Instansi', 'Rencana Penggunaan', 'Total', 'Status', 'Tanggal', 'Pengaju', 'Jabatan'];
  const csvRows = rows.map((r: any) =>
    [r.kode, r.judul, r.instansi, r.rencana_penggunaan, r.total, r.status,
      new Date(r.created_at).toLocaleDateString('id-ID'), r.pengaju, r.jabatan]
      .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  );

  const csv = [headers.join(','), ...csvRows].join('\n');
  const filename = `laporan-ajuan-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});

export default laporan;
