const { Client } = require('pg');

// Testing with IPv6 address directly
const connectionString = 'postgresql://postgres:mk12@MK1221@[2a05:d018:10e0:3302:3415:971e:db2c:cb94]:5432/postgres';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('Attempting to connect to Supabase PostgreSQL using IPv6 address...');

client.connect()
  .then(() => {
    console.log('✅ Successfully connected to Supabase via IPv6!');
    return client.query('SELECT NOW()');
  })
  .then((result) => {
    console.log('✅ Database time:', result.rows[0].now);
    return client.end();
  })
  .catch((err) => {
    console.error('❌ Connection failed:');
    console.error('Error:', err.message);
    process.exit(1);
  });
