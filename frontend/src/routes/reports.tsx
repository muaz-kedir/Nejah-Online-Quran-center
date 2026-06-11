import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { BarChart3, Download, FileText, Users, GraduationCap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth';
import { AmbientSection, GlassPanel, PageHeader } from '@/components/dashboard/design-system';

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

function ReportsPage() {
  const reports = [
    { title: 'Student Performance Summary', icon: Users, desc: 'Overall student progress and attendance rates' },
    { title: 'Teacher Activity Report', icon: GraduationCap, desc: 'Teacher class conduct, punctuality and feedback' },
    { title: 'Attendance Analytics', icon: BarChart3, desc: 'Daily and monthly attendance patterns' },
    { title: 'Academic Progress Report', icon: TrendingUp, desc: 'Quran memorization and level advancement' },
  ];

  return (
    <DashboardLayout>
      <AmbientSection>
        <Breadcrumbs />
        <PageHeader
          eyebrow="Analytics Center"
          title="Reports"
          description="Generate and view system reports"
          actions={
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export All
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {reports.map((report) => (
            <GlassPanel
              key={report.title}
              className="cursor-pointer p-6 transition-all duration-300 hover:border-brand-electric/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-electric/20 bg-brand-electric/10 text-brand-electric">
                  <report.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-brand-silver">{report.title}</h3>
                    <FileText className="h-5 w-5 text-brand-platinum" />
                  </div>
                  <p className="mt-1 text-sm text-brand-platinum">{report.desc}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm">View Report</Button>
                    <Button size="sm" variant="outline">
                      <Download className="mr-1 h-4 w-4" /> PDF
                    </Button>
                  </div>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </AmbientSection>
    </DashboardLayout>
  );
}
