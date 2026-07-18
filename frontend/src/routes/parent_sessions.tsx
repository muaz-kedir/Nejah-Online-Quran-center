import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/parent_sessions')({beforeLoad: () => requireAuth(['parent'])
});
