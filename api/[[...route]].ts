import { handle } from 'hono/vercel';
import app from '../backend/src/index';

// Vercel Serverless catch-all handler
// Routes: /api/* → Hono app
export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);
export const OPTIONS = handle(app);

export default app;
