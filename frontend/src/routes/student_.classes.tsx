import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/student_/classes')({beforeLoad: requireStudentAuth
});
