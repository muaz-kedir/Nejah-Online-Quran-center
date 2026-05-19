const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
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

    // Check parents table schema
    const parentsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'parents'
      ORDER BY ordinal_position;
    `);

    console.log('PARENTS TABLE SCHEMA:');
    console.log('─'.repeat(60));
    parentsSchema.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(30)} | ${col.data_type.padEnd(15)} | ${col.is_nullable}`);
    });
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
