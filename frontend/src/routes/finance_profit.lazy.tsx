/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useEffect, useState, useCallback } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { financeFetch, formatCurrency } from '@/lib/finance-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, DollarSign, PiggyBank, Wallet, Download, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const Route = createLazyFileRoute('/finance_profit')({
  component: ProfitPage,
});

function ProfitPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const billingMonth = `${year}-${String(month).padStart(2, '0')}`;

  const fetchProfit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeFetch<any>(`/net-profit?billingMonth=${billingMonth}`);
      setData(res);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [billingMonth]);

  useEffect(() => { fetchProfit(); }, [fetchProfit]);

  const expensePieData = data
    ? Object.entries(data.expenseBreakdown || {}).map(([k, v]) => ({
        name: CATEGORY_LABELS[k] || k,
        value: v as number,
        color: CATEGORY_COLORS[k] || '#6C757D',
      }))
    : [];

  const barData = data
    ? [
        { name: 'Collected', amount: data.totalCollected, fill: '#0F62AC' },
        { name: 'Payroll', amount: data.totalPayroll, fill: '#FF6B35' },
        { name: 'Expenses', amount: data.totalExpenses, fill: '#E63946' },
        { name: 'Net Profit', amount: data.netProfit, fill: data.netProfit >= 0 ? '#2A9D8F' : '#E63946' },
      ]
    : [];

  const handleExportPDF = () => {
    if (!data) return;
    const monthName = MONTHS[month - 1];
    const title = `Profit Report - ${monthName} ${year}`;
    const rows = [
      { Metric: 'Total Collected', Value: `${formatCurrency(data.totalCollected)} ETB` },
      { Metric: 'Total Payroll', Value: `${formatCurrency(data.totalPayroll)} ETB` },
      { Metric: 'Total Expenses', Value: `${formatCurrency(data.totalExpenses)} ETB` },
      { Metric: 'Net Profit', Value: `${formatCurrency(data.netProfit)} ETB` },
      { Metric: 'Collection Rate', Value: `${data.collectionRate}%` },
      { Metric: 'Profit Change', Value: `${data.profitChange > 0 ? '+' : ''}${data.profitChange}%` },
      { Metric: 'Previous Month Net Profit', Value: `${formatCurrency(data.previousNetProfit)} ETB` },
    ];
    Object.entries(data.expenseBreakdown || {}).forEach(([k, v]) => {
      rows.push({ Metric: `  Expense: ${CATEGORY_LABELS[k] || k}`, Value: `${formatCurrency(v as number)} ETB` });
    });
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
        .profit{color:#2A9D8F;font-weight:700}
        .loss{color:#E63946;font-weight:700}
        .footer{margin-top:32px;font-size:10px;color:#aaa;text-align:center}
      </style></head><body>
      <h1>${title}</h1>
      <p class="sub">Net Profit: <strong class="${data.netProfit >= 0 ? 'profit' : 'loss'}">${formatCurrency(data.netProfit)} ETB</strong></p>
      <table><thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r.Metric}</td><td>${r.Value}</td></tr>`).join('')}</tbody></table>
      <p class="footer">Generated on ${new Date().toLocaleDateString()} &bull; Nejah Online Quran Center</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  return (
    <DashboardLayout>
      <div className="admin-page">
        <PageHeader
          eyebrow="Finance"
          title="Net Profit"
          description="Monthly profit analysis — revenue minus expenses"
          actions={
            <Button variant="outline" onClick={handleExportPDF}
