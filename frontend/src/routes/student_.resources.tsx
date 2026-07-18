import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/student_/resources')({
  beforeLoad: requireStudentAuth
});
