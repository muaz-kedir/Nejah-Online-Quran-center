const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../backend/.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

async function checkUser() {
  const env = loadEnv();
  const client = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    const res = await client.query("SELECT email, role, \"isActive\" FROM users WHERE email = 'nejahsuperadmin@gmail.com'");
    if (res.rows.length > 0) {
      console.log('User found:', res.rows[0]);
    } else {
      console.log('User NOT found.');
    }
    
    const allUsers = await client.query("SELECT email FROM users");
    console.log('All users in DB:', allUsers.rows.map(r => r.email));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkUser();
