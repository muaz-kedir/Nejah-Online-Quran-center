const { Client } = require('pg');
require('dotenv').config();

async function testFullRegistration() {
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

    // Test inserting a student directly
    const testStudent = {
      fullName: 'Test Direct Student',
      gender: 'Male',
      age: 20,
      currentResidency: 'Ethiopia',
      level: 'Beginner',
      email: 'testdirect' + Date.now() + '@example.com',
      status: 'active',
      attendanceRate: 0,
      progressRate: 0,
      studentCode: 'NJ-2026-TEST'
    };

    console.log('Attempting to insert student with data:');
    console.log(JSON.stringify(testStudent, null, 2));
    console.log('\n');

    const result = await client.query(`
      INSERT INTO students 
      ("fullName", gender, age, "currentResidency", level, email, status, "attendanceRate", "progressRate", "studentCode")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      testStudent.fullName,
      testStudent.gender,
      testStudent.age,
      testStudent.currentResidency,
      testStudent.level,
      testStudent.email,
      testStudent.status,
      testStudent.attendanceRate,
      testStudent.progressRate,
      testStudent.studentCode
    ]);

    console.log('✅ Student inserted successfully!');
    console.log('Student ID:', result.rows[0].id);
    console.log('\nCleaning up test data...');
    
    await client.query('DELETE FROM students WHERE id = $1', [result.rows[0].id]);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detail:', error.detail);
  } finally {
    await client.end();
  }
}

testFullRegistration();
