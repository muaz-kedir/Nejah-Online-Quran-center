/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useCallback } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/design-system';
import { formatCurrency } from '@/lib/finance-api';
import { apiUrl, apiHeaders } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Download, Trash2, TrendingUp, DollarSign, PiggyBank, Wallet, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useApiQuery } from "@/hooks/useApiQuery";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createLazyFileRoute('/finance_expenses')({
  component: ExpensesPage,
});

const CATEGORY_LABELS: Record<string, string> = {
  teacher_salary: 'Teacher Salary',
  rent: 'Rent',
  salaries_external: 'External Salaries',
  utilities: 'Utilities',
  marketing: 'Marketing',
  supplies: 'Supplies',
  software: 'Software',
  travel: 'Travel',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  teacher_salary: '#0F62AC',
  rent: '#FF6B35',
  salaries_external: '#004E64',
  utilities: '#FFC857',
  marketing: '#E63946',
  supplies: '#2A9D8F',
  software: '#7B2CBF',
  travel: '#F4845F',
  other: '#6C757D',
};

const CALENDARS = [
  { value: 'gregorian', label: 'Gregorian' },
  { value: 'ethiopian', label: 'Ethiopian' },
  { value: 'hijri', label: 'Hijri' },
] as const;

const GREGORIAN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const ETHIOPIAN_MONTHS = ['Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miazia','Genbot','Sene','Hamle','Nehase','Pagume'];
const HIJRI_MONTHS = ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Awwal','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'];

function ethiopianToGregorian(ethYear: number, ethMonth: number): { year: number; month: number } {
  const offset = 7;
  const gregYear = ethYear + offset;
  const gregMonth = (ethMonth + 8) % 12 || 12;
  return { year: gregYear, month: gregMonth };
}

function hijriToGregorian(hijYear: number, hijMonth: number): { year: number; month: number } {
  const approxOffset = Math.floor((hijYear * 0.970225) + 622);
  const gregMonth = ((hijMonth + 9) % 12) || 12;
  return { year: approxOffset, month: gregMonth };
}

function formatDateLabel(dateStr: string, calendar: string): string {
  if (calendar === 'gregorian') return format(new Date(dateStr), 'MMM dd, yyyy');
  const d = new Date(dateStr);
  const gYear = d.getFullYear();
  const gMonth = d.getMonth();
  if (calendar === 'ethiopian') {
    const ethYear = gYear - 7;
    const ethMonth = ((gMonth + 3) % 13) || 13;
    return `${ETHIOPIAN_MONTHS[ethMonth - 1]} ${ethYear}`;
  }
  const hijYear = Math.floor((gYear - 622) / 0.970225);
  const hijMonth = ((gMonth + 2) % 12) || 12;
  return `${HIJRI_MONTHS[hijMonth - 1]} ${hijYear}`;
}

function getCurrentYearMonth(calendar: string): { year: number; month: number } {
  const now = new Date();
  if (calendar === 'gregorian') return { year: now.getFullYear(), month: now.getMonth() + 1 };
  if (calendar === 'ethiopian') {
    const ethYear = now.getMonth() < 8 ? now.getFullYear() - 8 : now.getFullYear() - 7;
    const ethMonth = ((now.getMonth() + 3) % 13) || 13;
    return { year: ethYear, month: ethMonth };
  }
  const hijYear = Math.floor((now.getFullYear() - 622) / 0.970225);
  const hijMonth = ((now.getMonth() + 2) % 12) || 12;
  return { year: hijYear, month: hijMonth };
}

function ExpenseFormModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !description) { toast.error('Amount and description are required'); return; }
    setSubmitting(true);
    try {
      const r = await fetch(apiUrl('/finance/expenses'), {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ amount: parseFloat(amount), description, category, expenseDate, notes }),
      });
      if (!r.ok) throw new Error();
      toast.success('Expense recorded');
      onSuccess();
      onClose();
      setAmount(''); setDescription(''); setCategory('other'); setNotes(''); setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
    } catch { toast.error('Failed to record expense'); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] dark:bg-nejah-surface dark:border-nejah-border-blue">
        <DialogHeader><DialogTitle className="text-lg font-bold">Record Expense</DialogTitle><DialogDescription>Add a new expense entry</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Amount (ETB)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input placeholder="What was this expense for?" value={description} onChange={(e) => setDescription(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Textarea placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl min-h-[80px]" />
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            Record Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpensesPage() {
  const queryClient = useQueryClient();
  const [calendar, setCalendar] = useState('gregorian');
  const calCtx = CALENDARS.find(c => c.value === calendar)!;
  const current = getCurrentYearMonth(calendar);
  const [year, setYear] = useState(current.year);
  const [month, setMonth] = useState(current.month);
  const [showForm, setShowForm] = useState(false);

  const toGregorianRange = useCallback(() => {
    if (calendar === 'gregorian') {
      const d = new Date(year, month - 1, 1);
      return { startDate: format(startOfMonth(d), 'yyyy-MM-dd'), endDate: format(endOfMonth(d), 'yyyy-MM-dd') };
    }
    if (calendar === 'ethiopian') {
      const g = ethiopianToGregorian(year, month);
      const d = new Date(g.year, g.month - 1, 1);
      return { startDate: format(startOfMonth(d), 'yyyy-MM-dd'), endDate: format(endOfMonth(d), 'yyyy-MM-dd') };
    }
    const g = hijriToGregorian(year, month);
    const d = new Date(g.year, g.month - 1, 1);
    return { startDate: format(startOfMonth(d), 'yyyy-MM-dd'), endDate: format(endOfMonth(d), 'yyyy-MM-dd') };
  }, [calendar, year, month]);

  const { startDate, endDate } = toGregorianRange;

  const { data, isLoading: loading } = useApiQuery<any>({
    queryKey: ["expenses", { startDate, endDate }],
    path: `/finance/expenses?page=1&limit=200&startDate=${startDate}&endDate=${endDate}`,
    refetchInterval: 30_000,
  });

  const expenses = data?.data || [];
  const meta = data?.meta || null;

  const fetchExpenses = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
  };

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(apiUrl(`/finance/expenses/${id}`), { method: 'DELETE', headers: apiHeaders() });
      if (!r.ok) throw new Error();
      toast.success('Expense deleted');
      fetchExpenses();
    } catch { toast.error('Failed to delete expense'); }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const categoryTotals = expenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const pieData = Object.entries(categoryTotals).map(([k, v]) => ({ name: CATEGORY_LABELS[k] || k, value: v, color: CATEGORY_COLORS[k] || '#6C757D' }));
  const teacherSalaryTotal = categoryTotals['teacher_salary'] || 0;
  const otherExpensesTotal = totalAmount - teacherSalaryTotal;
  const months = calendar === 'gregorian' ? GREGORIAN_MONTHS
    : calendar === 'ethiopian' ? ETHIOPIAN_MONTHS
    : HIJRI_MONTHS;

  const handleExportPDF = () => {
    if (!expenses.length) return;
    const calLabel = CALENDARS.find(c => c.value === calendar)?.label || 'Gregorian';
    const monthName = calendar === 'gregorian' ? GREGORIAN_MONTHS[month - 1]
      : calendar === 'ethiopian' ? ETHIOPIAN_MONTHS[month - 1]
      : HIJRI_MONTHS[month - 1];
    const title = `Expense Report - ${monthName} ${year} (${calLabel})`;
    const rows = expenses.map((e: any) => ({
      Date: formatDateLabel(e.expenseDate, 'gregorian'),
      Category: CATEGORY_LABELS[e.category] || e.category,
      Description: e.description,
      Amount: `${formatCurrency(e.amount)} ETB`,
    }));
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#1a1a2e}
        h1{font-size:22px;margin-bottom:4px}
        .sub{color:#888;font-size:13px;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{background:#0F62AC;color:#fff;text-align:left;padding:8px 12px;font-size:10px;text-transform:uppercase;letter-spacing:1px}
        td{padding:8px 12px;border-bottom:1px solid #eee}
        .total{font-weight:700;font-size:14px;margin-top:16px;text-align:right}
        .footer{margin-top:32px;font-size:10px;color:#aaa;text-align:center}
      </style></head><body>
      <h1>${title}</h1>
      <p class="sub">Total Expenses: ${formatCurrency(totalAmount)} ETB</p>
      <table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r.Date}</td><td>${r.Category}</td><td>${r.Description}</td><td>${r.Amount}</td></tr>`).join('')}</tbody></table>
      <p class="total">Total: ${formatCurrency(totalAmount)} ETB</p>
      <p class="footer">Generated on ${new Date().toLocaleDateString()} &bull; Nejah Online Quran Center</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  return (
    <DashboardLayout>
      <div className="admin-page">
        <PageHeader
          eyebrow="Finance"
          title="Expenses"
          description="Track and manage all expenses"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF} disabled={!expenses.length} className="h-11 gap-2 rounded-xl px-4">
                <Download className="h-5 w-5" /> Export PDF
              </Button>
              <Button onClick={() => setShowForm(true)} className="h-11 gap-2 rounded-xl px-6">
                <Plus className="h-5 w-5" /> Add Expense
              </Button>
            </div>
          }
        />

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {CALENDARS.map((c) => (
              <button
                key={c.value}
                onClick={() => { setCalendar(c.value); const cur = getCurrentYearMonth(c.value); setYear(cur.year); setMonth(cur.month); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer',
                  calendar === c.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="h-9 w-[150px] rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                {months.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 w-[90px] rounded-xl text-xs text-center"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
          <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Expenses</p>
                <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-nejah-sapphire/30 flex items-center justify-center text-nejah-electric">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">ETB {formatCurrency(totalAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">{expenses.length} entries</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Teacher Salaries</p>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
                  <PiggyBank className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">ETB {formatCurrency(teacherSalaryTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">{((teacherSalaryTotal / (totalAmount || 1)) * 100).toFixed(0)}% of total</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Other Expenses</p>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">ETB {formatCurrency(otherExpensesTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">{((otherExpensesTotal / (totalAmount || 1)) * 100).toFixed(0)}% of total</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Categories</p>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600">
                  <PieChartIcon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{pieData.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Active categories</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-nejah-electric" /> Category Breakdown</CardTitle></CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `ETB ${formatCurrency(v)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No expenses this period</div>
              )}
            </CardContent>
          </Card>
          <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-nejah-electric" /> Category Totals</CardTitle></CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pieData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip formatter={(v: any) => `ETB ${formatCurrency(v)}`} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No expenses this period</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-nejah-electric" /> Expense List</CardTitle>
              <p className="text-xs text-muted-foreground">{meta?.total || 0} entries</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-nejah-electric" /></div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No expenses recorded</p>
                <p className="text-xs mt-1">Click "Add Expense" to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-widest">Date</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-widest">Category</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-widest">Description</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-right">Amount</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e: any) => (
                      <TableRow key={e.id} className="hover:bg-muted/50 dark:hover:bg-nejah-surface/50">
                        <TableCell className="font-mono text-xs whitespace-nowrap">{formatDateLabel(e.expenseDate, calendar)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[e.category] || '#6C757D' }} />
                            <span className="text-xs font-medium">{CATEGORY_LABELS[e.category] || e.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[250px] truncate">{e.description}</TableCell>
                        <TableCell className="text-xs font-bold text-right whitespace-nowrap">ETB {formatCurrency(e.amount)}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={fetchExpenses}
      />
    </DashboardLayout>
  );
}
