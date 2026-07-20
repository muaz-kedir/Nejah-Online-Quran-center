import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/website/resources')({
  beforeLoad: () => requireAuth(['super_admin'])
});
