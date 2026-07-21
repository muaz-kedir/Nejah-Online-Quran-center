import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teacher_notifications')({
  beforeLoad: () => requireAuth(['teacher', 'super_admin'])
});
