import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { Bell } from 'lucide-react';

export const Route = createFileRoute('/finance_notifications')({
  component: FinanceNotificationsPage,
  beforeLoad: () => requireAuth(['finance_manager', 'super_admin']),
});

function FinanceNotificationsPage() {
  return (
    <DashboardLayout>
      <PageHeader eyebrow="Alerts" title="Notifications" description="Payment reminders and financial alerts" />
      <div className="glass-panel flex flex-col items-center justify-center rounded-2xl py-20 text-center">
        <Bell className="mb-4 h-12 w-12 text-nejah-electric/50" />
        <p className="text-nejah-slate-blue">Financial notifications will appear here when payments are due or overdue.</p>
      </div>
    </DashboardLayout>
  );
}
