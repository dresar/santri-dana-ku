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
const app = new Hono();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(
  '*',
  cors({
    origin: '*', // Allow all during debug to ensure CORS isn't the cause of 500
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type', 'x-cron-secret'],
    credentials: true,
  }),
);

app.use('*', logger());
app.use('*', prettyJSON());
// app.use('*', auditLogger); // DISABLED FOR DEBUGGING VERCEL 500

// ─── Mount Routes ─────────────────────────────────────────────────────────────
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

// Backup routes without /api prefix just in case Vercel strips it
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

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', env: 'vercel' }));
app.get('/health', (c) => c.json({ status: 'ok', env: 'vercel' }));

// ─── Global 404 ──────────────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ data: null, error: `Route ${c.req.method} ${c.req.path} not found`, message: null }, 404),
);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[server] Unhandled error:', err);
  return c.json(
    { 
      data: null, 
      error: 'Internal server error', 
      message: err.message, // Menampilkan pesan error asli agar Anda bisa lihat di browser
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    },
    500,
  );
});

export default app;
