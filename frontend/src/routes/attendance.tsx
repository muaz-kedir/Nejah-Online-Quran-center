import { createFileRoute, redirect } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/attendance')({
  beforeLoad: () => {
    requireAuth(['admin', 'super_admin', 'qirat_manager']);
    throw redirect({ to: '/live-sessions' });
  },
});
