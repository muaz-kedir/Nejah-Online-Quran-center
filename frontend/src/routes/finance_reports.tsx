import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { financeFetch, FinanceFilters, downloadCSV, exportPDF } from '@/lib/finance-api';
import { FinanceFilterBar } from '@/components/finance/FinanceFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Users, GraduationCap, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance_reports')({
  component: FinanceReportsPage,
  beforeLoad: () => requireAuth(['finance_manager', 'super_admin']),
});

const REPORTS = [
  { id: 'parent-payments', title: 'Parent Payment Report', icon: Users, desc: 'Paid/unpaid families and outstanding balances' },
  { id: 'student-payments', title: 'Student Payment Report', icon: GraduationCap, desc: 'Paid, unpaid, and overdue students' },
  { id: 'teacher-payroll', title: 'Teacher Payroll Report', icon: FileText, desc: 'Teacher earnings and replacement payroll' },
  { id: 'revenue', title: 'Revenue Report', icon: DollarSign, desc: 'Total revenue and collection rate' },
];

function FinanceReportsPage() {
  const [filters, setFilters] = useState<FinanceFilters>({ dateRange: 'month' });
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const loadReport = async (type: string) => {
    setLoading(type);
    try {
      const data = await financeFetch(`/reports/${type}`, filters);
      setReportData((prev) => ({ ...prev, [type]: data }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const exportReport = (type: string, format: 'csv' | 'pdf') => {
    const data = reportData[type];
    if (!data?.details) {
      toast.error('Load the report first');
      return;
    }
    const rows = Array.isArray(data.details) ? data.details : [data];
    const flat = rows.map((r: any) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : v])));
    const title = REPORTS.find((r) => r.id === type)?.title || type;
    if (format === 'csv') downloadCSV(`${type}.csv`, flat, title);
    else exportPDF(title, flat);
  };

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Reporting" title="Financial Reports" description="Generate and export financial reports" />
      <div className="mb-6"><FinanceFilterBar filters={filters} onChange={setFilters} /></div>

      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((r) => {
          const data = reportData[r.id];
          return (
            <Card key={r.id} className="glass-panel border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <r.icon className="h-5 w-5 text-nejah-electric" /> {r.title}
                </CardTitle>
                <p className="text-sm text-nejah-slate-blue">{r.desc}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {data && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(data)
                      .filter(([k]) => k !== 'details')
                      .map(([k, v]) => (
                        <div key={k}>
                          <span className="text-nejah-slate-blue capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                          <span className="font-medium">{String(v)}</span>
                        </div>
                      ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => loadReport(r.id)} disabled={loading === r.id}>
                    {loading === r.id ? 'Loading...' : 'View Report'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exportReport(r.id, 'csv')} disabled={!data}>
                    <Download className="mr-1 h-3 w-3" /> Excel
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exportReport(r.id, 'pdf')} disabled={!data}>
                    <Download className="mr-1 h-3 w-3" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
