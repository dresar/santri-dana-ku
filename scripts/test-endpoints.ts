import app from '../backend/src/index.js';
import { serve } from '@hono/node-server';

const server = serve({ fetch: app.fetch, port: 3002 });

async function runTests() {
  await new Promise(r => setTimeout(r, 300));
  console.log('\n=== SantriDanaKu API Test Suite ===\n');

  let token = '';

  async function hit(label: string, method: string, path: string, body?: any, auth?: string) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = `Bearer ${auth}`;
    const res = await fetch(`http://localhost:3002/api${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    const ok = res.status < 400 ? '✅' : '❌';
    console.log(`${ok} [${res.status}] ${method} /api${path} ${data.error ? '— ' + data.error : ''}`);
    return { status: res.status, data };
  }

  const h = await hit('health', 'GET', '/health');

  const login = await hit('login admin', 'POST', '/auth/login', { email: 'admin@example.com', password: 'password123' });
  if (login.data?.data?.token) {
    token = login.data.data.token;
    console.log('   Token obtained ✓');
  }

  await hit('login wrong pw', 'POST', '/auth/login', { email: 'admin@example.com', password: 'wrong' });
  await hit('me (auth)', 'GET', '/auth/me', undefined, token);
  await hit('me (no token)', 'GET', '/auth/me');
  await hit('ajuan list', 'GET', '/ajuan', undefined, token);
  await hit('pengguna list (admin)', 'GET', '/pengguna', undefined, token);
  await hit('laporan ringkasan', 'GET', '/laporan/ringkasan', undefined, token);
  await hit('laporan bulanan', 'GET', '/laporan/bulanan?year=2026', undefined, token);
  await hit('pencairan list', 'GET', '/pencairan', undefined, token);
  await hit('notifikasi', 'GET', '/notifikasi', undefined, token);
  await hit('audit log', 'GET', '/audit', undefined, token);
  await hit('ai keys status (admin)', 'GET', '/ai/keys/status', undefined, token);
  await hit('404 not found', 'GET', '/nonexistent');

  console.log('\n=== Test complete ===\n');
  server.close();
  process.exit(0);
}

runTests().catch(e => { console.error(e); process.exit(1); });
