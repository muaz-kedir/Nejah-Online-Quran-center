import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/finance_revenue')({beforeLoad: () => requireAuth(['finance_manager', 'super_admin'])
});
