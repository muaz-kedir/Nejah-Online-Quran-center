import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/finance_expenses')({beforeLoad: () => requireAuth(['finance_manager', 'super_admin'])
});
