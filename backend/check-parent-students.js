const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'nejah_db',
  synchronize: false,
  logging: true,
});

async function checkParentStudents() {
  console.log('='.repeat(60));
  console.log('CHECKING PARENT ↔ STUDENT RELATIONSHIPS IN DATABASE');
  console.log('='.repeat(60));

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Query parents with their students
    const parents = await AppDataSource.query(`
      SELECT 
        p.id as parent_id,
        p."fullName" as parent_name,
        p.email as parent_email,
        s.id as student_id,
        s."fullName" as student_name,
        s.email as student_email,
        s.level as student_level,
        s."parentId" as student_parent_id
      FROM parents p
      LEFT JOIN students s ON s."parentId" = p.id
      ORDER BY p."createdAt" DESC
      LIMIT 10
    `);

    console.log(`Found ${parents.length} parent-student records\n`);

    // Group by parent
    const parentMap = new Map();
    parents.forEach((row) => {
      if (!parentMap.has(row.parent_id)) {
        parentMap.set(row.parent_id, {
          id: row.parent_id,
          name: row.parent_name,
          email: row.parent_email,
          students: [],
        });
      }
      if (row.student_id) {
        parentMap.get(row.parent_id).students.push({
          id: row.student_id,
          name: row.student_name,
          email: row.student_email,
          level: row.student_level,
        });
      }
    });

    console.log('📊 PARENT → STUDENT RELATIONSHIPS:\n');
    let parentIndex = 1;
    parentMap.forEach((parent) => {
      console.log(`${parentIndex}. ${parent.name} (${parent.email})`);
      console.log(`   ID: ${parent.id}`);
      if (parent.students.length > 0) {
        console.log(`   ✅ Students (${parent.students.length}):`);
        parent.students.forEach((student, idx) => {
          console.log(`      ${idx + 1}. ${student.name} - ${student.level}`);
          console.log(`         Email: ${student.email}`);
        });
      } else {
        console.log(`   ❌ No students linked`);
      }
      console.log('');
      parentIndex++;
    });

    // Check for orphaned students (students without parents)
    const orphanedStudents = await AppDataSource.query(`
      SELECT 
        id,
        "fullName",
        email,
        "parentId"
      FROM students
      WHERE "parentId" IS NULL
      LIMIT 5
    `);

    if (orphanedStudents.length > 0) {
      console.log('⚠️  ORPHANED STUDENTS (No Parent Assigned):');
      orphanedStudents.forEach((student, idx) => {
        console.log(`   ${idx + 1}. ${student.fullName} (${student.email})`);
      });
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('CHECK COMPLETED');
    console.log('='.repeat(60));

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

checkParentStudents();
