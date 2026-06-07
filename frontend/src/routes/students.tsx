import { useState, useEffect } from 'react';
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
  Calendar,
  MapPin,
  RefreshCw,
  MoreVertical,
  Activity,
  UserCog,
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
import { AddStudentModal } from '@/components/students/AddStudentModal';
import { EditStudentModal } from '@/components/students/EditStudentModal';
import { DeleteStudentModal } from '@/components/students/DeleteStudentModal';
import { AssignStudentModal } from '@/components/students/AssignStudentModal';
import { StudentDetailsModal } from '@/components/students/StudentDetailsModal';
import { ChangeStudentStatusModal } from '@/components/students/ChangeStudentStatusModal';
import { AssignTemporaryTeacherModal } from '@/components/teachers/AssignTemporaryTeacherModal';
import { toast } from 'sonner';

// Helper for date ranges
function getDateRange(range: string) {
  const now = new Date();
  const start = new Date();
  
  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }
  if (range === 'week') {
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }
  if (range === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }
  if (range === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }
  return { startDate: '', endDate: '' };
}

export const Route = createFileRoute('/students')({
  component: StudentsPage,
});

function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 2, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [teacherId, setTeacherId] = useState('all');
  const [status, setStatus] = useState('all');
  const [country, setCountry] = useState('all');
  const [city, setCity] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, newStudentsThisMonth: 0, averageAttendance: 0 });
  
  const [teachers, setTeachers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTempReplacementOpen, setIsTempReplacementOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<any | null>(null);
  const [changingStatusStudent, setChangingStatusStudent] = useState<any | null>(null);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/students/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {}
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:3000/api/students?page=${meta.page}&limit=${meta.limit}`;
      if (search) url += `&search=${search}`;
      if (level !== 'all') url += `&level=${level}`;
      if (teacherId !== 'all') url += `&teacherId=${teacherId}`;
      if (status !== 'all') url += `&status=${status}`;
      if (country !== 'all') url += `&country=${country}`;
      if (city) url += `&city=${city}`;
      
      if (dateFilter !== 'all' && dateFilter !== 'custom') {
        const { startDate, endDate } = getDateRange(dateFilter);
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await response.json();
      if (res && Array.isArray(res.data)) {
        setStudents(res.data);
        setMeta(res.meta || { total: 0, page: 1, limit: 2, totalPages: 1 });
      } else {
        setStudents([]);
        setMeta({ total: 0, page: 1, limit: 2, totalPages: 1 });
      }
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/teachers', {
        headers: { Authorization: `Bearer ${token}` },
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

  const fetchParents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/parents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setTeachers(data);
      } else if (data && Array.isArray(data.data)) {
        setTeachers(data.data);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Failed to fetch parents', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [meta.page, level, teacherId, status, country, dateFilter]);

  useEffect(() => {
    fetchTeachers();
    fetchParents();
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
    setCountry('all');
    setCity('');
    setDateFilter('all');
    setMeta({ ...meta, page: 1 });
  };

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
              onClick={() => setIsTempReplacementOpen(true)}
              variant="outline"
              className="border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 gap-2 h-11 px-6 rounded-xl"
            >
              <UserCog className="h-5 w-5" />
              Assign Temporary Teacher
            </Button>
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
                      <SelectItem key={t.id} value={t.id}>{t.user?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Status</span>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[120px] h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-none">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Country</span>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="w-[140px] h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-none">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
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
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">City</span>
                <Input
                  placeholder="Enter city..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-[120px] h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl"
                />
             </div>

             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1">Date Joined</span>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px] h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-none">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
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
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Teacher</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-right py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="h-20" />
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-gray-400 font-medium">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex-shrink-0">
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                                {student.fullName.charAt(0)}
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
                           {student.level === 'Advanced' && (
                             <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-md border-none px-2 py-0.5">
                               HIFZ
                             </Badge>
                           )}
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{student.country || 'N/A'}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{student.city || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {student.teacher?.user?.name || 'Unassigned'}
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
                            onClick={() => setViewingStudent(student)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setChangingStatusStudent(student)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"
                            title="Change Status"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setEditingStudent(student)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setDeletingStudent(student)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
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
              <Button
                variant="default"
                className="h-9 w-9 rounded-xl font-bold border-none bg-emerald-900 hover:bg-emerald-800 pointer-events-none"
              >
                {meta.page}
              </Button>
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

        {/* Stats Section (Bottom as per design) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
           <div className="bg-emerald-900 dark:bg-emerald-950 p-6 rounded-3xl text-white relative overflow-hidden shadow-xl">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-60 mb-2">Total Students</p>
              <h2 className="text-4xl font-bold mb-3">{stats.total}</h2>
              <div className="flex items-center gap-2 text-xs text-emerald-100/70">
                <Users className="h-4 w-4" /> All registered students
              </div>
           </div>
           
           <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-500 mb-2">Active Students</p>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">{stats.active}</h2>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full mb-3 overflow-hidden">
                 <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(stats.active / (stats.total || 1)) * 100}%` }} />
              </div>
           </div>

           <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold tracking-widest uppercase text-red-500 dark:text-red-400 mb-2">Inactive Students</p>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">{stats.inactive}</h2>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full mb-3 overflow-hidden">
                 <div className="bg-red-400 h-full rounded-full" style={{ width: `${(stats.inactive / (stats.total || 1)) * 100}%` }} />
              </div>
           </div>

           <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl shadow-sm border border-amber-100/50 dark:border-amber-900/30">
              <p className="text-[10px] font-bold tracking-widest uppercase text-amber-600/60 dark:text-amber-500/60 mb-2">New This Month</p>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">+{stats.newStudentsThisMonth}</h2>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-xl border border-amber-100 dark:border-amber-900/30">
                 <Calendar className="h-4 w-4 text-amber-600" />
                 <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">Recently Enrolled</p>
              </div>
           </div>
        </div>
      </div>

      <AddStudentModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchStudents}
        teachers={teachers}
        parents={parents}
      />

      <EditStudentModal
        open={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={fetchStudents}
        student={editingStudent}
        teachers={teachers}
        parents={parents}
      />

      <AssignStudentModal
        open={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={fetchStudents}
      />

      <AssignTemporaryTeacherModal
        open={isTempReplacementOpen}
        onClose={() => setIsTempReplacementOpen(false)}
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

      {changingStatusStudent && (
        <ChangeStudentStatusModal
          isOpen={!!changingStatusStudent}
          onClose={() => setChangingStatusStudent(null)}
          studentId={changingStatusStudent.id}
          currentStatus={changingStatusStudent.status}
          studentName={changingStatusStudent.fullName}
          onSuccess={() => {
            fetchStudents();
            fetchStats();
          }}
        />
      )}
    </DashboardLayout>
  );
}
