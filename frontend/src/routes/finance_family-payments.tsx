import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { financeFetch, FinanceFilters, statusBadgeVariant, downloadCSV, exportPDF } from '@/lib/finance-api';
import { FinanceFilterBar } from '@/components/finance/FinanceFilters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance_family-payments')({
  component: FamilyPaymentsPage,
  beforeLoad: () => requireAuth(['finance_manager', 'super_admin']),
});

function FamilyPaymentsPage() {
  const [filters, setFilters] = useState<FinanceFilters>({ page: 1, limit: 20, dateRange: 'month' });
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    load();
  }, [filters]);

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
            <div key={f.id || `${f.parentId}-${i}`} className="glass-panel rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{f.parentName}</p>
                  <p className="text-xs text-nejah-slate-blue capitalize">{f.type === 'bundled' ? 'Bundled Family' : 'Separate Children'}</p>
                </div>
                <Badge variant={statusBadgeVariant(f.status)}>{f.status}</Badge>
              </div>
              <p className="mb-2 text-sm text-nejah-slate-blue">Children:</p>
              <ul className="mb-3 space-y-1 text-sm">
                {f.children?.map((c: any) => (
                  <li key={c.studentId} className="flex justify-between">
                    <span>{c.studentName}</span>
                    <span>${c.monthlyFee}/mo</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-white/10 pt-3 font-medium">
                <span>Monthly Total</span>
                <span>${f.monthlyTotal}</span>
              </div>
              {f.type === 'bundled' && f.remainingBalance != null && (
                <p className="mt-1 text-xs text-nejah-slate-blue">Balance: ${f.remainingBalance}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
