/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { API_BASE, apiUrl } from "@/lib/api";
import { useState, useEffect } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  UserCheck,
  TrendingUp,
  Award,
  Users,
  Calendar,
  MapPin,
  RefreshCw,
  MoreVertical,
  Activity,
  UserCog,
  GraduationCap,
  BookOpen,
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
import { AddStudentModal } from '@/components/students/AddStudentModal';
import { EditStudentModal } from '@/components/students/EditStudentModal';
import { DeleteStudentModal } from '@/components/students/DeleteStudentModal';
import { AssignStudentModal } from '@/components/students/AssignStudentModal';
import { StudentDetailsModal } from '@/components/students/StudentDetailsModal';
import { ChangeStudentStatusModal } from '@/components/students/ChangeStudentStatusModal';
import { ManageLevelModal } from '@/components/students/ManageLevelModal';
import { AssignTemporaryTeacherModal } from '@/components/teachers/AssignTemporaryTeacherModal';
import { ProgressDetailsModal } from '@/components/progress/ProgressDetailsModal';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { useApiQuery } from '@/hooks/useApiQuery';

export const Route = createLazyFileRoute('/students')({
  component: StudentsPage,
});

function getDateRange(filter: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let start: string;
  switch (filter) {
    case 'today':
      start = end;
      break;
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      start = d.toISOString().slice(0, 10);
      break;
    }
    case 'month':
      start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      break;
    case 'year':
      start = `${now.getFullYear()}-01-01`;
      break;
    default:
      start = end;
  }
  return { startDate: start, endDate: end };
}

function StudentsPage() {
  const queryClient = useQueryClient();
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 2, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [teacherId, setTeacherId] = useState('all');
  const [status, setStatus] = useState('all');
  const [country, setCountry] = useState('all');
  const [city, setCity] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const studentsUrl = `/students?page=${meta.page}&limit=${meta.limit}${search ? `&search=${search}` : ''}${level !== 'all' ? `&level=${level}` : ''}${teacherId !== 'all' ? `&teacherId=${teacherId}` : ''}${status !== 'all' ? `&status=${status}` : ''}${country !== 'all' ? `&country=${country}` : ''}${city ? `&city=${city}` : ''}${dateFilter !== 'all' && dateFilter !== 'custom' ? (() => { const { startDate, endDate } = getDateRange(dateFilter); return `&startDate=${startDate}&endDate=${endDate}`; })() : ''}`;

  const { data: studentsData, isLoading: loading } = useApiQuery<{ data: any[]; meta: any }>({
    queryKey: ['students', meta.page, level, teacherId, status, country, dateFilter, search, city],
    path: studentsUrl,
    refetchInterval: 30_000,
  });

  const { data: stats } = useApiQuery<{ total: number; active: number; inactive: number; newStudentsThisMonth: number; averageAttendance: number }>({
    queryKey: ['students-stats'],
    path: '/students/stats',
    refetchInterval: 30_000,
  });

  const { data: teachersData } = useApiQuery<{ data: any[] }>({
    queryKey: ['teachers-dropdown'],
    path: '/teachers',
    refetchInterval: 30_000,
  });

  const { data: parentsData } = useApiQuery<any[]>({
    queryKey: ['parents-dropdown'],
    path: '/parents',
    refetchInterval: 30_000,
  });

  const students = studentsData?.data || [];
  const teachers = Array.isArray(teachersData) ? teachersData : teachersData?.data || [];
  const parents = Array.isArray(parentsData) ? parentsData : parentsData?.data || [];

  useEffect(() => {
    if (studentsData?.meta) {
      setMeta(prev => ({ ...prev, ...studentsData.meta }));
    }
  }, [studentsData?.meta]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTempReplacementOpen, setIsTempReplacementOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [viewingProgress, setViewingProgress] = useState<any | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<any | null>(null);
  const [changingStatusStudent, setChangingStatusStudent] = useState<any | null>(null);
  const [managingLevelStudent, setManagingLevelStudent] = useState<any | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['students'] });
    queryClient.invalidateQueries({ queryKey: ['students-stats'] });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta({ ...meta, page: 1 });
  };

  const resetFilters = () => {
    setSearch('');
    setLevel('all');
    setTeacherId('all');
    setStatus('all');
    setCountry('all');
    setCity('');
    setDateFilter('all');
    setMeta({ ...meta, page: 1 });
  };

  const getLevelColor = (lvl: string) => {
    switch (lvl?.toLowerCase()) {
      case 'beginner': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'intermediate': return 'bg-primary/10 text-nejah-electric border-nejah-electric/20';
      case 'advanced': return 'bg-nejah-sapphire/20 text-foreground border-nejah-electric/20';
      case 'hifz': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      default: return 'bg-nejah-surface/50 text-muted-foreground border-white/10';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'active': return 'bg-primary/10 text-nejah-electric border-nejah-electric/20';
      case 'inactive': return 'bg-nejah-surface/50 text-muted-foreground border-white/10';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-nejah-surface/50 text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <AmbientSection className="admin-page">
        <PageHeader
          eyebrow="Student Directory"
          title="Students"
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => setIsTempReplacementOpen(true)} variant="outline" className="h-11 gap-2 rounded-xl px-6">
                <UserCog className="h-5 w-5" />
                Assign Temporary Teacher
              </Button>
              <Button onClick={() => setIsAssignModalOpen(true)} variant="outline" className="h-11 gap-2 rounded-xl px-6">
                <UserCheck className="h-5 w-5" />
                Assign Student
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} className="h-11 gap-2 rounded-xl px-6">
                <Plus className="h-5 w-5" />
                Add Student
              </Button>
            </div>
          }
        />

        <div className="admin-filter-bar">
          <div className="flex-1 min-w-[240px]">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-xl border-none pl-9"
              />
            </form>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex flex-col">
                <span className="admin-field-label">Level</span>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-11 w-[140px] rounded-xl border-white/10 bg-background/50">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Qaida Nooraniya">Qaida Nooraniya</SelectItem>
                    <SelectItem value="Quran Reading">Quran Reading</SelectItem>
                    <SelectItem value="Tajweed Program">Tajweed Program</SelectItem>
                    <SelectItem value="Hifz Program">Hifz Program</SelectItem>
                    <SelectItem value="Hifz Muraja'a">Hifz Muraja&apos;a</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="flex flex-col">
                <span className="admin-field-label">Teacher</span>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger className="h-11 w-[160px] rounded-xl border-white/10 bg-background/50">
                    <SelectValue placeholder="All Faculty" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="all">All Faculty</SelectItem>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.user?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             <div className="flex flex-col">
                <span className="admin-field-label">Status</span>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-11 w-[120px] rounded-xl border-white/10 bg-background/50">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="flex flex-col">
                <span className="admin-field-label">Country</span>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11 w-[140px] rounded-xl border-white/10 bg-background/50">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="Somalia">Somalia</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="flex flex-col">
                <span className="admin-field-label">City</span>
                <Input
                  placeholder="Enter city..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 w-[120px] rounded-xl border-none"
                />
             </div>

             <div className="flex flex-col">
                <span className="admin-field-label">Date Joined</span>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-11 w-[140px] rounded-xl border-white/10 bg-background/50">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <Button onClick={() => setMeta(prev => ({ ...prev, page: 1 }))} className="mt-5 h-11 rounded-xl px-6 font-bold">
                Apply Filters
              </Button>
             
             <Button variant="ghost" onClick={resetFilters} className="mt-5 h-11 w-11 rounded-xl p-0">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
             </Button>
          </div>
        </div>

        <GlassPanel className="overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-background/50 dark:bg-background/50">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Student Name</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Location</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Level</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Assigned Teacher</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="h-20" />
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-muted-foreground font-medium">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-muted to-muted dark:from-nejah-surface dark:to-nejah-surface flex-shrink-0">
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                                {student.fullName?.charAt(0) || 'S'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-foreground group-hover:text-foreground dark:group-hover:text-nejah-electric transition-colors">
                              {student.fullName}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                              ID: {student.studentCode || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                           <Badge className={cn('text-[10px] font-bold uppercase tracking-wider rounded-md border-none px-2 py-0.5', getLevelColor(student.level))}>
                              {student.level}
                           </Badge>
                           {student.level === 'Advanced' && (
                             <Badge className="bg-primary/10 text-primary dark:bg-primary/10 text-nejah-electric text-[10px] font-bold rounded-md border-none px-2 py-0.5">
                               HIFZ
                             </Badge>
                           )}
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground dark:text-muted-foreground">{student.country || 'N/A'}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{student.city || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-sm font-semibold text-foreground dark:text-muted-foreground">
                          {student.teacher?.user?.name || 'Unassigned'}
                        </p>
                      </td>
                      <td className="py-5 px-4">
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1.5">
                             <span className="text-[10px] font-bold text-muted-foreground">{student.attendanceRate || 0}%</span>
                          </div>
                          <div className="w-full bg-muted dark:bg-nejah-surface h-1.5 rounded-full overflow-hidden">
                             <div 
                                className={cn('h-full rounded-full', parseFloat(student.attendanceRate) < 50 ? 'bg-red-500' : 'bg-primary')} 
                                style={{ width: `${student.attendanceRate || 0}%` }} 
                             />
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1.5">
                             <span className="text-[10px] font-bold text-muted-foreground">{student.progressRate || 0}%</span>
                          </div>
                          <div className="w-full bg-muted dark:bg-nejah-surface h-1.5 rounded-full overflow-hidden">
                             <div 
                                className="bg-amber-600 h-full rounded-full" 
                                style={{ width: `${student.progressRate || 0}%` }} 
                             />
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <Badge className={cn('text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 border-none', getStatusColor(student.status))}>
                          <span className={cn('w-1.5 h-1.5 rounded-full mr-2', student.status === 'active' ? 'bg-primary/100' : 'bg-nejah-slate-blue')} />
                          {student.status}
                        </Badge>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setViewingStudent(student)}
                            className="p-2 hover:bg-muted dark:hover:bg-nejah-surface rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setViewingProgress(student)}
                            className="p-2 hover:bg-muted dark:hover:bg-nejah-surface rounded-lg text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
                            title="View Progress"
                          >
                            <BookOpen className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setChangingStatusStudent(student)}
                            className="p-2 hover:bg-muted dark:hover:bg-nejah-surface rounded-lg text-muted-foreground hover:text-amber-600 transition-colors cursor-pointer"
                            title="Change Status"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setManagingLevelStudent(student)}
                            className="p-2 hover:bg-muted dark:hover:bg-nejah-surface rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Manage Level"
                          >
                            <GraduationCap className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setEditingStudent(student)}
                            className="p-2 hover:bg-muted dark:hover:bg-nejah-surface rounded-lg text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setDeletingStudent(student)}
                            className="p-2 hover:bg-muted dark:hover:bg-nejah-surface rounded-lg text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border dark:border-nejah-border-blue bg-muted/50 dark:bg-nejah-surface/50 flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Showing <span className="text-foreground dark:text-foreground">{(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="text-foreground dark:text-foreground">{meta.total}</span> registered students
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
              <Button
                variant="default"
                className="pointer-events-none h-9 w-9 rounded-xl border-none font-bold"
              >
                {meta.page}
              </Button>
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

        <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-4">
          <BentoStatCard
            label="Total Students"
            value={stats?.total ?? 0}
            sub="All registered students"
            icon={<Users className="h-5 w-5" />}
            highlight
          />
          <BentoStatCard
            label="Active Students"
            value={stats?.active ?? 0}
            icon={<Activity className="h-5 w-5" />}
            progress={((stats?.active ?? 0) / (stats?.total ?? 1)) * 100}
          />
          <BentoStatCard
            label="Inactive Students"
            value={stats?.inactive ?? 0}
            icon={<TrendingUp className="h-5 w-5" />}
            progress={((stats?.inactive ?? 0) / (stats?.total ?? 1)) * 100}
          />
          <BentoStatCard
            label="New This Month"
            value={`+${stats?.newStudentsThisMonth ?? 0}`}
            sub="Recently enrolled"
            icon={<Calendar className="h-5 w-5" />}
          />
        </div>
      </AmbientSection>

      <AddStudentModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={invalidateAll}
        teachers={teachers}
      />

      <ManageLevelModal
        open={!!managingLevelStudent}
        onClose={() => setManagingLevelStudent(null)}
        onSuccess={invalidateAll}
        student={managingLevelStudent}
      />

      <EditStudentModal
        open={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={invalidateAll}
        student={editingStudent}
        teachers={teachers}
      />

      <AssignStudentModal
        open={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={invalidateAll}
      />

      <AssignTemporaryTeacherModal
        open={isTempReplacementOpen}
        onClose={() => setIsTempReplacementOpen(false)}
        onSuccess={invalidateAll}
      />

      <StudentDetailsModal
        open={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        student={viewingStudent}
      />

      <DeleteStudentModal
        open={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onSuccess={invalidateAll}
        studentId={deletingStudent?.id}
        studentName={deletingStudent?.fullName}
      />

      {changingStatusStudent && (
        <ChangeStudentStatusModal
          isOpen={!!changingStatusStudent}
          onClose={() => setChangingStatusStudent(null)}
          studentId={changingStatusStudent.id}
          currentStatus={changingStatusStudent.status}
          studentName={changingStatusStudent.fullName}
          onSuccess={invalidateAll}
        />
      )}

      {/* Progress Details Modal */}
      {viewingProgress && (
        <ProgressDetailsModal
          open={!!viewingProgress}
          onClose={() => setViewingProgress(null)}
          studentId={viewingProgress.id}
          studentName={viewingProgress.fullName}
        />
      )}
    </DashboardLayout>
  );
}
