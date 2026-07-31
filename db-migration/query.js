const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:your_password_here@localhost:5432/acronexus' });

client.connect()
  .then(() => client.query("SELECT * FROM users WHERE role = 'HOD'"))
  .then(res => {
    console.log(res.rows);
    client.end();
  })
  .catch(console.error);
