import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teacher-applications_/$id')({beforeLoad: () => requireAuth(['super_admin'])
});
