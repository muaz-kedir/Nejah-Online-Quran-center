import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceFilters as Filters } from '@/lib/finance-api';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  showProgram?: boolean;
  showStatus?: boolean;
}

export function FinanceFilterBar({ filters, onChange, showProgram = true, showStatus = true }: Props) {
  const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value, page: 1 });

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <Input
        placeholder="Search..."
        value={filters.search || ''}
        onChange={(e) => set('search', e.target.value)}
      />
      <Select value={filters.dateRange || 'month'} onValueChange={(v) => set('dateRange', v)}>
        <SelectTrigger><SelectValue placeholder="Date range" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {showStatus && (
        <Select value={filters.paymentStatus || 'all'} onValueChange={(v) => set('paymentStatus', v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      )}
      {showProgram && (
        <Select value={filters.learningProgram || 'all'} onValueChange={(v) => set('learningProgram', v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Program" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="Qaida">Qaidah Nooraniyah</SelectItem>
            <SelectItem value="Quran Reading">Quran Reading</SelectItem>
            <SelectItem value="Tajweed">Tajweed</SelectItem>
            <SelectItem value="Hifz">Hifz</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Input placeholder="Country" value={filters.country || ''} onChange={(e) => set('country', e.target.value)} />
      {filters.dateRange === 'custom' && (
        <>
          <Input type="date" value={filters.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
          <Input type="date" value={filters.endDate || ''} onChange={(e) => set('endDate', e.target.value)} />
        </>
      )}
    </div>
  );
}
