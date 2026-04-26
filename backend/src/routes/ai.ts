import { Hono } from 'hono';
import sql from '../db';
import { ok, fail } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import { AddKeySchema, AnalyzeAjuanSchema, SummarizeSchema, ChatSchema } from '../lib/validators';
import { analyzeAjuan, summarizeText, chat } from '../services/ai-service';
import {
  getAllKeyStats,
  addKey,
  removeKey,
  toggleKey,
  resetDailyUsage,
  type GeminiKey,
} from '../services/ai-key-manager';

type KeyStat = Omit<GeminiKey, 'key_value'> & { key_preview: string };

const ai = new Hono();

ai.post('/analyze-ajuan', authMiddleware, rbac('approver', 'admin'), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = AnalyzeAjuanSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  const { ajuan_id } = parsed.data;

  const ajuanRows = await sql`
    SELECT a.*, p.nama_lengkap AS pengaju_nama
    FROM ajuan_anggaran a
    LEFT JOIN profiles p ON p.id = a.pengaju_id
    WHERE a.id = ${ajuan_id} LIMIT 1
  `;
  if (!ajuanRows[0]) return fail(c, 'Ajuan tidak ditemukan', 404);
  const ajuanRow = ajuanRows[0] as any;

  const items = await sql`SELECT * FROM ajuan_items WHERE ajuan_id = ${ajuan_id}`;
  const history = await sql`SELECT aksi, catatan FROM approval_history WHERE ajuan_id = ${ajuan_id} ORDER BY created_at DESC LIMIT 5`;

  try {
    const result = await analyzeAjuan({
      kode: ajuanRow.kode as string,
      judul: ajuanRow.judul as string,
      instansi: ajuanRow.instansi as string,
      rencana_penggunaan: ajuanRow.rencana_penggunaan as string,
      total: Number(ajuanRow.total),
      items: items as any,
      history: history as any,
    });
    return ok(c, result, 'Analisis AI berhasil');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI service error';
    if (msg.startsWith('SERVICE_UNAVAILABLE')) return fail(c, msg, 503);
    return fail(c, 'Gagal menghubungi layanan AI', 500);
  }
});

ai.post('/summarize', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = SummarizeSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  try {
    const summary = await summarizeText(parsed.data.text);
    return ok(c, { summary }, 'Rangkuman berhasil dibuat');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI service error';
    if (msg.startsWith('SERVICE_UNAVAILABLE')) return fail(c, msg, 503);
    return fail(c, 'Gagal menghubungi layanan AI', 500);
  }
});

ai.post('/chat', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  try {
    const reply = await chat(
      parsed.data.message,
      parsed.data.history as Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
    );
    return ok(c, { reply }, 'OK');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI service error';
    if (msg.startsWith('SERVICE_UNAVAILABLE')) return fail(c, msg, 503);
    return fail(c, 'Gagal menghubungi layanan AI', 500);
  }
});

ai.get('/keys/status', authMiddleware, rbac('admin'), async (c) => {
  const keys = await getAllKeyStats();
  const ks = keys as KeyStat[];

  const summary = {
    total: ks.length,
    active: ks.filter(k => k.status === 'active').length,
    exhausted: ks.filter(k => k.status === 'exhausted').length,
    disabled: ks.filter(k => k.status === 'disabled').length,
    total_calls_today: ks.reduce((s, k) => s + Number(k.usage_today), 0),
    total_calls_all_time: ks.reduce((s, k) => s + Number(k.total_calls), 0),
    remaining_quota_today: ks
      .filter(k => k.status === 'active')
      .reduce((s, k) => s + (Number(k.daily_limit) - Number(k.usage_today)), 0),
  };

  return ok(c, { keys: ks, summary }, 'OK');
});

ai.post('/keys', authMiddleware, rbac('admin'), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = AddKeySchema.safeParse(body);
  if (!parsed.success) return fail(c, 'Validasi gagal', 422, parsed.error.flatten());

  try {
    const key = await addKey(parsed.data.alias, parsed.data.key_value, parsed.data.daily_limit);
    return ok(c, key, 'API key berhasil ditambahkan', 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('23505')) {
      return fail(c, 'Key sudah terdaftar', 409);
    }
    return fail(c, 'Gagal menambahkan key', 500);
  }
});

ai.delete('/keys/:id', authMiddleware, rbac('admin'), async (c) => {
  const { id } = c.req.param();
  await removeKey(id);
  return ok(c, null, 'API key berhasil dihapus');
});

ai.patch('/keys/:id/toggle', authMiddleware, rbac('admin'), async (c) => {
  const { id } = c.req.param();
  try {
    const result = await toggleKey(id);
    return ok(c, result, `Key berhasil diubah ke status ${result.status}`);
  } catch {
    return fail(c, 'Key tidak ditemukan', 404);
  }
});

ai.get('/cron/reset-keys', async (c) => {
  const cronSecret = c.req.header('x-cron-secret') ?? c.req.query('secret');
  const expected = process.env.CRON_SECRET;
  if (!expected || cronSecret !== expected) {
    return fail(c, 'Unauthorized', 401);
  }
  const result = await resetDailyUsage();
  return ok(c, result, `Daily reset selesai: ${result.reset} key di-reset`);
});

export default ai;
