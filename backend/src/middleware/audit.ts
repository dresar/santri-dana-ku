import { createMiddleware } from 'hono/factory';
import sql from '../db';

export const auditLogger = createMiddleware(async (c, next) => {
  const method = c.req.method.toUpperCase();
  const isMutation = ['POST', 'PATCH', 'DELETE', 'PUT'].includes(method);

  let bodySnapshot: any = null;
  if (isMutation) {
    try {
      bodySnapshot = await c.req.json();
    } catch {
      bodySnapshot = null;
    }
  }

  await next();

  if (!isMutation) return;

  const userId = c.get('userId');
  if (!userId) return;

  try {
    const url = new URL(c.req.url);
    const parts = url.pathname.split('/');
    const modul = parts[2] ?? 'unknown';
    const aksi = `${method} ${url.pathname}`;
    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';

    const safeDetail = typeof bodySnapshot === 'object' && bodySnapshot !== null 
      ? { ...bodySnapshot } 
      : { raw: bodySnapshot };
      
    if ('password' in safeDetail) safeDetail.password = '[REDACTED]';
    if ('key_value' in safeDetail) safeDetail.key_value = '[REDACTED]';

    await sql`
      INSERT INTO audit_log (user_id, aksi, modul, detail, ip_address)
      VALUES (${userId}, ${aksi}, ${modul}, ${JSON.stringify(safeDetail)}::jsonb, ${ip})
    `;
  } catch (err) {
    console.error('[audit] Failed to write audit log:', err);
  }
});
