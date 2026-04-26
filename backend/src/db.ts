import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[db] DATABASE_URL is not set. All DB operations will fail.');
}

// neon() returns a tagged-template SQL executor — compatible with Vercel Serverless & Edge
export const sql = neon(connectionString ?? 'postgresql://localhost/missing');

export default sql;
