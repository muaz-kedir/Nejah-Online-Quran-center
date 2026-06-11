import { useState, useEffect } from 'react';
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

function DashboardContent() {
  const { t } = useApp();
  const [userName, setUserName] = useState('Administrator');
  const [activeStudents, setActiveStudents] = useState<number | null>(null);

  useEffect(() => {
    const fetchActiveStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/students?limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setActiveStudents(data.meta?.total || 0);
      } catch (error) {
        console.error('Failed to fetch active students:', error);
      }
    };
    fetchActiveStudents();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || 'Administrator');
    }
  }, []);

  return (
    <AmbientSection>
      <PageHeader
        eyebrow={t.managementOverview}
        title={`Assalamu Alaikum, ${userName}`}
        description={`Welcome back to the Nejah command center. Your institution currently serves ${activeStudents !== null ? activeStudents.toLocaleString() : '...'} active seekers of knowledge.`}
      />

      <DashboardCards />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecentStudentsTable />
          <TodaysClasses />
        </div>
        <div className="space-y-6">
          <StaffOverview />
          <SystemAlerts />
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
