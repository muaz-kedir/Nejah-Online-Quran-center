/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useEffect, useState, useCallback } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { financeFetch, buildParams, formatCurrency } from '@/lib/finance-api';
import { apiUrl, apiHeaders } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Download, Trash2, TrendingUp, DollarSign, Calendar, PiggyBank, Wallet, PieChart as PieChartIcon, BarChart3, X, IndianRupee } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

export const Route = createLazyFileRoute('/finance_expenses')({
  component: ExpensesPage,
});

function ExpensesPage() {
  const [calendar, setCalendar] = useState('gregorian');
  const calCtx = CALENDARS.find(c => c.value === calendar)!;
  const current = getCurrentYearMonth(calendar);
  const [year, setYear] = useState(current.year);
  const [month, setMonth] = useState(current.month);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = toGregorianRange();
      const data = await financeFetch<any>('/expenses', { page: 1, limit: 200, startDate, endDate } as any);
      setExpenses(data.data || []);
      setMeta(data.meta || null);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }, [toGregorianRange]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

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

  const months = calendar === 'gregorian' ? GREGORIAN_MONTHS
    : calendar === 'ethiopian' ? ETHIOPIAN_MONTHS
    : HIJRI_MONTHS;

  return (
    <DashboardLayout>
      <div className="admin-page">
        <PageHeader
          eyebrow="Finance"
          title="Expenses"
          description="Track and manage all expenses"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}
