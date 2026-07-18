/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { API_BASE, apiUrl } from "@/lib/api";
import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
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
  RefreshCw,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  ArrowRight,
  X,
  Download,
  Mail,
  Phone,
  MapPin,
  Globe,
  GraduationCap,
  Users,
  CheckCircle,
  Loader2,
  Star,
  AlertTriangle,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  ThumbsUp,
  Ban,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AmbientSection, BentoStatCard, GlassPanel, PageHeader } from '@/components/dashboard/design-system';
import { AddTeacherModal } from '@/components/teachers/AddTeacherModal';
import { EditTeacherModal } from '@/components/teachers/EditTeacherModal';
import { DeleteTeacherModal } from '@/components/teachers/DeleteTeacherModal';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';

export const Route = createLazyFileRoute('/teachers')({
  component: TeachersPage,
});

function TeachersPage() {
  const userRole = localStorage.getItem('userRole') || '';
  const [teachers, setTeachers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
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

  const fetchTeachers = useCallback(async (pageOverride?: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const page = pageOverride ?? meta.page;
      let url = apiUrl(`/teachers?page=${page}&limit=${meta.limit}`);
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status !== 'all') url += `&status=${encodeURIComponent(status)}`;

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
      setRefreshing(false);
    }
  }, [meta.page, meta.limit, search, status]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/teachers/stats`), {
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
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeachers();
    fetchStats();
  }, [fetchTeachers, fetchStats]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta(prev => ({ ...prev, page: 1 }));
    fetchTeachers(1);
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setMeta(prev => ({ ...prev, page: 1 }));
  };

  const navigate = useNavigate();
  const handleViewTeacher = useCallback((teacher: any) => {
    navigate({ to: '/teachers/$id/profile', params: { id: teacher.id } });
  }, [navigate]);
  const handleEditTeacher = useCallback((teacher: any) => setEditingTeacher(teacher), []);
  const handleDeleteTeacher = useCallback((teacher: any) => setDeletingTeacher(teacher), []);

  return (
    <DashboardLayout>
      <AmbientSection className="admin-page">
        <PageHeader
          eyebrow="Academic Faculty"
          title="Teachers"
          actions={
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" className="h-11 gap-2 rounded-xl px-4" disabled={refreshing}>
                <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              {userRole === 'super_admin' && (
                <Button onClick={() => setIsAddModalOpen(true)} className="h-11 gap-2 rounded-xl px-6">
                  <Plus className="h-5 w-5" />
                  Add Teacher
                </Button>
              )}
            </div>
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nejah-slate-blue" />
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
                <SelectTrigger className="h-11 w-[140px] rounded-xl border-white/10 bg-background/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="on leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => fetchTeachers(1)} className="mt-5 h-11 rounded-xl px-6 font-bold">
              Apply Filter
            </Button>

            <Button variant="ghost" onClick={resetFilters} className="mt-5 h-11 w-11 rounded-xl p-0">
              <RotateCcw className="h-5 w-5 text-nejah-slate-blue" />
            </Button>
          </div>
        </div>

        <GlassPanel className="overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-background/50">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Teacher Name</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Students Count</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Experience</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Actions</th>
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
                    <td colSpan={5} className="py-20 text-center text-muted-foreground font-medium font-serif">
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
          <div className="px-6 py-4 border-t border-border dark:border-nejah-border-blue bg-muted/50 dark:bg-nejah-surface/50 flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Showing <span className="text-foreground dark:text-foreground">{(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="text-foreground dark:text-foreground">{meta.total}</span> registered teachers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={meta.page === 1}
                onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                className="h-9 w-9 rounded-xl dark:border-nejah-border-blue"
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
                    meta.page === i + 1 ? 'bg-primary hover:bg-nejah-azure' : 'bg-transparent text-muted-foreground hover:text-nejah-sapphire dark:hover:text-nejah-electric'
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
                className="h-9 w-9 rounded-xl dark:border-nejah-border-blue"
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
              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-widest text-nejah-electric">
                Internal Announcement
              </p>
              <h2 className="max-w-[450px] text-2xl font-medium leading-tight tracking-tight text-foreground">
                New Faculty Training Program Begins Next Monday.
              </h2>
            </div>
            <p className="mt-4 max-w-[500px] text-xs leading-relaxed text-nejah-slate-blue">
              Join our monthly pedagogy workshop to enhance student engagement and master virtual whiteboard curriculum delivery.
            </p>
          </GlassPanel>

          <GlassPanel className="flex flex-col justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground">Scholarly Excellence</h3>
                <p className="text-xs font-medium text-nejah-slate-blue">Faculty Accreditation</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-nejah-slate-blue">
              View teachers who have successfully completed the advanced virtual ijazah syllabus and curriculum accreditation this quarter.
            </p>
            <button className="mt-4 flex items-center gap-1.5 text-xs font-bold text-nejah-electric group hover:text-nejah-electric/80 cursor-pointer">
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

      <TeacherDetailModal
        teacher={null}
        onClose={() => {}}
        userRole={userRole}
        onEdit={handleEditTeacher}
        onRefresh={fetchTeachers}
      />
    </DashboardLayout>
  );
}
