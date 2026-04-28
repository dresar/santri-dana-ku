import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { neon } from '@neondatabase/serverless';

// ─── DB & CONFIG ──────────────────────────────────────────────────────────────
const sql = neon(process.env.DATABASE_URL || 'postgresql://unconfigured');

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
}));
app.use('*', prettyJSON());

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SantriDanaKu API - Online</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { font-family: system-ui; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; min-h-screen; }
            .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); padding: 3rem; border-radius: 2rem; text-align: center; }
        </style>
    </head>
    <body>
        <div class="glass">
            <h1 class="text-4xl font-bold mb-4 text-emerald-400">SantriDanaKu API</h1>
            <p class="text-slate-400 mb-6">Backend service is active and running on Vercel.</p>
            <div class="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full font-bold">STATUS: ONLINE</div>
        </div>
    </body>
    </html>
  `);
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));

// ─── DEBUG DB ─────────────────────────────────────────────────────────────────
app.get('/api/debug-db', async (c) => {
  try {
    const { sql } = await import('../src/db');
    const result = await sql`SELECT 1 as connected`;
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    return c.json({
      status: 'ok',
      database: 'connected',
      check: result,
      tables: tables.map((t: any) => t.table_name)
    });
  } catch (err: any) {
    return c.json({
      status: 'error',
      message: err.message,
      stack: err.stack
    }, 500);
  }
});

// ─── IMPORT ROUTES ────────────────────────────────────────────────────────────
// Kita tetap mengimport dari file lain, TAPI kita pastikan bundler Vercel membacanya.
import authRoutes from '../src/routes/auth';
import ajuanRoutes from '../src/routes/ajuan';
import pencairanRoutes from '../src/routes/pencairan';
import notifikasiRoutes from '../src/routes/notifikasi';
import penggunaRoutes from '../src/routes/pengguna';
import laporanRoutes from '../src/routes/laporan';
import auditRoutes from '../src/routes/audit';
import aiRoutes from '../src/routes/ai';
import instansiRoutes from '../src/routes/instansi';
import settingsRoutes from '../src/routes/settings';

// Mount API routes
app.route('/api/auth', authRoutes);
app.route('/api/ajuan', ajuanRoutes);
app.route('/api/pencairan', pencairanRoutes);
app.route('/api/notifikasi', notifikasiRoutes);
app.route('/api/pengguna', penggunaRoutes);
app.route('/api/laporan', laporanRoutes);
app.route('/api/audit', auditRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/instansi', instansiRoutes);
app.route('/api/settings', settingsRoutes);

// Global Error Handler
app.onError((err, c) => {
  console.error('[API Error]:', err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);
export const OPTIONS = handle(app);

export default handle(app);
