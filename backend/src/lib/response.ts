import type { Context } from 'hono';

// ─── Standard success response ───────────────────────────────────────────────
export function ok<T>(c: Context, data: T, message?: string, status = 200) {
  return c.json({ data, message: message ?? 'OK', error: null }, status as any);
}

// ─── Standard error response ─────────────────────────────────────────────────
export function fail(c: Context, message: string, status = 400, details?: unknown) {
  return c.json({ data: null, error: message, details: details ?? null }, status as any);
}

// ─── Paginated list response ─────────────────────────────────────────────────
export function paginated<T>(
  c: Context,
  data: T[],
  meta: { page: number; limit: number; total: number },
) {
  return c.json({
    data,
    meta,
    error: null,
  });
}
