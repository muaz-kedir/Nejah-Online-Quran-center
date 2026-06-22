import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, UserCog, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AssignTemporaryTeacherModal } from '@/components/teachers/AssignTemporaryTeacherModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/teacher-replacements')({
  component: TeacherReplacementsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin', 'qirat_manager']),
});

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  active: 'bg-primary/10 text-primary',
  completed: 'bg-muted text-foreground',
  cancelled: 'bg-red-100 text-red-700',
};

const REASON_LABELS: Record<string, string> = {
  vacation: 'Vacation',
  sick_leave: 'Sick Leave',
  emergency: 'Emergency',
  internet_problems: 'Internet Problems',
  personal_leave: 'Personal Leave',
  training: 'Training',
  other: 'Other',
};

function TeacherReplacementsPage() {
  const [replacements, setReplacements] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReplacements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(meta.page),
        limit: String(meta.limit),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api<any>(`/teacher-replacements?${params}`);
      setReplacements(res.data || []);
      setMeta(res.meta || meta);
    } catch {
      toast.error('Failed to load teacher replacements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplacements();
  }, [meta.page, statusFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReplacements();
    setIsRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta(prev => ({ ...prev, page: 1 }));
    fetchReplacements();
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this temporary assignment?')) return;
    setCancellingId(id);
    try {
      await api(`/teacher-replacements/${id}/cancel`, { method: 'POST' });
      toast.success('Assignment cancelled');
      fetchReplacements();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-foreground">Teacher Replacements</h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            Manage temporary teacher assignments for students
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 gap-2 rounded-xl px-4" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Assign Temporary Teacher
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </form>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card dark:bg-nejah-surface rounded-xl border border-border dark:border-nejah-border-blue overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted dark:bg-nejah-surface/50">
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Student</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Original Teacher</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Replacement</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Period</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Reason</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
              <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">Loading...</td>
              </tr>
            ) : replacements.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <UserCog className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No temporary assignments found
                </td>
              </tr>
            ) : (
              replacements.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted dark:hover:bg-nejah-surface/30">
                  <td className="p-4 font-medium">{r.student?.fullName || '—'}</td>
                  <td className="p-4 text-sm">{r.originalTeacher?.fullName || '—'}</td>
                  <td className="p-4 text-sm">{r.replacementTeacher?.fullName || '—'}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {r.startDate} → {r.endDate}
                    {r.startTimeString && r.endTimeString && (
                      <span className="block text-xs text-muted-foreground">
                        {r.startTimeString} – {r.endTimeString}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    {REASON_LABELS[r.reason] || r.reason}
                    {r.customReason && ` (${r.customReason})`}
                  </td>
                  <td className="p-4">
                    <Badge className={cn('capitalize', STATUS_COLORS[r.status] || '')}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    {['upcoming', 'active'].includes(r.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={cancellingId === r.id}
                        onClick={() => handleCancel(r.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AssignTemporaryTeacherModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchReplacements}
      />
    </DashboardLayout>
  );
}
