const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:payal@localhost:5432/acronexus' });
const pwds = ['password', 'password123', 'admin', 'admin123', 'hod', 'hod123', 'HOD', 'HOD123', '123456', '12345678', 'qwerty', 'test', 'Test@123', 'acropolis', 'acronexus', 'AcroNexus', 'Acropolis'];
const queries = pwds.map(p => `password_hash = crypt('${p}', password_hash) AS "${p}"`).join(', ');

c.connect()
  .then(() => c.query(`SELECT email, ${queries} FROM users WHERE email='hod.cs@acropolis.in';`))
  .then(r => {
    const row = r.rows[0];
    for (const [k, v] of Object.entries(row)) {
        if (v === true) console.log('Password is:', k);
    }
    c.end();
  })
  .catch(e => {
    console.log(e);
    c.end();
  });
