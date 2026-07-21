/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split).

import { API_BASE, apiUrl } from "@/lib/api";
import { useState } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { FinanceFilters, statusBadgeVariant, downloadCSV, exportPDF, authHeaders } from '@/lib/finance-api';
import { FinanceFilterBar } from '@/components/finance/FinanceFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus, CalendarDays, CreditCard, Wallet, Building, Landmark, Smartphone, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useApiQuery } from "@/hooks/useApiQuery";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createLazyFileRoute('/finance_student-payments')({
  component: StudentPaymentsPage,
});

function StudentPaymentsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FinanceFilters>({ page: 1, limit: 20, dateRange: 'month' });
  const [detail, setDetail] = useState<any>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('payment');
  const [submitting, setSubmitting] = useState(false);
  const [convertTarget, setConvertTarget] = useState('USD');
  const [convertResult, setConvertResult] = useState<{ from: string; to: string; rate: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentOpen, setStudentOpen] = useState(false);
  const [calendarType, setCalendarType] = useState<'gregorian' | 'ethiopian'>('gregorian');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [ethiopianDate, setEthiopianDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [payNotes, setPayNotes] = useState('');
  const [studentFeeAccount, setStudentFeeAccount] = useState<any>(null);
  const [submittingForm, setSubmittingForm] = useState(false);

  const { data: result, isLoading: loading } = useApiQuery<{ data: any[]; meta: any }>({
    queryKey: ["student-payments", filters],
    path: `/finance/student-payments?page=${filters.page || 1}&limit=${filters.limit || 20}${filters.dateRange ? `&dateRange=${filters.dateRange}` : ''}`,
    refetchInterval: 30_000,
  });

  const rows = result?.data || [];
  const meta = result?.meta;

  const { data: feeConfigs = [] } = useApiQuery<any[]>({
    queryKey: ["fee-configs"],
    path: `/fee-config`,
  });

  const load = () => {
    queryClient.invalidateQueries({ queryKey: ["student-payments"] });
  };

  const searchStudents = async (q: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/students?search=${encodeURIComponent(q)}&limit=10`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setStudents(json.data || []);
      }
    } catch {}
  };

  // Student search is triggered by input, keep as manual
  const handleStudentSearch = (value: string) => {
    setStudentSearch(value);
    if (value.length >= 2) searchStudents(value);
    else setStudents([]);
  };

  const selectStudent = async (student: any) => {
    setSelectedStudent(student);
    setStudentOpen(false);
    setStudentSearch(student.fullName || student.name);
    setPayAmount('');
    setStudentFeeAccount(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/finance/student-payments?search=${encodeURIComponent(student.fullName || student.name)}&limit=1`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          setStudentFeeAccount(data.data[0]);
          setPayAmount(String(data.data[0].monthlyFee || ''));
        }
      }
      const matchingFee = feeConfigs.find((f) => {
        const level = student.level || student.program || '';
        return f.learningGoal?.name?.toLowerCase().includes(level.toLowerCase()) ||
               level.toLowerCase().includes(f.learningGoal?.name?.toLowerCase());
      });
      if (matchingFee && !payAmount) setPayAmount(String(matchingFee.amount));
    } catch {}
  };

  const recordStudentPayment = async () => {
    if (!selectedStudent || !payAmount) {
      toast.error('Please select a student and enter an amount');
      return;
    }
    setSubmittingForm(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = {
        amount: parseFloat(payAmount),
        type: 'payment',
        paymentMethod: paymentMethod || undefined,
        transactionDate: calendarType === 'gregorian' ? paymentDate : ethiopianDate,
        description: payNotes || undefined,
      };
      if (studentFeeAccount) {
        const res = await fetch(apiUrl(`/finance/student-payments/${studentFeeAccount.id}/transactions`), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to record payment');
        toast.success('Payment recorded successfully');
      } else {
        toast.error('No fee account found for this student. Sync fee accounts first.');
        setSubmittingForm(false);
        return;
      }
      setPayAmount('');
      setPayNotes('');
      setSelectedStudent(null);
      setStudentSearch('');
      setStudentFeeAccount(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingForm(false);
    }
  };

  const convertCurrency = async () => {
    try {
      const res = await fetch(apiUrl(`/currency/convert?from=ETB&to=${convertTarget}&amount=1`), {
        headers: authHeaders(),
      });
      if (res.ok) setConvertResult(await res.json());
    } catch {}
  };

  const openDetail = async (r: any) => {
    setDetail(null);
    setSelectedRow(r);
    try {
      setDetail(await financeFetch(`/student-payments/${r.id}`));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const recordPayment = async () => {
    const cur = detail || selectedRow;
    if (!cur || !payAmount) return;
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/finance/student-payments/${cur.id}/transactions`), {
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
    const cur = detail || selectedRow;
    if (!cur) return;
    try {
      const res = await fetch(apiUrl(`/finance/student-payments/${cur.id}`), {
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

  const cur = detail || selectedRow;
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

      <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border mb-4">
        <span className="text-sm text-muted-foreground">Currency Converter:</span>
        <select
          value={convertTarget}
          onChange={(e) => setConvertTarget(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="SAR">SAR</option>
          <option value="AED">AED</option>
        </select>
        <Button variant="outline" size="sm" onClick={convertCurrency}>
          <RefreshCw className="h-4 w-4 mr-1" /> Get Rate
        </Button>
        {convertResult && (
          <span className="text-sm text-foreground font-medium">
            1 {convertResult.from} = {convertResult.rate.toFixed(6)} {convertResult.to}
          </span>
        )}
      </div>

      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <Plus className={cn('h-4 w-4 transition-transform', showForm && 'rotate-45')} />
          {showForm ? 'Close Payment Form' : 'Record Manual Payment'}
        </Button>
      </div>

      {showForm && (
        <div className="glass-panel rounded-2xl p-6 mb-6 space-y-5">
          <h3 className="font-semibold text-foreground">Record Student Payment</h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Student Search */}
            <div>
              <Label>Search Student</Label>
              <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={studentOpen}
                    className="w-full justify-between h-10"
                  >
                    {selectedStudent
                      ? (selectedStudent.fullName || selectedStudent.name)
                      : 'Search for a student...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Type student name..."
                      value={studentSearch}
                      onValueChange={handleStudentSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No students found</CommandEmpty>
                      <CommandGroup>
                        {students.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.fullName || s.name}
                            onSelect={() => selectStudent(s)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedStudent?.id === s.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div>
                              <p>{s.fullName || s.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.level || s.program || ''}{s.parentName ? ` · Parent: ${s.parentName}` : ''}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Amount */}
            <div>
              <Label>Amount ({currency})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="e.g. 1500"
              />
            </div>

            {/* Calendar Type Toggle */}
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

            {/* Date */}
            <div>
              <Label>Date</Label>
              {calendarType === 'gregorian' ? (
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              ) : (
                <Input
                  value={ethiopianDate}
                  onChange={(e) => setEthiopianDate(e.target.value)}
                  placeholder="YYYY-MM-DD (Ethiopian)"
                />
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

            {/* Currency */}
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETB">ETB - Ethiopian Birr</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                  <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fee Config Info */}
            {studentFeeAccount && (
              <div className="md:col-span-2 rounded-xl bg-muted/30 p-3 text-sm">
                <p className="font-medium mb-1">Current Fee Account</p>
                <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                  <span>Monthly Fee: <strong>ETB {studentFeeAccount.monthlyFee}</strong></span>
                  <span>Paid: <strong>ETB {studentFeeAccount.amountPaid}</strong></span>
                  <span>Balance: <strong>ETB {studentFeeAccount.remainingBalance}</strong></span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="md:col-span-2">
              <Label>Notes (optional)</Label>
              <Input
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Payment notes or reference..."
              />
            </div>
          </div>

          <Button
            onClick={recordStudentPayment}
            disabled={submittingForm || !selectedStudent || !payAmount}
            className="w-full"
          >
            {submittingForm ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      )}

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
              <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                <TableCell className="font-medium">{r.studentName}</TableCell>
                <TableCell>{r.parentName}</TableCell>
                <TableCell>{r.teacherName}</TableCell>
                <TableCell>{r.program}</TableCell>
                <TableCell>ETB {r.monthlyFee}</TableCell>
                <TableCell><Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge></TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDetail(r); }}><Eye className="h-4 w-4" /></Button>
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

      <Dialog open={!!selectedRow || !!detail} onOpenChange={() => { setDetail(null); setSelectedRow(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Payment Details — {cur?.studentName}</DialogTitle></DialogHeader>
          {cur && (
            <div className="space-y-4 text-sm">
              {detail && cur.status === 'paid' && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-green-600 text-center">
                  <p className="font-semibold text-base">✅ Payment is done</p>
                  <p className="text-xs mt-1">This student's fee is fully paid for {detail.billingMonth}.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-nejah-slate-blue">Program:</span> {cur.program}</div>
                <div><span className="text-nejah-slate-blue">Teacher:</span> {cur.teacherName}</div>
                <div><span className="text-nejah-slate-blue">Monthly Fee:</span> ETB {cur.monthlyFee}</div>
                <div><span className="text-nejah-slate-blue">Paid:</span> ETB {cur.amountPaid}</div>
                <div><span className="text-nejah-slate-blue">Balance:</span> ETB {cur.remainingBalance}</div>
                <div><span className="text-nejah-slate-blue">Sessions/mo:</span> {cur.monthlySessions}</div>
              </div>
              {detail && detail.weeklySchedule?.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Weekly Schedule</p>
                  {detail.weeklySchedule.map((s: any, i: number) => (
                    <p key={i} className="text-nejah-slate-blue">{s.day} {s.startTime}–{s.endTime}</p>
                  ))}
                </div>
              )}
              <div>
                <p className="mb-2 font-medium">Payment History</p>
                {!detail && <p className="text-nejah-slate-blue">Loading payment history...</p>}
                {detail && detail.paymentHistory?.length === 0 && <p className="text-nejah-slate-blue">No transactions yet</p>}
                {detail && detail.paymentHistory?.map((t: any) => (
                  <p key={t.id} className="text-nejah-slate-blue">{t.transactionDate}: ETB {t.amount} ({t.type})</p>
                ))}
              </div>
              {cur.status !== 'paid' && (
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
              )}
            </div>
          )}
          {cur && cur.status !== 'paid' && (
            <DialogFooter className="flex-wrap gap-2">
              <Button variant="outline" onClick={() => markStatus('paid')}>Mark Paid</Button>
              <Button variant="outline" onClick={() => markStatus('partial')}>Mark Partial</Button>
              <Button variant="outline" onClick={() => markStatus('overdue')}>Mark Overdue</Button>
              <Button onClick={recordPayment} disabled={submitting}>{submitting ? 'Saving...' : 'Record Payment'}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
