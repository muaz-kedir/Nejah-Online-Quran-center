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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Eye, Loader2, Plus, ChevronsUpDown, Check, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useApiQuery } from "@/hooks/useApiQuery";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createLazyFileRoute('/finance_family-payments')({
  component: FamilyPaymentsPage,
});

function FamilyPaymentsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FinanceFilters>({ page: 1, limit: 20, dateRange: 'month' });
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('payment');
  const [payDescription, setPayDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [parents, setParents] = useState<any[]>([]);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [parentOpen, setParentOpen] = useState(false);
  const [parentStudents, setParentStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [calendarType, setCalendarType] = useState<'gregorian' | 'ethiopian'>('gregorian');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [ethiopianDate, setEthiopianDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [formAmount, setFormAmount] = useState('');
  const [parentFeeAccounts, setParentFeeAccounts] = useState<any[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  const { data: result, isLoading: loading } = useApiQuery<{ data: any[] }>({
    queryKey: ["family-payments", filters],
    path: `/finance/family-payments?page=${filters.page || 1}&limit=${filters.limit || 20}${filters.dateRange ? `&dateRange=${filters.dateRange}` : ''}`,
    refetchInterval: 30_000,
  });

  const rows = result?.data || [];

  const load = () => {
    queryClient.invalidateQueries({ queryKey: ["family-payments"] });
  };

  const searchParents = async (q: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/parents/search?search=${encodeURIComponent(q)}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setParents(await res.json());
    } catch {}
  };

  const handleParentSearch = (value: string) => {
    setParentSearch(value);
    if (value.length >= 2) searchParents(value);
    else setParents([]);
  };

  const selectParent = async (parent: any) => {
    setSelectedParent(parent);
    setParentOpen(false);
    setParentSearch(parent.fullName || parent.name);
    setSelectedStudents([]);
    setParentStudents([]);
    setParentFeeAccounts([]);
    setFormAmount('');
    try {
      const token = localStorage.getItem('token');
      const studentsRes = await fetch(apiUrl(`/parents/${parent.id}/students`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (studentsRes.ok) {
        const students = await studentsRes.json();
        setParentStudents(Array.isArray(students) ? students : []);
      }
      const feeRes = await fetch(apiUrl(`/finance/student-payments?parentId=${parent.id}&limit=50`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (feeRes.ok) {
        const data = await feeRes.json();
        setParentFeeAccounts(data.data || []);
      }
    } catch {}
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === parentStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(parentStudents.map((s) => s.id));
    }
  };

  const recordFamilyPayment = async () => {
    if (!selectedParent || selectedStudents.length === 0 || !formAmount) {
      toast.error('Please select a parent and at least one student, and enter an amount');
      return;
    }
    setSubmittingForm(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = {
        amount: parseFloat(formAmount),
        type: 'payment',
        paymentMethod: paymentMethod || undefined,
        transactionDate: calendarType === 'gregorian' ? paymentDate : ethiopianDate,
        description: formNotes || undefined,
      };
      let successCount = 0;
      for (const studentId of selectedStudents) {
        const account = parentFeeAccounts.find(
          (a) => a.studentId === studentId || a.studentId === studentId,
        );
        if (account) {
          const res = await fetch(apiUrl(`/finance/student-payments/${account.id}/transactions`), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (res.ok) successCount++;
        } else {
          const student = parentStudents.find((s) => s.id === studentId);
          if (student) {
            const syncRes = await fetch(apiUrl('/finance/sync'), {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentIds: [studentId] }),
            });
            if (syncRes.ok) {
              const synced = await syncRes.json();
              const newAccount = Array.isArray(synced) ? synced.find((a: any) => a.studentId === studentId) : null;
              if (newAccount) {
                const res = await fetch(apiUrl(`/finance/student-payments/${newAccount.id}/transactions`), {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                if (res.ok) successCount++;
              }
            }
          }
        }
      }
      if (successCount > 0) {
        toast.success(`Payment recorded for ${successCount} student(s)`);
        setFormAmount('');
        setFormNotes('');
        setSelectedStudents([]);
        setSelectedParent(null);
        setParentSearch('');
        setParentStudents([]);
        setParentFeeAccounts([]);
        load();
      } else {
        toast.error('Failed to record payment. Try syncing fee accounts first.');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingForm(false);
    }
  };

  const openDetail = async (fam: any) => {
    if (fam.type !== 'bundled' || !fam.id) {
      setDetail({ ...fam, isSeparate: true });
      return;
    }
    setDetailLoading(true);
    try {
      const res = await financeFetch<any>(`/family-payments/${fam.id}`);
      setDetail({ ...res, isSeparate: false });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const recordPayment = async () => {
    if (!detail || !payAmount || detail.isSeparate || !detail.id) return;
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/finance/family-payments/${detail.id}/transactions`), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ amount: parseFloat(payAmount), type: payType, description: payDescription || undefined }),
      });
      if (!res.ok) throw new Error('Failed to record payment');
      setDetail(await res.json());
      setPayAmount('');
      setPayDescription('');
      toast.success('Payment recorded');
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const markStatus = async (status: string) => {
    if (!detail || detail.isSeparate || !detail.id) return;
    try {
      const res = await fetch(apiUrl(`/finance/family-payments/${detail.id}`), {
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

  const exportRows = rows.flatMap((f) =>
    f.children?.map((c: any) => ({
      Parent: f.parentName,
      Type: f.type,
      Child: c.studentName,
      'Monthly Fee': c.monthlyFee,
      'Family Total': f.monthlyTotal,
      Status: f.status,
    })) || [],
  );

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Family Billing"
        title="Parent & Family Payments"
        description="Separate billing per child or bundled family payments"
      />
      <div className="mb-4 space-y-4">
        <FinanceFilterBar filters={filters} onChange={setFilters} showProgram={false} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCSV('family-payments.csv', exportRows, 'Family Payments')}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPDF('Family Payments', exportRows)}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <Plus className={cn('h-4 w-4 transition-transform', showForm && 'rotate-45')} />
          {showForm ? 'Close Form' : 'Record Family Payment'}
        </Button>
      </div>

      {showForm && (
        <div className="glass-panel rounded-2xl p-6 mb-6 space-y-5">
          <h3 className="font-semibold text-foreground">Record Parent / Family Payment</h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Parent Search */}
            <div className="md:col-span-2">
              <Label>Search Parent <span className="text-xs text-muted-foreground">(only parents with students shown)</span></Label>
              <Popover open={parentOpen} onOpenChange={setParentOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={parentOpen}
                    className="w-full justify-between h-10"
                  >
                    {selectedParent
                      ? (selectedParent.fullName || selectedParent.name)
                      : 'Search for a parent...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Type parent name..."
                      value={parentSearch}
                      onValueChange={handleParentSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No parents found</CommandEmpty>
                      <CommandGroup>
                        {parents.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.fullName || p.name}
                            onSelect={() => selectParent(p)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedParent?.id === p.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div>
                              <p>{p.fullName || p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.email || p.phoneNumber || ''}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Students (shown when parent is selected) */}
            {selectedParent && parentStudents.length > 0 && (
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Select Students</Label>
                  <Button variant="ghost" size="sm" onClick={selectAllStudents} className="text-xs">
                    {selectedStudents.length === parentStudents.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="space-y-2 rounded-xl border border-border p-3">
                  {parentStudents.map((s) => {
                    const account = parentFeeAccounts.find((a) => a.studentId === s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedStudents.includes(s.id)}
                          onCheckedChange={() => toggleStudent(s.id)}
                        />
                        <div className="flex-1 flex justify-between">
                          <div>
                            <p className="text-sm font-medium">{s.fullName || s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.level || s.program || ''}</p>
                          </div>
                          {account && (
                            <span className="text-xs text-muted-foreground">
                              Fee: ETB {account.monthlyFee} | Balance: ETB {account.remainingBalance}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedParent && parentStudents.length === 0 && (
              <div className="md:col-span-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-600">
                This parent has no students assigned.
              </div>
            )}

            {/* Amount */}
            <div>
              <Label>Amount ({currency})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
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

            {/* Notes */}
            <div className="md:col-span-2">
              <Label>Notes (optional)</Label>
              <Input
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Payment notes or reference..."
              />
            </div>
          </div>

          <Button
            onClick={recordFamilyPayment}
            disabled={submittingForm || !selectedParent || selectedStudents.length === 0 || !formAmount}
            className="w-full"
          >
            {submittingForm ? 'Recording...' : `Record Payment for ${selectedStudents.length} student(s)`}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No family payment records</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((f, i) => (
            <div
              key={f.id || `${f.parentId}-${i}`}
              className="glass-panel rounded-2xl p-5 transition hover:border-nejah-electric/30 cursor-pointer"
              onClick={() => openDetail(f)}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{f.parentName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{f.type === 'bundled' ? 'Bundled Family' : 'Separate Children'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant(f.status)}>{f.status}</Badge>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="mb-2 text-sm text-muted-foreground">Children:</p>
              <ul className="mb-3 space-y-1 text-sm">
                {f.children?.map((c: any) => (
                  <li key={c.studentId} className="flex justify-between">
                    <span>{c.studentName}</span>
                    <span>ETB {c.monthlyFee}/mo</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-white/10 pt-3 font-medium">
                <span>Monthly Total</span>
                <span>ETB {f.monthlyTotal}</span>
              </div>
              {f.type === 'bundled' && f.remainingBalance != null && (
                <p className="mt-1 text-xs text-muted-foreground">Balance: ETB {f.remainingBalance}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={() => { setDetail(null); setPayAmount(''); setPayDescription(''); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Family Payment Details — {detail?.parentName}</DialogTitle></DialogHeader>
          {detailLoading ? (
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          ) : detail ? (
            <div className="space-y-4 text-sm">
              {detail.status === 'paid' && !detail.isSeparate && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-green-600 text-center">
                  <p className="font-semibold text-base">✅ Payment is done</p>
                  <p className="text-xs mt-1">This family's billing is fully paid for {detail.billingMonth}.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{detail.isSeparate ? 'Separate Children' : 'Bundled Family'}</span></div>
                <div><span className="text-muted-foreground">Monthly Total:</span> ETB {detail.monthlyTotal}</div>
                {!detail.isSeparate && (
                  <>
                    <div><span className="text-muted-foreground">Amount Paid:</span> ETB {detail.amountPaid}</div>
                    <div><span className="text-muted-foreground">Remaining Balance:</span> ETB {detail.remainingBalance}</div>
                  </>
                )}
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusBadgeVariant(detail.status)}>{detail.status}</Badge></div>
                {detail.dueDate && <div><span className="text-muted-foreground">Due Date:</span> {detail.dueDate}</div>}
              </div>

              <div>
                <p className="mb-2 font-medium">Children</p>
                {(detail.children || []).map((c: any, i: number) => (
                  <p key={i} className="text-muted-foreground">{c.studentName} — ETB {c.monthlyFee}/mo</p>
                ))}
              </div>

              {detail.isSeparate ? (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-600">
                  <p className="font-medium text-sm">Separate billing — payments recorded per child</p>
                  <p className="text-xs mt-1">Go to <strong>Student Payments</strong> to record payments for individual children in this family.</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="mb-2 font-medium">Payment History</p>
                    {(!detail.paymentHistory || detail.paymentHistory.length === 0) && (
                      <p className="text-muted-foreground">No transactions yet</p>
                    )}
                    {detail.paymentHistory?.map((t: any) => (
                      <p key={t.id} className="text-muted-foreground">
                        {t.transactionDate}: ETB {t.amount} ({t.type}){t.description ? ` — ${t.description}` : ''}
                      </p>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Amount</Label>
                      <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={payType} onValueChange={setPayType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="scholarship">Scholarship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input type="text" value={payDescription} onChange={(e) => setPayDescription(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
          {detail && !detail.isSeparate && (
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
