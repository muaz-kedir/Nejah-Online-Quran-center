import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute("/website/support/analytics")({beforeLoad: () => requireAuth(["super_admin"])
});
