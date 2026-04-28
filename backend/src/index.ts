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
    origin: (origin) => origin, // Echo back origin to support credentials if needed, or use '*' with credentials: false
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type', 'x-cron-secret'],
    credentials: true,
  }),
);

app.use('*', logger());
app.use('*', prettyJSON());
// app.use('*', auditLogger); // DISABLED FOR DEBUGGING VERCEL 500

// ─── Welcome Page (Root) ──────────────────────────────────────────────────────
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SantriDanaKu API - Online</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Outfit', sans-serif; background: #0f172a; color: white; }
            .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }
            .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        </style>
    </head>
    <body class="flex items-center justify-center min-h-screen p-6">
        <div class="max-w-2xl w-full glass rounded-3xl p-8 md:p-12 text-center shadow-2xl border-t border-white/10">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-8">
                <div class="w-8 h-8 bg-emerald-500 rounded-full pulse"></div>
            </div>
            
            <h1 class="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                SantriDanaKu API
            </h1>
            <p class="text-slate-400 text-lg mb-8 leading-relaxed">
                Sistem Manajemen Dana Santri & Proposal Anggaran.<br/>
                Backend service is running smoothly on Vercel.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <span class="block text-emerald-400 font-bold text-xl">v2.0.0</span>
                    <span class="text-slate-500 text-sm uppercase tracking-wider">Version</span>
                </div>
                <div class="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <span class="block text-emerald-400 font-bold text-xl uppercase">Active</span>
                    <span class="text-slate-500 text-sm uppercase tracking-wider">Status</span>
                </div>
                <div class="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <span class="block text-emerald-400 font-bold text-xl">100%</span>
                    <span class="text-slate-500 text-sm uppercase tracking-wider">Uptime</span>
                </div>
            </div>

            <div class="flex flex-wrap justify-center gap-4">
                <a href="/api/health" class="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors font-semibold shadow-lg shadow-emerald-500/20">
                    Health Check
                </a>
                <div class="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium border border-slate-700">
                    Environment: production
                </div>
            </div>

            <div class="mt-12 pt-8 border-t border-white/5 text-slate-500 text-sm">
                &copy; 2026 SantriDanaKu Development Team
            </div>
        </div>
    </body>
    </html>
  `);
});

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

// Debug Database
app.get('/api/debug-db', async (c) => {
  try {
    const { sql } = await import('./db');
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

// ─── Global 404 ──────────────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ data: null, error: `Route ${c.req.method} ${c.req.path} not found`, message: null }, 404),
);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error(`[server] Unhandled error [${c.req.method} ${c.req.path}]:`, err);
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
