/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/finance-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, DollarSign, PiggyBank, Wallet, Download, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/useApiQuery";

export const Route = createLazyFileRoute('/finance_profit')({
  component: ProfitPage,
});

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

function ProfitPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const queryClient = useQueryClient();

  const billingMonth = `${year}-${String(month).padStart(2, '0')}`;

  const { data, isLoading: loading } = useApiQuery<any>({
    queryKey: ["net-profit", billingMonth],
    path: `/finance/net-profit?billingMonth=${billingMonth}`,
    refetchInterval: 30_000,
  });

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
            <Button variant="outline" onClick={handleExportPDF} disabled={!data} className="h-11 gap-2 rounded-xl px-4">
              <Download className="h-5 w-5" /> Export PDF
            </Button>
          }
        />

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="h-9 w-[170px] rounded-xl text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 w-[100px] rounded-xl text-xs text-center"
          />
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["net-profit"] })} className="h-9 rounded-xl">
            <BarChart3 className="h-4 w-4 mr-1" /> Load
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-nejah-electric" /></div>
        ) : !data ? (
          <div className="text-center py-20 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No data for this period</p>
            <p className="text-xs mt-1">Select a month and click Load.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
              <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Collected</p>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600"><DollarSign className="h-4 w-4" /></div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">ETB {formatCurrency(data.totalCollected)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{data.collectionRate}% collection rate</p>
                </CardContent>
              </Card>
              <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Payroll</p>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600"><PiggyBank className="h-4 w-4" /></div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">ETB {formatCurrency(data.totalPayroll)}</p>
                </CardContent>
              </Card>
              <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Expenses</p>
                    <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600"><Wallet className="h-4 w-4" /></div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">ETB {formatCurrency(data.totalExpenses)}</p>
                </CardContent>
              </Card>
              <Card className={`rounded-2xl ${data.netProfit >= 0 ? 'dark:bg-nejah-surface dark:border-green-500/30 border-green-200' : 'dark:bg-nejah-surface dark:border-red-500/30 border-red-200'}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Net Profit</p>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${data.netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30 text-green-600' : 'bg-red-50 dark:bg-red-950/30 text-red-600'}`}>
                      {data.netProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                  </div>
                  <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ETB {formatCurrency(data.netProfit)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    vs prev month ({data.previousMonth}):
                    <span className={data.profitChange >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {data.profitChange > 0 ? '+' : ''}{data.profitChange}%
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-6">
              <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-nejah-electric" /> Revenue vs Expenses</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => `ETB ${formatCurrency(v)}`} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-2xl">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-nejah-electric" /> Expense Breakdown</CardTitle></CardHeader>
                <CardContent>
                  {expensePieData.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                            {expensePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                        <Tooltip formatter={(v: any) => `ETB ${formatCurrency(v)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">No expenses this period</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
