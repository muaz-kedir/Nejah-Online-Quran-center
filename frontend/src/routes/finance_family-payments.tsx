import { API_BASE, apiUrl } from "@/lib/api";
import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { financeFetch, FinanceFilters, statusBadgeVariant, downloadCSV, exportPDF, authHeaders } from '@/lib/finance-api';
import { FinanceFilterBar } from '@/components/finance/FinanceFilters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance_family-payments')({
  component: FamilyPaymentsPage,
  beforeLoad: () => requireAuth(['finance_manager', 'super_admin']),
});

function FamilyPaymentsPage() {
  const [filters, setFilters] = useState<FinanceFilters>({ page: 1, limit: 20, dateRange: 'month' });
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('payment');
  const [payDescription, setPayDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await financeFetch<any>('/family-payments', filters);
      setRows(res.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [filters]);

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

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-nejah-slate-blue py-16">No family payment records</p>
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
                  <p className="text-xs text-nejah-slate-blue capitalize">{f.type === 'bundled' ? 'Bundled Family' : 'Separate Children'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant(f.status)}>{f.status}</Badge>
                  <Eye className="h-4 w-4 text-nejah-slate-blue" />
                </div>
              </div>
              <p className="mb-2 text-sm text-nejah-slate-blue">Children:</p>
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
                <p className="mt-1 text-xs text-nejah-slate-blue">Balance: ETB {f.remainingBalance}</p>
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
                <div><span className="text-nejah-slate-blue">Type:</span> <span className="capitalize">{detail.isSeparate ? 'Separate Children' : 'Bundled Family'}</span></div>
                <div><span className="text-nejah-slate-blue">Monthly Total:</span> ETB {detail.monthlyTotal}</div>
                {!detail.isSeparate && (
                  <>
                    <div><span className="text-nejah-slate-blue">Amount Paid:</span> ETB {detail.amountPaid}</div>
                    <div><span className="text-nejah-slate-blue">Remaining Balance:</span> ETB {detail.remainingBalance}</div>
                  </>
                )}
                <div><span className="text-nejah-slate-blue">Status:</span> <Badge variant={statusBadgeVariant(detail.status)}>{detail.status}</Badge></div>
                {detail.dueDate && <div><span className="text-nejah-slate-blue">Due Date:</span> {detail.dueDate}</div>}
              </div>

              <div>
                <p className="mb-2 font-medium">Children</p>
                {(detail.children || []).map((c: any, i: number) => (
                  <p key={i} className="text-nejah-slate-blue">{c.studentName} — ETB {c.monthlyFee}/mo</p>
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
                      <p className="text-nejah-slate-blue">No transactions yet</p>
                    )}
                    {detail.paymentHistory?.map((t: any) => (
                      <p key={t.id} className="text-nejah-slate-blue">
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
