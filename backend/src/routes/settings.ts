import { Hono } from 'hono';
import sql from '../db';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

import { v2 as cloudinary } from 'cloudinary';

const settings = new Hono();

// POST /settings/cloudinary-sign
settings.post('/cloudinary-sign', authMiddleware, async (c) => {
  // Try to get from 'instansi' or a dedicated 'cloudinary' key
  const rows = await sql`SELECT key, value FROM settings WHERE key IN ('instansi', 'cloudinary')`;
  
  let s: any = {};
  const instansi = rows.find(r => r.key === 'instansi')?.value as any;
  const direct = rows.find(r => r.key === 'cloudinary')?.value as any;
  
  s = { ...instansi, ...direct };
  
  if (!s.cloudinary_api_key || !s.cloudinary_api_secret || !s.cloudinary_cloud_name) {
    return fail(c, 'Konfigurasi Cloudinary tidak ditemukan di database. Silakan atur di menu Pengaturan.', 400);
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const params_to_sign = {
    timestamp,
    ...(await c.req.json().catch(() => ({}))),
  };

  const signature = cloudinary.utils.api_sign_request(
    params_to_sign,
    s.cloudinary_api_secret
  );

  return ok(c, {
    signature,
    timestamp,
    api_key: s.cloudinary_api_key,
    cloud_name: s.cloudinary_cloud_name
  });
});

// GET /settings/:key
settings.get('/:key', async (c) => {
  const { key } = c.req.param();
  const rows = await sql`SELECT value FROM settings WHERE key = ${key} LIMIT 1`;
  if (!rows[0]) return ok(c, {}); // Return empty object instead of 404
  return ok(c, rows[0].value);
});

// PATCH /settings/:key
settings.patch('/:key', authMiddleware, rbac('admin'), async (c) => {
  const { key } = c.req.param();
  const body = await c.req.json().catch(() => null);
  if (!body) return fail(c, 'Invalid body', 400);

  const rows = await sql`
    INSERT INTO settings (key, value)
    VALUES (${key}, ${JSON.stringify(body)})
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(body)}, updated_at = NOW()
    RETURNING value
  `;

  return ok(c, rows[0].value, 'Settings updated');
});

export default settings;
