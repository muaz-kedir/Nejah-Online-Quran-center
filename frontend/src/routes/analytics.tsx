import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { TrendingUp, Users, BookOpen, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { AmbientSection, BentoStatCard, GlassPanel, PageHeader } from '@/components/dashboard/design-system';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

function AnalyticsPage() {
  const metrics = [
    { label: 'Total Students', value: '156', change: '+12%', up: true, icon: Users },
    { label: 'Active Teachers', value: '24', change: '+2', up: true, icon: BookOpen },
    { label: 'Classes Today', value: '18', change: '-3', up: false, icon: Clock },
    { label: 'Avg. Attendance', value: '94.2%', change: '+1.5%', up: true, icon: TrendingUp, progress: 94.2 },
  ];

  return (
    <DashboardLayout>
      <AmbientSection>
        <Breadcrumbs />
        <PageHeader
          eyebrow="Insights"
          title="Analytics"
          description="Platform-wide performance metrics and insights"
        />

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <BentoStatCard
              key={m.label}
              label={m.label}
              value={m.value}
              sub={
                <span className={cn('inline-flex items-center gap-1', m.up ? 'text-brand-electric' : 'text-red-400')}>
                  {m.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {m.change}
                </span>
              }
              icon={<m.icon className="h-5 w-5" />}
              progress={m.progress}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassPanel className="p-6">
            <h3 className="mb-4 text-sm font-medium text-brand-silver">Monthly Enrollment Trends</h3>
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-brand-silver/20">
              <div className="text-center text-brand-platinum">
                <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-30" />
                <p className="text-sm">Chart visualization placeholder</p>
              </div>
            </div>
          </GlassPanel>
          <GlassPanel className="p-6">
            <h3 className="mb-4 text-sm font-medium text-brand-silver">Attendance Distribution</h3>
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-brand-silver/20">
              <div className="text-center text-brand-platinum">
                <Users className="mx-auto mb-2 h-12 w-12 opacity-30" />
                <p className="text-sm">Chart visualization placeholder</p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </AmbientSection>
    </DashboardLayout>
  );
}
