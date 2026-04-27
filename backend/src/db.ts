import * as dotenv from 'dotenv';
dotenv.config();
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!connectionString) {
  const errorMsg = '[db] DATABASE_URL is not defined. If you are on Vercel, set it in the Dashboard. If you are on cPanel, set it in the Node.js Application Environment Variables.';
  console.error(errorMsg);
  // Throwing an error here prevents neon() from being called with an invalid string
  // which results in a confusing "format" error.
  throw new Error(errorMsg);
}

// neon() returns a tagged-template SQL executor
export const sql = neon(connectionString);

export default sql;
