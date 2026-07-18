import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/audit-logs')({beforeLoad: () => requireAuth(['super_admin'])
});
