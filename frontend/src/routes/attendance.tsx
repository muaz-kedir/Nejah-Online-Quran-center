import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/attendance')({beforeLoad: () => requireAuth(['super_admin', 'qirat_manager'])
});
