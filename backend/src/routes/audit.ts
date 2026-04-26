import { Hono } from 'hono';
import sql from '../db';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const audit = new Hono();

audit.get('/', authMiddleware, rbac('admin'), async (c) => {
  const { page = '1', limit = '30', modul, user_id } = c.req.query();
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  let rows: unknown[];
  let countRows: unknown[];

  if (modul && user_id) {
    rows = await sql`
      SELECT al.id, al.aksi, al.modul, al.ip_address, al.detail, al.created_at,
             p.nama_lengkap AS user_nama, p.email AS user_email
      FROM audit_log al LEFT JOIN profiles p ON p.id = al.user_id
      WHERE al.modul = ${modul} AND al.user_id = ${user_id}
      ORDER BY al.created_at DESC LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`SELECT COUNT(*) as total FROM audit_log al WHERE al.modul = ${modul} AND al.user_id = ${user_id}`;
  } else if (modul) {
    rows = await sql`
      SELECT al.id, al.aksi, al.modul, al.ip_address, al.detail, al.created_at,
             p.nama_lengkap AS user_nama, p.email AS user_email
      FROM audit_log al LEFT JOIN profiles p ON p.id = al.user_id
      WHERE al.modul = ${modul}
      ORDER BY al.created_at DESC LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`SELECT COUNT(*) as total FROM audit_log al WHERE al.modul = ${modul}`;
  } else if (user_id) {
    rows = await sql`
      SELECT al.id, al.aksi, al.modul, al.ip_address, al.detail, al.created_at,
             p.nama_lengkap AS user_nama, p.email AS user_email
      FROM audit_log al LEFT JOIN profiles p ON p.id = al.user_id
      WHERE al.user_id = ${user_id}
      ORDER BY al.created_at DESC LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`SELECT COUNT(*) as total FROM audit_log al WHERE al.user_id = ${user_id}`;
  } else {
    rows = await sql`
      SELECT al.id, al.aksi, al.modul, al.ip_address, al.detail, al.created_at,
             p.nama_lengkap AS user_nama, p.email AS user_email
      FROM audit_log al LEFT JOIN profiles p ON p.id = al.user_id
      ORDER BY al.created_at DESC LIMIT ${limitNum} OFFSET ${offset}
    `;
    countRows = await sql`SELECT COUNT(*) as total FROM audit_log`;
  }

  return c.json({
    data: rows,
    meta: { page: pageNum, limit: limitNum, total: Number((countRows[0] as any)?.total ?? 0) },
    error: null,
  });
});

export default audit;
