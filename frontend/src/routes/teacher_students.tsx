import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Eye, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/teacher_students')({
  component: TeacherStudentsPage,
  beforeLoad: () => requireAuth(['teacher']),
});

function TeacherStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(meta.page),
        limit: String(meta.limit),
      });
      if (search) query.set('search', search);
      const data = await api<any>(`/teachers/students?${query.toString()}`);
      setStudents(data.data || []);
      setMeta(data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [meta.page]);

  const handleSearch = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMeta({ ...meta, page: 1 });
    fetchStudents();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 tracking-widest uppercase mb-1">
              My Students
            </p>
            <h1 className="text-4xl font-extrabold text-emerald-950 dark:text-gray-100 font-serif">
              Students Directory
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl"
              />
            </div>
            <Button type="submit" className="h-11 px-6 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl">
              Search
            </Button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gender</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quran Level</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attendance</th>
                  <th className="text-right py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-900 mx-auto" />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No students found. Assign students to see them here.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 flex items-center justify-center font-bold text-lg text-emerald-800 dark:text-emerald-300">
                            {student.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-emerald-900 dark:text-gray-100">{student.fullName}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {student.gender === 'MALE' ? 'Male' : student.gender === 'FEMALE' ? 'Female' : 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-lg text-xs">
                          {student.level}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={cn(
                            'text-xs px-3 py-1 rounded-lg',
                            student.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : student.status === 'inactive'
                                ? 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
                          )}
                        >
                          {student.status === 'active' ? 'Active' : student.status === 'inactive' ? 'Inactive' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-20 bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${student.attendanceRate || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            {student.attendanceRate || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          asChild
                          className="h-9 px-4 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium"
                        >
                          <Link to="/teacher_students/$studentId" params={{ studentId: student.id }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">
                Showing {(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)} of {meta.total} students
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={meta.page === 1}
                  onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                  className="h-9 w-9 rounded-lg dark:border-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: meta.totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={meta.page === i + 1 ? 'default' : 'outline'}
                    onClick={() => setMeta({ ...meta, page: i + 1 })}
                    className={cn(
                      'h-9 w-9 rounded-lg font-medium',
                      meta.page === i + 1
                        ? 'bg-emerald-900 hover:bg-emerald-800 text-white'
                        : 'bg-transparent text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700',
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
                  className="h-9 w-9 rounded-lg dark:border-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
