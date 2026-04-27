import { serve } from '@hono/node-server';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from the current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// POLYFILL: Ensure Fetch API globals are available for Node.js < 18
if (typeof globalThis.Request === 'undefined') {
  const undici = require('undici');
  Object.assign(globalThis, { 
    Request: undici.Request, 
    Response: undici.Response, 
    Headers: undici.Headers, 
    fetch: undici.fetch 
  });
}

import app from './index';

const port = Number(process.env.PORT) || 3000;

console.log(`[cPanel] Server santridanaku starting on port ${port}...`);

// Use a variable to handle potential default export wrapping in CJS
const handler = (app as any).default || app;

serve({
  fetch: handler.fetch,
  port: port
});
