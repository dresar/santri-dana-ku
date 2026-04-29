import sql from './src/db';

async function check() {
  try {
    const res = await sql`
      SELECT p.*, ur.role 
      FROM profiles p 
      JOIN user_roles ur ON ur.user_id = p.id 
      WHERE ur.role = 'approver'
    `;
    console.log('Approvers found:', JSON.stringify(res, null, 2));
    
    const allUsers = await sql`SELECT p.email, ur.role FROM profiles p JOIN user_roles ur ON ur.user_id = p.id`;
    console.log('All users:', JSON.stringify(allUsers, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
