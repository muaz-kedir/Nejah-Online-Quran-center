import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/admin_student-history')({beforeLoad: () => requireAuth(['super_admin', 'qirat_manager'])
});
