# Fix 403 Forbidden Error When Logging Student Progress

## Problem
When a teacher tries to log progress for a student, they receive a **403 Forbidden** error:
```
PATCH http://localhost:3000/api/progress/student/fddd58f9-25c6-4443-b21a-50bf0fe88735/log 403 (Forbidden)
```

## Root Cause
The backend checks if the teacher has permission to manage the student before allowing them to log progress. A teacher can only log progress if they meet **at least one** of these criteria:

1. ✅ **Direct Assignment** - The teacher is assigned as the student's primary teacher (`student.teacherId`)
2. ✅ **Active Schedule** - There's an active schedule between the teacher and student
3. ✅ **Active/Upcoming Replacement** - The teacher has an active or upcoming replacement assignment for the student

If none of these conditions are met, the backend returns a 403 Forbidden error.

## Solutions

### Option 1: Assign Teacher Directly to Student (Recommended)

**Via Database:**
```sql
-- Update the student's teacherId
UPDATE student 
SET "teacherId" = '<teacher-id-here>' 
WHERE id = 'fddd58f9-25c6-4443-b21a-50bf0fe88735';
```

**Via Admin Panel:**
1. Login as SUPER_ADMIN or ADMIN
2. Navigate to Students page
3. Click on the student
4. Edit and assign the correct teacher
5. Save changes

### Option 2: Create an Active Schedule

**Via API:**
```typescript
POST /api/schedules
{
  "studentId": "fddd58f9-25c6-4443-b21a-50bf0fe88735",
  "teacherId": "<teacher-id>",
  "className": "Quran Reading",
  "dayOfWeek": "Monday",
  "startTimeString": "09:00",
  "endTimeString": "10:00",
  "status": "active"
}
```

**Via Admin Panel:**
1. Navigate to Schedules page
2. Click "Add Schedule"
3. Select the student and teacher
4. Fill in class details
5. Set status to "active"
6. Save

### Option 3: Check Database Relationships

Run the diagnostic script to check the current relationship:

```bash
# Navigate to backend directory
cd backend

# Run the diagnostic script
npm run ts-node src/scripts/check-teacher-student-access.ts <teacher-user-id> <student-id>
```

This will show you:
- Whether the teacher is directly assigned
- Any active schedules
- Any active replacements
- Suggested SQL to fix the issue

## Code Changes Made

### 1. Improved Error Message (`progress.controller.ts`)

Changed from generic "Forbidden" to:
```
You do not have permission to log progress for this student. 
Please ensure you are assigned as this student's teacher or have an active schedule/replacement with them.
```

### 2. Added Diagnostic Script

Created `backend/src/scripts/check-teacher-student-access.ts` to help diagnose permission issues.

## How to Verify the Fix

1. **Check the student's assigned teacher:**
```sql
SELECT id, "fullName", "teacherId" 
FROM student 
WHERE id = 'fddd58f9-25c6-4443-b21a-50bf0fe88735';
```

2. **Check active schedules:**
```sql
SELECT s.*, t."fullName" as teacher_name, st."fullName" as student_name
FROM schedule s
JOIN teacher t ON s."teacherId" = t.id
JOIN student st ON s."studentId" = st.id
WHERE s."studentId" = 'fddd58f9-25c6-4443-b21a-50bf0fe88735'
AND s.status = 'active';
```

3. **Check replacements:**
```sql
SELECT * 
FROM teacher_replacement 
WHERE "studentId" = 'fddd58f9-25c6-4443-b21a-50bf0fe88735'
AND status IN ('active', 'upcoming');
```

## Prevention

To prevent this issue in the future:

1. **Always assign a teacher when creating a student**
   - Ensure the `teacherId` field is set when creating new students
   
2. **Create schedules for all teacher-student pairs**
   - Even if a teacher is directly assigned, having an active schedule provides backup access

3. **Use the diagnostic script**
   - Run it before allowing teachers to access new students

## Related Files

- `backend/src/progress/progress.controller.ts` - The endpoint that checks permissions
- `backend/src/teachers/teachers.service.ts` - Delegates to teacher-replacements service
- `backend/src/teacher-replacements/teacher-replacements.service.ts` - Contains the permission logic
- `backend/src/scripts/check-teacher-student-access.ts` - Diagnostic tool

## API Endpoint Details

**Endpoint:** `PATCH /api/progress/student/:studentId/log`

**Required Roles:** `SUPER_ADMIN`, `ADMIN`, `QIRAT_MANAGER`, `TEACHER`

**Permission Check Logic:**
```typescript
// For TEACHER role:
1. Check if teacher is the current effective teacher (via replacement or direct)
2. Check if teacher is the permanent assigned teacher
3. Check if teacher has active schedule with student
4. Check if teacher has active/upcoming replacement
```

## Testing

After applying the fix, test by:

1. Login as the teacher
2. Navigate to the student's progress panel
3. Try to log progress
4. Should succeed without 403 error

## Support

If the issue persists:
1. Run the diagnostic script and share the output
2. Check the backend console logs for more details
3. Verify the JWT token contains the correct user ID and role
4. Ensure the teacher record exists in the database
