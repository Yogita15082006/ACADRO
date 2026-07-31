const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:your_password_here@localhost:5432/acronexus'
});

async function reset() {
  await client.connect();
  const hash = bcrypt.hashSync('password123', 10);
  await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'hod.cs@acropolis.in']);
  const res = await client.query('SELECT id, email, role, password_hash FROM users WHERE email = $1', ['hod.cs@acropolis.in']);
  console.log('Updated user:', res.rows[0]);
  await client.end();
}

reset().catch(console.error);
