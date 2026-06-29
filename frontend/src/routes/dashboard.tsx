import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { RecentStudentsTable } from '@/components/dashboard/RecentStudentsTable';
import { StaffOverview } from '@/components/dashboard/StaffOverview';
import { TodaysClasses } from '@/components/dashboard/TodaysClasses';
import { SystemAlerts } from '@/components/dashboard/SystemAlerts';
import { AmbientSection, PageHeader } from '@/components/dashboard/design-system';
import { createFileRoute } from '@tanstack/react-router';
import { useApp } from '@/context/AppContext';
import { requireAuth } from '@/lib/auth';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function DashboardContent() {
  const { t } = useApp();
  const [userName, setUserName] = useState('Administrator');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || 'Administrator');
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <AmbientSection>
      <PageHeader
        eyebrow={t.managementOverview}
        title={`Assalamu Alaikum, ${userName}`}
        description="Welcome back to the Nejah command center."
        actions={
          <Button onClick={handleRefresh} variant="outline" className="h-11 gap-2 rounded-xl px-4" disabled={refreshing}>
            <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      <DashboardCards key={`cards-${refreshKey}`} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecentStudentsTable key={`recent-${refreshKey}`} />
          <TodaysClasses key={`today-${refreshKey}`} />
        </div>
        <div className="space-y-6">
          <StaffOverview key={`staff-${refreshKey}`} />
          <SystemAlerts key={`alerts-${refreshKey}`} />
        </div>
      </div>
    </AmbientSection>
  );
}

function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});
