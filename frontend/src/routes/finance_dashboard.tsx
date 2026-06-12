import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AmbientSection, BentoStatCard, PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { financeFetch } from '@/lib/finance-api';
import {
  DollarSign, TrendingUp, AlertTriangle, Users, Home, Wallet, CalendarClock, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance_dashboard')({
  component: FinanceDashboardPage,
  beforeLoad: () => requireAuth(['finance_manager', 'super_admin']),
});

function FinanceDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setData(await financeFetch('/dashboard'));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cards = data ? [
    { label: 'Monthly Revenue', value: `$${data.totalMonthlyRevenue?.toLocaleString()}`, icon: DollarSign },
    { label: 'Collected Payments', value: `$${data.totalCollectedPayments?.toLocaleString()}`, icon: TrendingUp },
    { label: 'Outstanding', value: `$${data.totalOutstandingPayments?.toLocaleString()}`, icon: AlertTriangle },
    { label: 'Active Paying Students', value: data.totalActivePayingStudents, icon: Users },
    { label: 'Active Families', value: data.totalActiveFamilies, icon: Home },
    { label: 'Teacher Payroll', value: `$${data.totalTeacherPayroll?.toLocaleString()}`, icon: Wallet },
    { label: 'Due This Week', value: data.paymentsDueThisWeek, icon: CalendarClock },
    { label: 'Overdue Payments', value: data.overduePayments, icon: AlertTriangle },
  ] : [];

  return (
    <DashboardLayout>
      <AmbientSection>
        <PageHeader
          eyebrow="Financial Control Center"
          title="Finance Dashboard"
          description={`Real-time financial overview — billing period ${data?.billingMonth || '...'}`}
          actions={
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          }
        />

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass-panel h-28 animate-pulse rounded-2xl" />
              ))
            : cards.map((c) => (
                <BentoStatCard key={c.label} label={c.label} value={String(c.value)} icon={<c.icon className="h-5 w-5" />} />
              ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { to: '/finance_student-payments', label: 'Student Payments' },
            { to: '/finance_family-payments', label: 'Family Payments' },
            { to: '/finance_teacher-payments', label: 'Teacher Payments' },
            { to: '/finance_revenue', label: 'Revenue Analytics' },
            { to: '/finance_reports', label: 'Financial Reports' },
          ].map((link) => (
            <Link key={link.to} to={link.to} className="glass-panel rounded-2xl p-5 transition hover:border-nejah-electric/30">
              <p className="font-medium text-foreground">{link.label}</p>
              <p className="mt-1 text-xs text-nejah-slate-blue">View & manage →</p>
            </Link>
          ))}
        </div>
      </AmbientSection>
    </DashboardLayout>
  );
}
