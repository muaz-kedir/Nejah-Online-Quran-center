import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/zoom-settings')({
  ssr: false,
  beforeLoad: () => requireAuth(['teacher', 'super_admin'])
});
