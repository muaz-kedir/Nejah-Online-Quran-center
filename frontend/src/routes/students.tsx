import { useState, useEffect, useCallback, memo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
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
  KeyRound,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AddStudentModal } from '@/components/students/AddStudentModal';
import { EditStudentModal } from '@/components/students/EditStudentModal';
import { DeleteStudentModal } from '@/components/students/DeleteStudentModal';
import { AssignStudentModal } from '@/components/students/AssignStudentModal';
import { StudentDetailsModal } from '@/components/students/StudentDetailsModal';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';

const API = 'http://localhost:3000/api';

export const Route = createFileRoute('/students')({
  component: StudentsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

const getLevelColor = (lvl: string) => {
  switch (lvl?.toLowerCase()) {
    case 'beginner': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'intermediate': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'advanced': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'hifz': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
};

const getStatusColor = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'inactive': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const StudentRow = memo(function StudentRow({ student, onView, onEdit, onResetPassword, onDelete }: {
  student: any;
  onView: (s: any) => void;
  onEdit: (s: any) => void;
  onResetPassword: (s: any) => void;
  onDelete: (s: any) => void;
}) {
  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
      <td className="py-5 px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex-shrink-0">
            {student.avatarUrl ? (
              <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                {student.fullName?.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
              {student.fullName}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
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
        </div>
      </td>
      <td className="py-5 px-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {student.teacher?.fullName || student.teacher?.user?.name || 'Unassigned'}
        </p>
      </td>
      <td className="py-5 px-4">
        <div className="w-24">
          <div className="flex items-center justify-between mb-1.5">
             <span className="text-[10px] font-bold text-gray-400">{student.attendanceRate || 0}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
             <div
                className={cn('h-full rounded-full', parseFloat(student.attendanceRate) < 50 ? 'bg-red-500' : 'bg-emerald-600')}
                style={{ width: `${student.attendanceRate || 0}%` }}
             />
          </div>
        </div>
      </td>
      <td className="py-5 px-4">
        <div className="w-24">
          <div className="flex items-center justify-between mb-1.5">
             <span className="text-[10px] font-bold text-gray-400">{student.progressRate || 0}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
             <div
                className="bg-amber-600 h-full rounded-full"
                style={{ width: `${student.progressRate || 0}%` }}
             />
          </div>
        </div>
      </td>
      <td className="py-5 px-4">
        <Badge className={cn('text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 border-none', getStatusColor(student.status))}>
          <span className={cn('w-1.5 h-1.5 rounded-full mr-2', student.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400')} />
          {student.status}
        </Badge>
      </td>
      <td className="py-5 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(student)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(student)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onResetPassword(student)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"
            title="Reset Password"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(student)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [teacherId, setTeacherId] = useState('all');
  const [status, setStatus] = useState('all');

  const [teachers, setTeachers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<any | null>(null);
  const [resetPasswordStudent, setResetPasswordStudent] = useState<any | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const token = () => localStorage.getItem('token');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `${API}/students?page=${meta.page}&limit=${meta.limit}`;
      if (search) url += `&search=${search}`;
      if (level !== 'all') url += `&level=${level}`;
      if (teacherId !== 'all') url += `&teacherId=${teacherId}`;
      if (status !== 'all') url += `&status=${status}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const res = await response.json();
      if (res && Array.isArray(res.data)) {
        setStudents(res.data);
        setMeta(res.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
      } else {
        setStudents([]);
        setMeta({ total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API}/teachers?limit=1000`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        setTeachers(data.data);
      } else if (Array.isArray(data)) {
        setTeachers(data);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Failed to fetch teachers', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/students/stats`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [meta.page, level, teacherId, status]);

  useEffect(() => {
    fetchTeachers();
    fetchStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta({ ...meta, page: 1 });
    fetchStudents();
  };

  const resetFilters = () => {
    setSearch('');
    setLevel('all');
    setTeacherId('all');
    setStatus('all');
    setMeta({ ...meta, page: 1 });
  };

  const handleViewStudent = useCallback((student: any) => setViewingStudent(student), []);
  const handleEditStudent = useCallback((student: any) => setEditingStudent(student), []);
  const handleResetPassword = useCallback((student: any) => {
    setResetPasswordStudent(student);
    setResetNewPassword('');
  }, []);
  const handleDeleteStudent = useCallback((student: any) => setDeletingStudent(student), []);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-500 tracking-widest uppercase mb-1">
              Student Directory
            </p>
            <h1 className="text-3xl font-bold text-emerald-900 dark:text-gray-100">Students</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsAssignModalOpen(true)}
              variant="outline"
              className="border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 gap-2 h-11 px-6 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <UserCheck className="h-5 w-5" />
              Assign Student
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-900 hover:bg-emerald-800 text-white gap-2 h-11 px-6 rounded-xl shadow-lg shadow-emerald-900/20"
            >
              <Plus className="h-5 w-5" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px]">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by student name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Level</span>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="w-[140px] h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-none">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Hifz">Hifz</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Teacher</span>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger className="w-[160px] h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-none">
                    <SelectValue placeholder="All Faculty" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="all">All Faculty</SelectItem>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.fullName || t.user?.name || 'Unknown'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             <Button
                onClick={fetchStudents}
                className="mt-5 h-11 px-6 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl border-none"
             >
                Apply Filters
             </Button>

             <Button
                variant="ghost"
                onClick={resetFilters}
                className="mt-5 h-11 w-11 rounded-xl p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
             >
                <RotateCcw className="h-5 w-5 text-gray-400" />
             </Button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student Name</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Teacher</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attendance %</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress %</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-right py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="h-20" />
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-400 font-medium">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                    students.map((student) => (
                      <StudentRow key={student.id} student={student} onView={handleViewStudent} onEdit={handleEditStudent} onResetPassword={handleResetPassword} onDelete={handleDeleteStudent} />
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-900 dark:text-gray-200">{(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="text-gray-900 dark:text-gray-200">{meta.total}</span> registered students
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
        </div>

        {/* Real Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
           <div className="bg-emerald-900 dark:bg-emerald-950 p-6 rounded-3xl text-white relative overflow-hidden shadow-xl">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-60 mb-2">Total Students</p>
              <h2 className="text-4xl font-bold mb-3">{stats?.total || 0}</h2>
              <p className="text-xs text-emerald-100/70 leading-relaxed max-w-[200px]">
                {stats?.active || 0} active students enrolled in the program.
              </p>
           </div>

           <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-2">Average Attendance</p>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{stats?.averageAttendance || 0}%</h2>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full mb-3 overflow-hidden">
                 <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats?.averageAttendance || 0}%` }} />
              </div>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                 <TrendingUp className="h-3 w-3" /> Overall attendance rate
              </p>
           </div>

           <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl shadow-sm border border-amber-100/50 dark:border-amber-900/30">
              <p className="text-[10px] font-bold tracking-widest uppercase text-amber-600/60 dark:text-amber-500/60 mb-2">Active Students</p>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{stats?.active || 0}</h2>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                 <Users className="h-5 w-5 text-amber-600" />
                 <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                   {stats?.inactive || 0} inactive students
                 </p>
              </div>
           </div>
        </div>
      </div>

      <AddStudentModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchStudents}
        teachers={teachers}
      />

      <EditStudentModal
        open={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={fetchStudents}
        student={editingStudent}
        teachers={teachers}
      />

      <AssignStudentModal
        open={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={fetchStudents}
      />

      <StudentDetailsModal
        open={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        student={viewingStudent}
      />

      <DeleteStudentModal
        open={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onSuccess={fetchStudents}
        studentId={deletingStudent?.id}
        studentName={deletingStudent?.fullName}
      />

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordStudent} onOpenChange={(open) => !open && setResetPasswordStudent(null)}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[420px] dark:bg-gray-800 dark:border-gray-700 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-900 dark:text-gray-100 flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set a new password for <span className="font-bold text-gray-800 dark:text-gray-200">{resetPasswordStudent?.fullName}</span>.
              The student can use this password to log in with their email or family phone number.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="resetPw" className="dark:text-gray-300">New Password</Label>
              <Input
                id="resetPw"
                type="password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetPasswordStudent(null)}
              className="rounded-xl dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!resetNewPassword || resetNewPassword.length < 6) {
                  toast.error('Password must be at least 6 characters');
                  return;
                }
                setResettingPassword(true);
                try {
                  const response = await fetch(`${API}/students/${resetPasswordStudent.id}/reset-password`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token()}`,
                    },
                    body: JSON.stringify({ newPassword: resetNewPassword }),
                  });
                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to reset password');
                  }
                  toast.success('Password reset successfully');
                  setResetPasswordStudent(null);
                  setResetNewPassword('');
                } catch (error: any) {
                  toast.error(error.message);
                } finally {
                  setResettingPassword(false);
                }
              }}
              disabled={resettingPassword}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
            >
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
