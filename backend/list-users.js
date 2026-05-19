const { Client } = require('pg');
require('dotenv').config();

async function listUsers() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nejah_db',
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const result = await client.query(
      'SELECT id, email, name, role, "isActive", "createdAt" FROM users ORDER BY "createdAt" DESC'
    );

    console.log(`Total users: ${result.rows.length}\n`);
    console.log('ID | Email | Name | Role | Active | Created At');
    console.log('-'.repeat(100));
    
    result.rows.forEach(user => {
      console.log(
        `${user.id.substring(0, 8)}... | ${user.email.padEnd(30)} | ${user.name.padEnd(20)} | ${user.role.padEnd(12)} | ${user.isActive ? 'Yes' : 'No'} | ${user.createdAt.toISOString().split('T')[0]}`
      );
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

listUsers();
