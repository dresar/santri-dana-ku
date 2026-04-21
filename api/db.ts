import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Database operations will fail.');
}

export const sql = postgres(connectionString || 'postgres://localhost/missing', {
  ssl: connectionString ? 'require' : false,
  max: 10,
});

export default sql;
