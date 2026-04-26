import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.warn('[db] No DATABASE_URL found. Please set it in Vercel Dashboard.');
}

// neon() returns a tagged-template SQL executor
export const sql = neon(connectionString || 'postgresql://placeholder-please-set-db-url');

export default sql;
