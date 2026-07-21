import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/qirat_exams')({beforeLoad: () => requireAuth(['qirat_manager', 'super_admin'])
});
