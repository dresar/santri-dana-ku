import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('localhost')) {
  console.warn('[db] DATABASE_URL is missing or local. If this is Vercel, check your Environment Variables.');
}

// neon() returns a tagged-template SQL executor — compatible with Vercel Serverless & Edge
export const sql = neon(connectionString || 'postgresql://unconfigured');

export default sql;
