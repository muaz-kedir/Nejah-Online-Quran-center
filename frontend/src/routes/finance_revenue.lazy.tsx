/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useEffect, useState } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BentoStatCard, PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { financeFetch, FinanceFilters } from '@/lib/finance-api';
import { FinanceFilterBar } from '@/components/finance/FinanceFilters';
import { DollarSign, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

export const Route = createLazyFileRoute('/finance_revenue')({
  component: RevenuePage,
});

function RevenuePage() {
  const [filters, setFilters] = useState<FinanceFilters>({ dateRange: 'year' });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setData(await financeFetch('/revenue-analytics', filters));
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  const stats = data ? [
    { label: 'Daily Revenue', value: `ETB ${data.dailyRevenue}`, icon: DollarSign },
    { label: 'Weekly Revenue', value: `ETB ${data.weeklyRevenue}`, icon: TrendingUp },
    { label: 'Monthly Revenue', value: `ETB ${data.monthlyRevenue}`, icon: Calendar },
    { label: 'Annual Revenue', value: `ETB ${data.annualRevenue}`, icon: BarChart3 },
  ] : [];

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Analytics" title="Revenue Analytics" description="Revenue, collection, and payroll trends" />
      <div className="mb-6"><FinanceFilterBar filters={filters} onChange={setFilters} showProgram={false} showStatus={false} /></div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-panel h-24 animate-pulse rounded-2xl" />)
          : stats.map((s) => <BentoStatCard key={s.label} label={s.label} value={s.value} icon={<s.icon className="h-5 w-5" />} />)}
      </div>

      {!loading && data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="mb-4 font-medium">Revenue Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#0066CC" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="mb-4 font-medium">Collection Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data.collectionTrends || []).slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="collected" fill="#0066CC" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="mb-4 font-medium">Outstanding Payments</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.outstandingTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="outstanding" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="mb-4 font-medium">Teacher Payroll Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.payrollTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="payroll" stroke="#0A3663" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
