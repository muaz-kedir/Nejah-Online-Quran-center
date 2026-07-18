import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teachers_/$id')({beforeLoad: () => requireAuth(['super_admin', 'qirat_manager'])
});
