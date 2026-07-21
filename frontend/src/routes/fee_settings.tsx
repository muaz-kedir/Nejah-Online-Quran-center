import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/fee_settings')({beforeLoad: () => requireAuth(['super_admin', 'finance_manager'])
});
