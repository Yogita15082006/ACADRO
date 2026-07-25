const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function updatePasswords() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'acronexus',
    password: 'payal',
    port: 5432,
  });

  try {
    await client.connect();
    
    const res = await client.query('SELECT id, email, password_hash FROM users WHERE password_hash = $1', ['password']);
    console.log(`Found ${res.rowCount} users with plaintext password`);
    
    if (res.rowCount > 0) {
      const hash = bcrypt.hashSync('password', 10);
      console.log(`Generated hash: ${hash}`);
      
      const updateRes = await client.query('UPDATE users SET password_hash = $1 WHERE password_hash = $2', [hash, 'password']);
      console.log(`Updated ${updateRes.rowCount} users`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

updatePasswords();
