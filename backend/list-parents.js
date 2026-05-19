const { Client } = require('pg');
require('dotenv').config();

async function listParents() {
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

    const result = await client.query(`
      SELECT 
        p.id, 
        p."fullName", 
        p.email, 
        p."phoneNumber",
        p.residency,
        p."relationshipWithStudent",
        p."createdAt"
      FROM parents p
      ORDER BY p."createdAt" DESC
    `);

    console.log(`Total parents: ${result.rows.length}\n`);
    
    result.rows.forEach(parent => {
      console.log('─'.repeat(80));
      console.log(`Parent: ${parent.fullName} (${parent.email})`);
      console.log(`Phone: ${parent.phoneNumber || 'NOT PROVIDED'}`);
      console.log(`Residency: ${parent.residency}`);
      console.log(`Relationship: ${parent.relationshipWithStudent}`);
      console.log(`Created: ${parent.createdAt.toISOString()}`);
    });
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

listParents();
