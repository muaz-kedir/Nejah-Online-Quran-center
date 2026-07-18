import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/student_/progress')({beforeLoad: requireStudentAuth
});
