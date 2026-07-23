// Live sessions analytics page — Zoom analytics has been deprecated
// Teachers now paste meeting links manually; analytics handled via live-sessions/stats
import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export const Route = createFileRoute('/live-sessions/analytics')({
  component: () => (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <p>Session analytics are unavailable with manual meeting links.</p>
      </div>
    </DashboardLayout>
  ),
  beforeLoad: () => requireAuth(['super_admin']),
});
