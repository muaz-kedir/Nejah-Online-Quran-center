import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/live-sessions')({beforeLoad: () => requireAuth(['super_admin', 'qirat_manager', 'teacher'])
});
