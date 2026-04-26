import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { neon } from '@neondatabase/serverless';

// ─── DB CONFIG ──────────────────────────────────────────────────────────────
const connectionString = process.env.DATABASE_URL;
const sql = neon(connectionString || 'postgresql://unconfigured');

// ─── APP INITIALIZATION ──────────────────────────────────────────────────────
const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
}));

// ─── RE-IMPORT ROUTES LOGIC (Simplified for the single-file handler) ──────────
// Note: We still import from routes but we mount them here clearly
import authRoutes from '../backend/src/routes/auth';
import ajuanRoutes from '../backend/src/routes/ajuan';
import pencairanRoutes from '../backend/src/routes/pencairan';
import notifikasiRoutes from '../backend/src/routes/notifikasi';
import penggunaRoutes from '../backend/src/routes/pengguna';
import laporanRoutes from '../backend/src/routes/laporan';
import auditRoutes from '../backend/src/routes/audit';
import aiRoutes from '../backend/src/routes/ai';
import instansiRoutes from '../backend/src/routes/instansi';
import settingsRoutes from '../backend/src/routes/settings';

// Mount all routes
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

// Backup for no-prefix
app.route('/auth', authRoutes);
app.route('/ajuan', ajuanRoutes);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', db: !!connectionString }));

// Global Error Handler
app.onError((err, c) => {
  console.error('[vercel-api] Error:', err);
  return c.json({ error: 'Server Error', message: err.message }, 500);
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);
export const OPTIONS = handle(app);

export default handle(app);
