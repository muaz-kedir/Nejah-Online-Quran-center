const { Client } = require('pg');
require('dotenv').config();

async function listTeachers() {
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
      'SELECT id, email, "fullName", gender, "phoneNumber", specialization, experience, status, country, city FROM teachers ORDER BY "createdAt" DESC'
    );

    console.log(`Total teachers: ${result.rows.length}\n`);
    console.log('ID | Email | Name | Gender | Phone | Specialization | Experience | Status | Country | City');
    console.log('-'.repeat(150));
    
    result.rows.forEach(teacher => {
      console.log(
        `${teacher.id.substring(0, 8)}... | ${teacher.email.padEnd(30)} | ${teacher.fullName.padEnd(20)} | ${teacher.gender.padEnd(6)} | ${(teacher.phoneNumber || 'N/A').padEnd(12)} | ${(teacher.specialization || 'N/A').padEnd(20)} | ${teacher.experience || 0} | ${teacher.status} | ${teacher.country || 'N/A'} | ${teacher.city || 'N/A'}`
      );
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

listTeachers();
