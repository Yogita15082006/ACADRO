const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:payal@localhost:5432/acronexus' });

client.connect()
  .then(() => client.query("SELECT * FROM users WHERE role = 'HOD'"))
  .then(res => {
    console.log(res.rows);
    client.end();
  })
  .catch(console.error);
