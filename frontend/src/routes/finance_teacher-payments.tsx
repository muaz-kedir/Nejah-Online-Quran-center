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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Download, Eye, Loader2, FileSpreadsheet, Save } from 'lucide-react';
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
  const [rateEdits, setRateEdits] = useState<Record<string, string>>({});
  const [savingRate, setSavingRate] = useState<string | null>(null);

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
      const d = await financeFetch<any>(`/teacher-payments/${teacherId}`, filters);
      setDetail(d);
      const edits: Record<string, string> = {};
      (d.assignedStudents || []).forEach((s: any) => {
        if (s.feeAccountId) edits[s.feeAccountId] = String(s.teacherMonthlyBudget ?? '');
      });
      setRateEdits(edits);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const saveStudentBudget = async (feeAccountId: string) => {
    const val = parseFloat(rateEdits[feeAccountId]);
    if (isNaN(val) || val < 0) {
      toast.error('Enter a valid budget amount');
      return;
    }
    setSavingRate(feeAccountId);
    try {
      const res = await fetch(apiUrl(`/finance/student-payments/${feeAccountId}`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ teacherMonthlyBudget: val }),
      });
      if (!res.ok) throw new Error('Failed to update budget');
      toast.success('Teacher budget updated');
      if (detail) {
        setDetail((prev: any) => ({
          ...prev,
          assignedStudents: (prev.assignedStudents || []).map((s: any) =>
            s.feeAccountId === feeAccountId ? { ...s, teacherMonthlyBudget: val } : s,
          ),
        }));
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingRate(null);
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
                <TableCell>ETB {r.sessionRate}</TableCell>
                <TableCell>ETB {r.earnings}</TableCell>
                <TableCell className="capitalize">{r.payrollStatus}</TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => openDetail(r.teacherId)}><Eye className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={() => { setDetail(null); setRateEdits({}); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detail?.teacherName} — Earnings Detail</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-4 flex-wrap">
                <span>Sessions Conducted: <strong>{detail.sessionsConducted}</strong></span>
                <span>Total Earnings: <strong>ETB {detail.earnings}</strong></span>
                <span>Monthly Salary: <strong>ETB {detail.monthlySalary || 0}</strong></span>
              </div>

              <div>
                <p className="mb-2 font-medium">Students — Teacher Budget Assignment</p>
                {detail.assignedStudents?.length === 0 && (
                  <p className="text-nejah-slate-blue">No student details</p>
                )}
                {detail.assignedStudents?.map((s: any, i: number) => {
                  const budget = parseFloat(rateEdits[s.feeAccountId] ?? '') || 0;
                  const perSession = s.monthlySessions > 0 ? (budget / s.monthlySessions).toFixed(2) : '—';
                  return (
                    <div key={i} className="border-b border-white/5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex-1 font-medium">
                          {s.studentName} {s.isReplacement && <span className="text-nejah-slate-blue">(replacement)</span>}
                        </span>
                        <span className="text-nejah-slate-blue text-xs">{s.sessionsConducted}/{s.monthlySessions} sess</span>
                      </div>
                      {s.weeklySchedule?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {s.weeklySchedule.map((sch: any, j: number) => (
                            <span key={j} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-nejah-slate-blue">
                              {sch.day} {sch.startTime}–{sch.endTime}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-nejah-slate-blue w-32">Teacher budget/mo:</span>
                        {s.feeAccountId ? (
                          <>
                            <Input
                              type="number"
                              className="h-8 w-24 text-xs"
                              value={rateEdits[s.feeAccountId] ?? ''}
                              onChange={(e) =>
                                setRateEdits({ ...rateEdits, [s.feeAccountId]: e.target.value })
                              }
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveStudentBudget(s.feeAccountId)}
                              disabled={savingRate === s.feeAccountId}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            {budget > 0 && (
                              <span className="text-xs text-nejah-slate-blue">
                                = ETB {perSession}/session
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-nejah-slate-blue">No fee account</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {detail.replacements?.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Replacement Periods</p>
                  {detail.replacements.map((r: any) => (
                    <p key={r.id} className="text-nejah-slate-blue">{r.startDate} → {r.endDate} ({r.status})</p>
                  ))}
                </div>
              )}

              {detail.payroll && (
                <div>
                  <p className="mb-2 font-medium">Payroll</p>
                  <p>Status: {detail.payroll.status} · Total: ETB {detail.payroll.totalEarnings}</p>
                  {detail.payroll.paidAt && <p>Paid: {detail.payroll.paidAt}</p>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
