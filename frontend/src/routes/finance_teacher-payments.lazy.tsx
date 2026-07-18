/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { API_BASE, apiUrl } from "@/lib/api";
import { useEffect, useState } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
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

export const Route = createLazyFileRoute('/finance_teacher-payments')({
  component: TeacherPaymentsPage,
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
    }
