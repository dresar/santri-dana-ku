import * as dotenv from 'dotenv';
dotenv.config();
import { serve } from '@hono/node-server';
import app from './index.js';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3002;

console.log(`[server] Memulai backend API di http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
