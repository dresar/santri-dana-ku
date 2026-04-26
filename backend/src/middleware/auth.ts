import { createMiddleware } from 'hono/factory';
import { verifyJwt } from '../lib/jwt';
import { fail } from '../lib/response';

// Augment Hono context variables
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    role: string;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return fail(c, 'Unauthorized: missing token', 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyJwt(token);
    c.set('userId', payload.sub);
    c.set('role', payload.role);
    await next();
  } catch {
    return fail(c, 'Unauthorized: invalid or expired token', 401);
  }
});

/** Shorthand alias */
export const auth = () => authMiddleware;
