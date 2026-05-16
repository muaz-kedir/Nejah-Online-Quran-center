import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { RecentStudentsTable } from '@/components/dashboard/RecentStudentsTable';
import { StaffOverview } from '@/components/dashboard/StaffOverview';
import { TodaysClasses } from '@/components/dashboard/TodaysClasses';
import { SystemAlerts } from '@/components/dashboard/SystemAlerts';
import { createFileRoute } from '@tanstack/react-router';
import { useApp } from '@/context/AppContext';

function DashboardContent() {
  const { t } = useApp();
  const [userName, setUserName] = useState('Administrator');
  const [userRole, setUserRole] = useState('super_admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || 'Administrator');
      setUserRole(localStorage.getItem('userRole') || 'super_admin');
    }
  }, []);

  const getRoleTitle = (role: string) => {
    const titles: Record<string, string> = {
      super_admin: 'Super Administrator',
      admin: 'Administrator',
      teacher: 'Teacher',
      student: 'Student',
      parent: 'Parent',
    };
    return titles[role] || 'User';
  };

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 font-semibold">
          {t.managementOverview}
        </p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t.greeting},{' '}
          <span className="text-emerald-700 dark:text-emerald-400">{getRoleTitle(userRole)}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl">
          {t.welcomeMessage}
        </p>
      </div>

      {/* Analytics Cards */}
      <DashboardCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <RecentStudentsTable />
          <TodaysClasses />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <StaffOverview />
          <SystemAlerts />
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        throw new Error('Not authenticated');
      }
    }
  },
});
