import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute("/class-session_/$id")({beforeLoad: () => requireAuth(["super_admin", "qirat_manager", "teacher", "student"])
});
