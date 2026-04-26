import { createMiddleware } from 'hono/factory';
import { fail } from '../lib/response';

type AppRole = 'admin' | 'approver' | 'pengaju';

/**
 * Role-Based Access Control guard.
 * Usage: app.get('/admin-route', auth(), rbac('admin'), handler)
 */
export function rbac(...allowedRoles: AppRole[]) {
  return createMiddleware(async (c, next) => {
    const role = c.get('role') as AppRole | undefined;
    if (!role || !allowedRoles.includes(role)) {
      return fail(c, `Forbidden: requires one of [${allowedRoles.join(', ')}]`, 403);
    }
    await next();
  });
}
