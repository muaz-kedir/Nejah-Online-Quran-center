import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute("/website/home")({beforeLoad: () => requireAuth(["super_admin"])
});
