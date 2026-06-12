import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { financeFetch, FinanceFilters, statusBadgeVariant, downloadCSV, exportPDF, authHeaders } from '@/lib/finance-api';
import { FinanceFilterBar } from '@/components/finance/FinanceFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance_student-payments')({
  component: StudentPaymentsPage,
  beforeLoad: () => requireAuth(['finance_manager', 'super_admin']),
});

function StudentPaymentsPage() {
  const [filters, setFilters] = useState<FinanceFilters>({ page: 1, limit: 20, dateRange: 'month' });
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('payment');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await financeFetch<any>('/student-payments', filters);
      setRows(res.data || []);
      setMeta(res.meta);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      setDetail(await financeFetch(`/student-payments/${id}`));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const recordPayment = async () => {
    if (!detail || !payAmount) return;
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3000/api/finance/student-payments/${detail.id}/transactions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ amount: parseFloat(payAmount), type: payType }),
      });
      if (!res.ok) throw new Error('Failed to record payment');
      setDetail(await res.json());
      setPayAmount('');
      toast.success('Payment recorded');
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const markStatus = async (status: string) => {
    if (!detail) return;
    try {
      const res = await fetch(`http://localhost:3000/api/finance/student-payments/${detail.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setDetail(await res.json());
      toast.success(`Marked as ${status}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const exportRows = rows.map((r) => ({
    Student: r.studentName,
    Parent: r.parentName,
    Teacher: r.teacherName,
    Program: r.program,
    'Monthly Fee': r.monthlyFee,
    Paid: r.amountPaid,
    Balance: r.remainingBalance,
    Status: r.status,
    'Due Date': r.dueDate,
  }));

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Student Fees" title="Student Payments" description="Manage individual student fee accounts" />
      <div className="mb-4 space-y-4">
        <FinanceFilterBar filters={filters} onChange={setFilters} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCSV('student-payments.csv', exportRows, 'Student Payments')}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPDF('Student Payments', exportRows)}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Monthly Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-nejah-slate-blue">No payment records found</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.studentName}</TableCell>
                <TableCell>{r.parentName}</TableCell>
                <TableCell>{r.teacherName}</TableCell>
                <TableCell>{r.program}</TableCell>
                <TableCell>${r.monthlyFee}</TableCell>
                <TableCell><Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge></TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => openDetail(r.id)}><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-between">
          <Button variant="outline" disabled={filters.page! <= 1} onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}>Previous</Button>
          <span className="text-sm text-nejah-slate-blue">Page {meta.page} of {meta.totalPages}</span>
          <Button variant="outline" disabled={filters.page! >= meta.totalPages} onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}>Next</Button>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Payment Details — {detail?.studentName}</DialogTitle></DialogHeader>
          {detailLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-nejah-slate-blue">Program:</span> {detail.program}</div>
                <div><span className="text-nejah-slate-blue">Teacher:</span> {detail.teacherName}</div>
                <div><span className="text-nejah-slate-blue">Monthly Fee:</span> ${detail.monthlyFee}</div>
                <div><span className="text-nejah-slate-blue">Paid:</span> ${detail.amountPaid}</div>
                <div><span className="text-nejah-slate-blue">Balance:</span> ${detail.remainingBalance}</div>
                <div><span className="text-nejah-slate-blue">Sessions/mo:</span> {detail.monthlySessions}</div>
              </div>
              {detail.weeklySchedule?.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Weekly Schedule</p>
                  {detail.weeklySchedule.map((s: any, i: number) => (
                    <p key={i} className="text-nejah-slate-blue">{s.day} {s.startTime}–{s.endTime}</p>
                  ))}
                </div>
              )}
              <div>
                <p className="mb-2 font-medium">Payment History</p>
                {detail.paymentHistory?.length === 0 && <p className="text-nejah-slate-blue">No transactions yet</p>}
                {detail.paymentHistory?.map((t: any) => (
                  <p key={t.id} className="text-nejah-slate-blue">{t.transactionDate}: ${t.amount} ({t.type})</p>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
                <div><Label>Type</Label>
                  <Select value={payType} onValueChange={setPayType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="scholarship">Scholarship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => markStatus('paid')}>Mark Paid</Button>
            <Button variant="outline" onClick={() => markStatus('partial')}>Mark Partial</Button>
            <Button variant="outline" onClick={() => markStatus('overdue')}>Mark Overdue</Button>
            <Button onClick={recordPayment} disabled={submitting}>{submitting ? 'Saving...' : 'Record Payment'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
