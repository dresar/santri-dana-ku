import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { auditLogger } from './middleware/audit';

// ─── Route imports ────────────────────────────────────────────────────────────
import authRoutes from './routes/auth';
import ajuanRoutes from './routes/ajuan';
import pencairanRoutes from './routes/pencairan';
import notifikasiRoutes from './routes/notifikasi';
import penggunaRoutes from './routes/pengguna';
import laporanRoutes from './routes/laporan';
import auditRoutes from './routes/audit';
import aiRoutes from './routes/ai';
import instansiRoutes from './routes/instansi';
import settingsRoutes from './routes/settings';

// ─── App ─────────────────────────────────────────────────────────────────────
const app = new Hono().basePath('/api');

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = [
        process.env.APP_URL ?? '',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4173',
      ].filter(Boolean);
      return allowed.includes(origin) ? origin : allowed[0];
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type', 'x-cron-secret'],
    credentials: true,
  }),
);

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', auditLogger);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'SantriDanaKu API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV ?? 'development',
  }),
);

// ─── Mount Routes ─────────────────────────────────────────────────────────────
app.route('/auth', authRoutes);
app.route('/ajuan', ajuanRoutes);
app.route('/pencairan', pencairanRoutes);
app.route('/notifikasi', notifikasiRoutes);
app.route('/pengguna', penggunaRoutes);
app.route('/laporan', laporanRoutes);
app.route('/audit', auditRoutes);
app.route('/ai', aiRoutes);
app.route('/instansi', instansiRoutes);
app.route('/settings', settingsRoutes);

// ─── Global 404 ──────────────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ data: null, error: `Route ${c.req.method} ${c.req.path} not found`, message: null }, 404),
);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[server] Unhandled error:', err);
  return c.json(
    { data: null, error: 'Internal server error', details: err.message },
    500,
  );
});

export default app;
