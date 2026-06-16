import { API_BASE, apiUrl } from "@/lib/api";
import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { financeFetch, FinanceFilters, downloadCSV, exportPDF, authHeaders } from '@/lib/finance-api';
import { FinanceFilterBar } from '@/components/finance/FinanceFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Eye, Loader2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance_teacher-payments')({
  component: TeacherPaymentsPage,
  beforeLoad: () => requireAuth(['finance_manager', 'super_admin']),
});

function TeacherPaymentsPage() {
  const [filters, setFilters] = useState<FinanceFilters>({ page: 1, limit: 20, dateRange: 'month' });
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await financeFetch<any>('/teacher-payments', filters);
      setRows(res.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const generatePayroll = async () => {
    setGenerating(true);
    try {
      const res = await fetch(apiUrl(`/finance/teacher-payments/generate-payroll`), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed to generate payroll');
      const data = await res.json();
      toast.success(`Payroll generated for ${data.generated} teachers`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const openDetail = async (teacherId: string) => {
    try {
      setDetail(await financeFetch(`/teacher-payments/${teacherId}`, filters));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const exportRows = rows.map((r) => ({
    Teacher: r.teacherName,
    Students: r.totalAssignedStudents,
    Sessions: r.sessionsConducted,
    'Session Rate': r.sessionRate,
    Earnings: r.earnings,
    'Payroll Status': r.payrollStatus,
  }));

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Teacher Payroll"
        title="Teacher Payments"
        description="Automatic earnings from completed sessions"
        actions={
          <Button onClick={generatePayroll} disabled={generating}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Payroll'}
          </Button>
        }
      />
      <div className="mb-4 space-y-4">
        <FinanceFilterBar filters={filters} onChange={setFilters} showProgram={false} showStatus={false} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCSV('teacher-payroll.csv', exportRows, 'Teacher Payroll')}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPDF('Teacher Payroll', exportRows)}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.teacherId}>
                <TableCell className="font-medium">{r.teacherName}</TableCell>
                <TableCell>{r.totalAssignedStudents}</TableCell>
                <TableCell>{r.sessionsConducted}</TableCell>
                <TableCell>${r.sessionRate}</TableCell>
                <TableCell>${r.earnings}</TableCell>
                <TableCell className="capitalize">{r.payrollStatus}</TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => openDetail(r.teacherId)}><Eye className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detail?.teacherName} — Earnings Detail</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <p>Sessions: {detail.sessionsConducted} · Total: ${detail.earnings}</p>
              {detail.assignedStudents?.map((s: any, i: number) => (
                <div key={i} className="flex justify-between border-b border-white/5 py-2">
                  <span>{s.studentName} {s.isReplacement && '(replacement)'}</span>
                  <span>{s.sessionsConducted} sessions · ${s.earnings}</span>
                </div>
              ))}
              {detail.replacements?.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium">Replacement Periods</p>
                  {detail.replacements.map((r: any) => (
                    <p key={r.id} className="text-nejah-slate-blue">{r.startDate} → {r.endDate} ({r.status})</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
