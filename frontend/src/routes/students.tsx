import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/students')({beforeLoad: () => requireAuth(['super_admin', 'qirat_manager'])
});
