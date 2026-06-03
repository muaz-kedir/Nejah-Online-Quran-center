-- Fix teachers without userId by matching email
UPDATE teachers 
SET user_id = u.id
FROM users u
WHERE teachers.email = u.email
  AND teachers.user_id IS NULL;

-- Verify the fix
SELECT 
  t.id as teacher_id,
  t.user_id,
  t.email as teacher_email,
  u.email as user_email,
  u.role
FROM teachers t
LEFT JOIN users u ON t.user_id = u.id
WHERE t.email LIKE '%@gmail.com%'
ORDER BY t.email;
