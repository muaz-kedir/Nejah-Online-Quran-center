/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState } from 'react';
import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AmbientSection, BentoStatCard, PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import {
  DollarSign, TrendingUp, AlertTriangle, Users, Home, Wallet, CalendarClock, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useApiQuery } from "@/hooks/useApiQuery";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createLazyFileRoute('/finance_dashboard')({
  component: FinanceDashboardPage,
});

function FinanceDashboardPage() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useApiQuery<any>({
    queryKey: ["finance-dashboard"],
    path: `/finance/dashboard`,
    refetchInterval: 30_000,
  });

  const cards = data ? [
    { label: 'Monthly Revenue', value: `ETB ${data.totalMonthlyRevenue?.toLocaleString()}`, icon: DollarSign },
    { label: 'Collected Payments', value: `ETB ${data.totalCollectedPayments?.toLocaleString()}`, icon: TrendingUp },
    { label: 'Outstanding', value: `ETB ${data.totalOutstandingPayments?.toLocaleString()}`, icon: AlertTriangle },
    { label: 'Active Paying Students', value: data.totalActivePayingStudents, icon: Users },
    { label: 'Active Families', value: data.totalActiveFamilies, icon: Home },
    { label: 'Teacher Payroll', value: `ETB ${data.totalTeacherPayroll?.toLocaleString()}`, icon: Wallet },
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
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["finance-dashboard"] })} disabled={loading}>
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
              <p className="mt-1 text-xs text-muted-foreground">View & manage →</p>
            </Link>
          ))}
        </div>

        {!loading && data && (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="glass-panel rounded-2xl p-5 lg:col-span-2">
              <h3 className="mb-4 font-medium">Monthly Revenue Trend</h3>
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
              <h3 className="mb-4 font-medium">Collection vs Outstanding</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.collectionVsOutstanding || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0066CC" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5 lg:col-span-3">
              <h3 className="mb-4 font-medium">Revenue vs Payroll</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenueVsPayroll || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#0066CC" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="payroll" stroke="#dc2626" strokeWidth={2} name="Payroll" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </AmbientSection>
    </DashboardLayout>
  );
}
