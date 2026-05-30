import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { BarChart3, Download, FileText, Users, GraduationCap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

function ReportsPage() {
  const reports = [
    { title: 'Student Performance Summary', icon: Users, desc: 'Overall student progress and attendance rates', color: 'bg-blue-50 text-blue-600' },
    { title: 'Teacher Activity Report', icon: GraduationCap, desc: 'Teacher class conduct, punctuality and feedback', color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Attendance Analytics', icon: BarChart3, desc: 'Daily and monthly attendance patterns', color: 'bg-amber-50 text-amber-600' },
    { title: 'Academic Progress Report', icon: TrendingUp, desc: 'Quran memorization and level advancement', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view system reports</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div key={report.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${report.color}`}>
                <report.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mt-1">{report.desc}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">View Report</Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
