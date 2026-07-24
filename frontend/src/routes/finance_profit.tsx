import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/finance_profit')({beforeLoad: () => requireAuth(['super_admin'])
});
