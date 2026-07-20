import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute("/website/support/pages")({beforeLoad: () => requireAuth(["super_admin"])
});
