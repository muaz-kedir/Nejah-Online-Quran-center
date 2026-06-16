import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

/**
 * Diagnostic script to check teacher-student access permissions
 * 
 * Usage: npm run ts-node src/scripts/check-teacher-student-access.ts <teacherUserId> <studentId>
 */
async function checkAccess() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const teacherUserId = process.argv[2];
  const studentId = process.argv[3];

  if (!teacherUserId || !studentId) {
    console.error('Usage: npm run ts-node src/scripts/check-teacher-student-access.ts <teacherUserId> <studentId>');
    process.exit(1);
  }

  console.log(`\n🔍 Checking access for Teacher User ID: ${teacherUserId}`);
  console.log(`📚 Student ID: ${studentId}\n`);

  // 1. Find teacher by user ID
  const teacher = await dataSource.query(
    `SELECT id, "fullName", "userId" FROM teacher WHERE "userId" = $1`,
    [teacherUserId]
  );

  if (!teacher || teacher.length === 0) {
    console.error('❌ Teacher not found with that user ID');
    await app.close();
    return;
  }

  const teacherId = teacher[0].id;
  console.log(`✅ Teacher found: ${teacher[0].fullName} (ID: ${teacherId})`);

  // 2. Find student
  const student = await dataSource.query(
    `SELECT id, "fullName", "teacherId", status FROM student WHERE id = $1`,
    [studentId]
  );

  if (!student || student.length === 0) {
    console.error('❌ Student not found');
    await app.close();
    return;
  }

  console.log(`✅ Student found: ${student[0].fullName}`);
  console.log(`   Assigned Teacher ID: ${student[0].teacherId || 'None'}`);
  console.log(`   Status: ${student[0].status}`);

  // 3. Check direct assignment
  const isDirectlyAssigned = student[0].teacherId === teacherId;
  console.log(`\n📋 Direct Assignment: ${isDirectlyAssigned ? '✅ YES' : '❌ NO'}`);

  // 4. Check active schedules
  const schedules = await dataSource.query(
    `SELECT id, "className", "dayOfWeek", status FROM schedule WHERE "studentId" = $1 AND "teacherId" = $2 AND status = 'active'`,
    [studentId, teacherId]
  );

  console.log(`\n📅 Active Schedules: ${schedules.length > 0 ? `✅ YES (${schedules.length})` : '❌ NO'}`);
  if (schedules.length > 0) {
    schedules.forEach((s: any) => {
      console.log(`   - ${s.className} on ${s.dayOfWeek}`);
    });
  }

  // 5. Check active/upcoming replacements
  const replacements = await dataSource.query(
    `SELECT id, status, "startDate", "endDate", reason 
     FROM teacher_replacement 
     WHERE "studentId" = $1 
     AND "replacementTeacherId" = $2 
     AND status IN ('active', 'upcoming')`,
    [studentId, teacherId]
  );

  console.log(`\n🔄 Active/Upcoming Replacements: ${replacements.length > 0 ? `✅ YES (${replacements.length})` : '❌ NO'}`);
  if (replacements.length > 0) {
    replacements.forEach((r: any) => {
      console.log(`   - ${r.status}: ${r.startDate} to ${r.endDate}`);
      console.log(`     Reason: ${r.reason}`);
    });
  }

  // 6. Summary
  const hasAccess = isDirectlyAssigned || schedules.length > 0 || replacements.length > 0;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESULT: Teacher ${hasAccess ? '✅ HAS' : '❌ DOES NOT HAVE'} access to log progress for this student`);
  console.log(`${'='.repeat(60)}`);

  if (!hasAccess) {
    console.log(`\n💡 Solutions:`);
    console.log(`   1. Assign the teacher directly to the student`);
    console.log(`      UPDATE student SET "teacherId" = '${teacherId}' WHERE id = '${studentId}';`);
    console.log(`\n   2. Create an active schedule for the teacher and student`);
    console.log(`\n   3. Create a replacement assignment for this period\n`);
  }

  await app.close();
}

checkAccess().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
