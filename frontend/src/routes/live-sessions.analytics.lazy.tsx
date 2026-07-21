// Zoom analytics deprecated — teachers paste meeting links manually.
import { createLazyFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export const Route = createLazyFileRoute('/live-sessions/analytics')({
  component: () => (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24 text-nejah-slate-blue">
        <p>Session analytics are unavailable with manual meeting links.</p>
      </div>
    </DashboardLayout>
  ),
});
