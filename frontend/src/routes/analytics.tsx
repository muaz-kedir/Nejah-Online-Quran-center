import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { TrendingUp, Users, BookOpen, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

function AnalyticsPage() {
  const metrics = [
    { label: 'Total Students', value: '156', change: '+12%', up: true, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Teachers', value: '24', change: '+2', up: true, icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Classes Today', value: '18', change: '-3', up: false, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Avg. Attendance', value: '94.2%', change: '+1.5%', up: true, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600 mb-8">Platform-wide performance metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <Badge className={m.up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}>
                {m.up ? <ArrowUp className="h-3 w-3 mr-1 inline" /> : <ArrowDown className="h-3 w-3 mr-1 inline" />}
                {m.change}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Enrollment Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Chart visualization placeholder</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Chart visualization placeholder</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
