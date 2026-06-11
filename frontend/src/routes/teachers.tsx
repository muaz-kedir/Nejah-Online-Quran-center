import { useState, useEffect, useCallback, memo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AmbientSection, BentoStatCard, GlassPanel, PageHeader } from '@/components/dashboard/design-system';
import { AddTeacherModal } from '@/components/teachers/AddTeacherModal';
import { EditTeacherModal } from '@/components/teachers/EditTeacherModal';
import { DeleteTeacherModal } from '@/components/teachers/DeleteTeacherModal';
import { TeacherDetailsModal } from '@/components/teachers/TeacherDetailsModal';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teachers')({
  component: TeachersPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

const getStatusBadge = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
    case 'inactive':
      return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50 dark:border-red-900/30';
    case 'pending':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-red-900/30';
    case 'on leave':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
    default:
      return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
};

const TeacherRow = memo(function TeacherRow({ teacher, onView, onEdit, onDelete }: {
  teacher: any;
  onView: (t: any) => void;
  onEdit: (t: any) => void;
  onDelete: (t: any) => void;
}) {
  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors group">
      <td className="py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 flex-shrink-0 flex items-center justify-center font-bold text-lg text-emerald-800 dark:text-emerald-300">
            {teacher.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-extrabold text-emerald-900 dark:text-gray-100 group-hover:text-emerald-700 transition-colors text-base font-serif">
              {teacher.fullName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {teacher.specialization || 'General Islamic Studies'}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {teacher.students?.length || 0} Students
          </span>
          <div className="w-16 bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${Math.min((teacher.students?.length || 0) * 10, 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {teacher.experience || 0} Years
        </p>
      </td>
      <td className="py-4 px-4">
        <Badge className={cn('text-[10px] font-extrabold uppercase tracking-widest rounded-full px-3 py-1 border-none flex items-center w-max gap-1.5', getStatusBadge(teacher.status))}>
          <span className={cn('w-1.5 h-1.5 rounded-full', teacher.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400')} />
          {teacher.status || 'Active'}
        </Badge>
      </td>
      <td className="py-4 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(teacher)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-emerald-700 transition-colors"
            title="View Faculty Profile"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => onEdit(teacher)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit Profile"
          >
            <Pencil className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => onDelete(teacher)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
            title="Delete Teacher"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  
  // Dashboard stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    pending: 0,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<any | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<any | null>(null);

  const API_BASE = 'http://localhost:3000/api';

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE}/teachers?page=${meta.page}&limit=${meta.limit}`;
      if (search) url += `&search=${search}`;
      if (status !== 'all') url += `&status=${status}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await response.json();
      if (res && Array.isArray(res.data)) {
        setTeachers(res.data);
        setMeta(res.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
      } else {
        setTeachers([]);
        setMeta({ total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (error) {
      toast.error('Failed to fetch faculty directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/teachers/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.total || 0,
          active: data.active || 0,
          onLeave: data.onLeave || 0,
          pending: data.pending || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [meta.page, status]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta({ ...meta, page: 1 });
    fetchTeachers();
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setMeta({ ...meta, page: 1 });
  };

  const handleViewTeacher = useCallback((teacher: any) => setViewingTeacher(teacher), []);
  const handleEditTeacher = useCallback((teacher: any) => setEditingTeacher(teacher), []);
  const handleDeleteTeacher = useCallback((teacher: any) => setDeletingTeacher(teacher), []);

  return (
    <DashboardLayout>
      <AmbientSection className="admin-page">
        <PageHeader
          eyebrow="Academic Faculty"
          title="Teachers"
          actions={
            <Button onClick={() => setIsAddModalOpen(true)} className="h-11 gap-2 rounded-xl px-6">
              <Plus className="h-5 w-5" />
              Add Teacher
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <BentoStatCard label="Total Faculty" value={stats.total} icon={<Calendar className="h-5 w-5" />} />
          <BentoStatCard label="Active Now" value={stats.active} icon={<Sparkles className="h-5 w-5" />} highlight />
          <BentoStatCard label="On Leave" value={String(stats.onLeave).padStart(2, '0')} icon={<RotateCcw className="h-5 w-5" />} />
          <BentoStatCard label="Pending" value={stats.pending} icon={<BookOpen className="h-5 w-5" />} />
        </div>

        <div className="admin-filter-bar">
          <div className="flex-1 min-w-[240px]">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-platinum" />
              <Input
                placeholder="Search faculty by name, email, or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-xl border-none pl-9"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="admin-field-label">Status</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 w-[140px] rounded-xl border-white/10 bg-brand-void/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="on leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchTeachers} className="mt-5 h-11 rounded-xl px-6 font-bold">
              Apply Filter
            </Button>

            <Button variant="ghost" onClick={resetFilters} className="mt-5 h-11 w-11 rounded-xl p-0">
              <RotateCcw className="h-5 w-5 text-brand-platinum" />
            </Button>
          </div>
        </div>

        <GlassPanel className="overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-brand-void/50">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-brand-platinum">Teacher Name</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-brand-platinum">Students Count</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-brand-platinum">Experience</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-brand-platinum">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-brand-platinum">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="h-24" />
                    </tr>
                  ))
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-400 font-medium font-serif">
                      No teachers found matching your search.
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <TeacherRow key={teacher.id} teacher={teacher} onView={handleViewTeacher} onEdit={handleEditTeacher} onDelete={handleDeleteTeacher} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-900 dark:text-gray-200">{(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="text-gray-900 dark:text-gray-200">{meta.total}</span> registered teachers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={meta.page === 1}
                onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                className="h-9 w-9 rounded-xl dark:border-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: meta.totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={meta.page === i + 1 ? 'default' : 'outline'}
                  onClick={() => setMeta({ ...meta, page: i + 1 })}
                  className={cn(
                    'h-9 w-9 rounded-xl font-bold border-none',
                    meta.page === i + 1 ? 'bg-emerald-900 hover:bg-emerald-800' : 'bg-transparent text-gray-400 hover:text-emerald-800'
                  )}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                disabled={meta.page === meta.totalPages}
                onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
                className="h-9 w-9 rounded-xl dark:border-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </GlassPanel>

        <div className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-3">
          <GlassPanel
            glow
            className="flex min-h-[160px] flex-col justify-between p-7 lg:col-span-2"
          >
            <div>
              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-widest text-brand-electric">
                Internal Announcement
              </p>
              <h2 className="max-w-[450px] text-2xl font-medium leading-tight tracking-tight text-brand-silver">
                New Faculty Training Program Begins Next Monday.
              </h2>
            </div>
            <p className="mt-4 max-w-[500px] text-xs leading-relaxed text-brand-platinum">
              Join our monthly pedagogy workshop to enhance student engagement and master virtual whiteboard curriculum delivery.
            </p>
          </GlassPanel>

          <GlassPanel className="flex flex-col justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-brand-silver">Scholarly Excellence</h3>
                <p className="text-xs font-medium text-brand-platinum">Faculty Accreditation</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-brand-platinum">
              View teachers who have successfully completed the advanced virtual ijazah syllabus and curriculum accreditation this quarter.
            </p>
            <button className="mt-4 flex items-center gap-1.5 text-xs font-bold text-brand-electric group hover:text-brand-electric/80">
              View Rankings <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </GlassPanel>
        </div>
      </AmbientSection>

      <AddTeacherModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTeachers}
      />

      <EditTeacherModal
        open={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        onSuccess={fetchTeachers}
        teacher={editingTeacher}
      />

      <DeleteTeacherModal
        open={!!deletingTeacher}
        onClose={() => setDeletingTeacher(null)}
        onSuccess={fetchTeachers}
        teacherId={deletingTeacher?.id}
        teacherName={deletingTeacher?.fullName}
      />

      <TeacherDetailsModal
        open={!!viewingTeacher}
        onClose={() => setViewingTeacher(null)}
        teacher={viewingTeacher}
      />
    </DashboardLayout>
  );
}
