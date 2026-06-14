-- Fix Teacher-Student Assignments
-- This script helps identify and fix students without teacher assignments

-- 1. Find students without assigned teachers
SELECT 
    s.id,
    s."fullName" AS student_name,
    s."teacherId",
    s.level,
    s.status
FROM student s
WHERE s."teacherId" IS NULL
ORDER BY s."createdAt" DESC;

-- 2. Find all active teachers
SELECT 
    t.id,
    t."fullName" AS teacher_name,
    t.status,
    COUNT(DISTINCT st.id) AS student_count
FROM teacher t
LEFT JOIN student st ON st."teacherId" = t.id
WHERE t.status = 'active'
GROUP BY t.id, t."fullName", t.status
ORDER BY student_count ASC;

-- 3. Find students with teacher but no active schedules (potential issues)
SELECT 
    s.id,
    s."fullName" AS student_name,
    t."fullName" AS assigned_teacher,
    COUNT(sc.id) AS schedule_count
FROM student s
LEFT JOIN teacher t ON s."teacherId" = t.id
LEFT JOIN schedule sc ON sc."studentId" = s.id AND sc."teacherId" = t.id AND sc.status = 'active'
WHERE s."teacherId" IS NOT NULL
GROUP BY s.id, s."fullName", t."fullName"
HAVING COUNT(sc.id) = 0
ORDER BY s."fullName";

-- 4. Fix specific student (REPLACE THE IDs)
-- UPDATE student 
-- SET "teacherId" = '<teacher-id-here>' 
-- WHERE id = 'fddd58f9-25c6-4443-b21a-50bf0fe88735';

-- 5. Check the fix
-- SELECT 
--     s.id,
--     s."fullName" AS student_name,
--     t."fullName" AS teacher_name,
--     s."teacherId"
-- FROM student s
-- LEFT JOIN teacher t ON s."teacherId" = t.id
-- WHERE s.id = 'fddd58f9-25c6-4443-b21a-50bf0fe88735';

-- 6. Auto-assign students to teachers with lowest student count (USE WITH CAUTION)
-- This is commented out for safety - review results first
/*
WITH teacher_capacity AS (
    SELECT 
        t.id,
        COUNT(s.id) AS current_students
    FROM teacher t
    LEFT JOIN student s ON s."teacherId" = t.id
    WHERE t.status = 'active'
    GROUP BY t.id
    ORDER BY current_students ASC
    LIMIT 1
),
unassigned_students AS (
    SELECT id 
    FROM student 
    WHERE "teacherId" IS NULL 
    AND status = 'active'
)
UPDATE student
SET "teacherId" = (SELECT id FROM teacher_capacity)
WHERE id IN (SELECT id FROM unassigned_students);
*/

-- 7. Create schedules for students with teachers but no schedules
/*
INSERT INTO schedule ("studentId", "teacherId", "className", "dayOfWeek", "startTimeString", "endTimeString", "status")
SELECT 
    s.id,
    s."teacherId",
    'Quran Reading Class',
    'Monday',
    '09:00',
    '10:00',
    'active'
FROM student s
WHERE s."teacherId" IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM schedule sc 
    WHERE sc."studentId" = s.id 
    AND sc."teacherId" = s."teacherId"
    AND sc.status = 'active'
);
*/
