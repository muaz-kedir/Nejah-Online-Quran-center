import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teachers_/create')({beforeLoad: () => requireAuth(['super_admin'])
});
