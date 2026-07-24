import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/dashboard')({beforeLoad: () => requireAuth(['super_admin'])
});
