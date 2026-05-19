const { Client } = require('pg');
require('dotenv').config();

async function listStudents() {
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
        s.id, 
        s."fullName", 
        s.email, 
        s.gender, 
        s.age, 
        s."currentResidency", 
        s.level,
        p."fullName" as "parentName",
        p.email as "parentEmail",
        p."phoneNumber" as "parentPhone",
        s."createdAt"
      FROM students s
      LEFT JOIN parents p ON s."parentId" = p.id
      ORDER BY s."createdAt" DESC
    `);

    console.log(`Total students: ${result.rows.length}\n`);
    
    result.rows.forEach(student => {
      console.log('─'.repeat(80));
      console.log(`Student: ${student.fullName} (${student.email})`);
      console.log(`Gender: ${student.gender} | Age: ${student.age} | Level: ${student.level}`);
      console.log(`Residency: ${student.currentResidency}`);
      console.log(`Parent: ${student.parentName} (${student.parentEmail})`);
      console.log(`Parent Phone: ${student.parentPhone || 'Not provided'}`);
      console.log(`Created: ${student.createdAt.toISOString()}`);
    });
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

listStudents();
