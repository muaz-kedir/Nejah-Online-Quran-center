const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nejah_db',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  logging: false,
});

async function checkTeacherRelationship() {
  try {
    await AppDataSource.initialize();
    
    console.log('=== TEACHER-USER RELATIONSHIP CHECK ===\n');
    
    // Get all teachers with their linked users
    const teachers = await AppDataSource.query(`
      SELECT 
        t.id as teacher_id,
        t.user_id,
        t.email as teacher_email,
        t.full_name,
        u.id as user_id,
        u.email as user_email,
        u.role
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.email LIKE '%@gmail.com%'
      ORDER BY t.email
    `);
    
    console.log('Teachers with linked users:');
    teachers.forEach(t => {
      console.log(`Teacher: ${t.teacher_id} | User: ${t.user_id} | Teacher Email: ${t.teacher_email} | User Email: ${t.user_email} | Role: ${t.role}`);
    });
    
    // Check for teachers without users
    const teachersWithoutUsers = await AppDataSource.query(`
      SELECT * FROM teachers WHERE user_id IS NULL
    `);
    
    console.log(`\nTeachers without linked users: ${teachersWithoutUsers.length}`);
    teachersWithoutUsers.forEach(t => {
      console.log(`Teacher: ${t.id} | Email: ${t.email}`);
    });
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkTeacherRelationship();
