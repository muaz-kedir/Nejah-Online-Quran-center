import { createFileRoute } from '@tanstack/react-router';
import { requireStudentAuth } from '@/lib/student-portal';

export const Route = createFileRoute("/student_/notifications")({beforeLoad: requireStudentAuth
});
