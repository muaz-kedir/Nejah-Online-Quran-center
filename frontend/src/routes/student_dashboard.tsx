import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute("/student_dashboard")({beforeLoad: requireStudentAuth
});
