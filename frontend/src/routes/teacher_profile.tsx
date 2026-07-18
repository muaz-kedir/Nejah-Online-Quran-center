import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teacher_profile')({
  beforeLoad: () => requireAuth(['teacher'])
});
