import { API_BASE, apiUrl } from "@/lib/api";
import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { financeFetch, FinanceFilters, downloadCSV, exportPDF, authHeaders, formatCurrency } from '@/lib/finance-api';
import { FinanceFilterBar } from '@/components/finance/FinanceFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, Loader2, Plus, CalendarDays, FileText, TriangleAlert } from 'lucide-react';
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [calendarType, setCalendarType] = useState<'gregorian' | 'ethiopian'>('gregorian');
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));
  const [ethiopianYear, setEthiopianYear] = useState('');
  const [ethiopianMonth, setEthiopianMonth] = useState('');
  const [salary, setSalary] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [payrollStatus, setPayrollStatus] = useState('pending');
  const [creating, setCreating] = useState(false);
  const [paidWarning, setPaidWarning] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(apiUrl('/teachers?limit=200&status=active'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => setTeachers(json.data || []))
      .catch(() => {});
  }, []);

  const getMonth = () =>
    calendarType === 'gregorian'
      ? billingMonth
      : `${ethiopianYear}-${ethiopianMonth.padStart(2, '0')}`;

  const createPayroll = async (force = false) => {
    if (!selectedTeacher || !salary || !paymentMethod) {
      toast.error('Please select a teacher, enter salary, and choose a payment method');
      return;
    }
    const month = getMonth();
    if (!month || month.length < 7) {
      toast.error('Please select a valid billing month');
      return;
    }

    if (!force) {
      try {
        const detail = await financeFetch<any>(`/teacher-payments/${selectedTeacher.id}?billingMonth=${month}`);
        if (detail?.payroll?.status === 'paid') {
          setPaidWarning({ teacher: selectedTeacher, month, payroll: detail.payroll });
          return;
        }
      } catch {}
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = {
        teacherId: selectedTeacher.id,
        billingMonth: month,
        salary: parseFloat(salary),
        paymentMethod,
      };
      if (payrollStatus === 'paid') {
        body.status = 'paid';
      }
      const res = await fetch(apiUrl('/finance/teacher-payments/generate-payroll'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create payroll');
      toast.success('Payroll created successfully');
      setShowForm(false);
      setSelectedTeacher(null);
      setSalary('');
      setPaymentMethod('');
      setPayrollStatus('pending');
      setPaidWarning(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

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

  const openDetail = async (teacherId: string) => {
    setDetailLoading(true);
    try {
      setDetail(await financeFetch(`/teacher-payments/${teacherId}`));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const togglePayrollStatus = async () => {
    if (!detail || !detail.payroll) return;
    const newStatus = detail.payroll.status === 'paid' ? 'pending' : 'paid';
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/finance/teacher-payments/${detail.teacherId}/payroll/mark-paid${detail.payroll.billingMonth ? `?billingMonth=${detail.payroll.billingMonth}` : ''}`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setDetail(await res.json());
      toast.success(`Payroll marked as ${newStatus}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const downloadSinglePayrollPDF = () => {
    if (!detail) return;
    const payroll = detail.payroll || {};
    const rows = [
      { Field: 'Teacher', Value: detail.teacherName },
      { Field: 'Billing Month', Value: payroll.billingMonth || '-' },
      { Field: 'Sessions Conducted', Value: detail.sessionsConducted ?? 0 },
      { Field: 'Total Earnings (ETB)', Value: formatCurrency(detail.earnings) },
      { Field: 'Monthly Salary (ETB)', Value: formatCurrency(detail.monthlySalary) },
      { Field: 'Status', Value: payroll.status || '-' },
      { Field: 'Payment Method', Value: payroll.paymentMethod || '-' },
      { Field: 'Paid At', Value: payroll.paidAt || '-' },
    ];
    if (detail.assignedStudents?.length) {
      detail.assignedStudents.forEach((s: any) => {
        rows.push({ Field: `Student: ${s.studentName}`, Value: `${s.sessionsConducted} sessions` });
      });
    }
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Payroll - ${detail.teacherName}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;max-width:700px;margin:0 auto}
        h1{color:#1a1a2e;border-bottom:2px solid #e8f0fe;padding-bottom:12px}
        table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
        th,td{border:1px solid #ccc;padding:8px 10px;text-align:left}
        th{background:#1a1a2e;color:white;font-weight:600}
        td:first-child{font-weight:500;width:200px;background:#f8f9fa}
        .footer{margin-top:24px;padding-top:12px;border-top:1px solid #eee;font-size:11px;color:#666;text-align:center}
      </style></head>
      <body>
        <h1>Teacher Payroll — ${detail.teacherName}</h1>
        <table>
          <thead><tr><th>Field</th><th>Value</th></tr></thead>
          <tbody>${rows.map((r) => `<tr><td>${r.Field}</td><td>${r.Value}</td></tr>`).join('')}</tbody>
        </table>
        <div class="footer">Generated on ${new Date().toLocaleDateString()} — Nejah Online Quran Center</div>
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
    win.document.close();
  };

  const exportMonthPayroll = () => {
    const exportData = rows.map((r) => ({
      Teacher: r.teacherName,
      Students: r.totalAssignedStudents ?? 0,
      Sessions: r.sessionsConducted ?? 0,
      Earnings: r.earnings ?? 0,
      Status: r.payrollStatus || 'pending',
      Method: r.paymentMethod || '-',
    }));
    if (exportData.length === 0) {
      toast.error('No payroll data to export');
      return;
    }
    downloadCSV(`payroll-${filters.dateRange || 'all'}.csv`, exportData, 'Teacher Payroll');
  };

  const exportRows = rows.map((r) => ({
    Teacher: r.teacherName,
    Students: r.totalAssignedStudents,
    Sessions: r.sessionsConducted,
    Earnings: r.earnings,
    'Payroll Status': r.payrollStatus,
  }));

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Teacher Payroll"
        title="Teacher Payments"
        description="Manage teacher salary payroll"
        actions={
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className={`h-4 w-4 transition-transform ${showForm ? 'rotate-45' : ''}`} />
            {showForm ? 'Close Form' : 'Create Payroll'}
          </Button>
        }
      />
      <div className="mb-4 space-y-4">
        <FinanceFilterBar filters={filters} onChange={setFilters} showProgram={false} showStatus={false} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportMonthPayroll}>
            <Download className="mr-2 h-4 w-4" /> Export Month's Payroll
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCSV('teacher-payroll.csv', exportRows, 'Teacher Payroll')}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPDF('Teacher Payroll', exportRows)}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="glass-panel rounded-2xl p-6 mb-6 space-y-5">
          <h3 className="font-semibold text-foreground">Create Teacher Payroll</h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Teacher Select */}
            <div className="md:col-span-2">
              <Label>Teacher</Label>
              <Select
                value={selectedTeacher?.id || ''}
                onValueChange={(id) => {
                  const t = teachers.find(x => x.id === id);
                  setSelectedTeacher(t || null);
                  setSalary(t?.monthlySalary != null ? String(t.monthlySalary) : '');
                  setPaidWarning(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher..." />
                </SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.fullName || t.name} — {t.email}{t.monthlySalary ? ` (${formatCurrency(t.monthlySalary)} ETB)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salary */}
            <div>
              <Label>Salary (ETB)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. 5000"
              />
              {selectedTeacher?.monthlySalary != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Default from profile: ETB {formatCurrency(selectedTeacher.monthlySalary)}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="credit_card">Credit/Debit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select value={payrollStatus} onValueChange={setPayrollStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calendar Type */}
            <div>
              <Label>Calendar System</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={calendarType === 'gregorian' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalendarType('gregorian')}
                  className="flex-1"
                >
                  <CalendarDays className="h-4 w-4 mr-1" /> Gregorian
                </Button>
                <Button
                  type="button"
                  variant={calendarType === 'ethiopian' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalendarType('ethiopian')}
                  className="flex-1"
                >
                  <CalendarDays className="h-4 w-4 mr-1" /> Ethiopian
                </Button>
              </div>
            </div>

            {/* Billing Month */}
            <div>
              <Label>Billing Month</Label>
              {calendarType === 'gregorian' ? (
                <Input
                  type="month"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                />
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Year (e.g. 2018)"
                    value={ethiopianYear}
                    onChange={(e) => setEthiopianYear(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Month (1-13)"
                    value={ethiopianMonth}
                    onChange={(e) => setEthiopianMonth(e.target.value)}
                    className="flex-1"
                  />
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={() => createPayroll()}
            disabled={creating || !selectedTeacher || !salary || !paymentMethod}
            className="w-full"
          >
            {creating ? 'Creating...' : 'Create Payroll'}
          </Button>
        </div>
      )}

      <div className="glass-panel overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No payroll records found</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow
                key={r.teacherId}
                className="cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => openDetail(r.teacherId)}
              >
                <TableCell className="font-medium">{r.teacherName}</TableCell>
                <TableCell>{r.totalAssignedStudents}</TableCell>
                <TableCell>{r.sessionsConducted}</TableCell>
                <TableCell>ETB {formatCurrency(r.earnings)}</TableCell>
                <TableCell className="capitalize">{r.payrollStatus}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDetail(r.teacherId); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.teacherName} — Earnings Detail</DialogTitle>
          </DialogHeader>
          {detailLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : detail && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-4 flex-wrap">
                <span>Sessions Conducted: <strong>{detail.sessionsConducted}</strong></span>
                <span>Total Earnings: <strong>ETB {formatCurrency(detail.earnings)}</strong></span>
                <span>Monthly Salary: <strong>ETB {formatCurrency(detail.monthlySalary)}</strong></span>
              </div>

              {detail.assignedStudents?.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Students</p>
                  {detail.assignedStudents.map((s: any, i: number) => (
                    <div key={i} className="border-b border-white/5 py-2 flex justify-between">
                      <span>{s.studentName}</span>
                      <span className="text-muted-foreground">{s.sessionsConducted} sessions</span>
                    </div>
                  ))}
                </div>
              )}

              {detail.payroll && (
                <div>
                  <p className="mb-2 font-medium">Payroll</p>
                  <p>
                    Status: <strong className={detail.payroll.status === 'paid' ? 'text-green-600' : 'text-amber-600'}>{detail.payroll.status}</strong>
                    {' · '}Total: <strong>ETB {formatCurrency(detail.payroll.totalEarnings)}</strong>
                  </p>
                  {detail.payroll.paymentMethod && <p>Payment Method: {detail.payroll.paymentMethod}</p>}
                  {detail.payroll.billingMonth && <p>Billing Month: {detail.payroll.billingMonth}</p>}
                  {detail.payroll.paidAt && <p>Paid At: {detail.payroll.paidAt}</p>}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {detail.payroll.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={togglePayrollStatus}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? 'Updating...' : 'Mark as Paid'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={downloadSinglePayrollPDF}>
                      <FileText className="h-4 w-4 mr-1" /> Download PDF
                    </Button>
                  </div>
                </div>
              )}

              {!detail.payroll && (
                <p className="text-muted-foreground">No payroll record for this teacher.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!paidWarning} onOpenChange={() => setPaidWarning(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <TriangleAlert className="h-5 w-5" /> Salary Already Paid
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-3">
            <p>
              <strong>{paidWarning?.teacher?.fullName || paidWarning?.teacher?.name}</strong> already has a <strong className="text-green-600">paid</strong> payroll record for <strong>{paidWarning?.month}</strong>.
            </p>
            <p>Generating a new payroll will overwrite the existing record. Do you want to continue?</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaidWarning(null)}>Cancel</Button>
            <Button
              variant="default"
              onClick={() => {
                setPaidWarning(null);
                createPayroll(true);
              }}
            >
              Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}